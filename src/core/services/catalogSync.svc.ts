import { Err, Ok, Result } from 'ts-results';
import { AppError, ErrorCode } from '@core/lib/appError';
import { Value } from '@sinclair/typebox/value';
import { nanoid } from 'nanoid';
import { type CatalogSync, UpdateCatalogSyncAction } from '@core/entities/catalogSync';
import { SyncCatalogBody, type CreateCatalogSyncBody } from '@infrastructure/http/schemas/catalogSync.schemas';
import { CatalogSyncDAO } from '@infrastructure/repositories/dao/catalogSync.dao.schema';
import { ActionHandlersList } from '@core/services/actions';
import { ICatalogSyncRepository } from '@core/repositories/catalogSync.repo';
import { UpdateEntityActionsRunner } from '@core/lib/updateEntityActionsRunner';
import { ChangeNameActionHandler } from './actions/changeName.handler';
import { ChangeDescriptionActionHandler } from './actions/changeDescription.handler';
import { Config } from '@infrastructure/http/plugins/config';
var patch = require('mongo-update');

// SERVICE INTERFACE
export interface ICatalogSyncService {
  createCatalogSync: (payload: CreateCatalogSyncBody) => Promise<Result<CatalogSync, AppError>>;
  updateCatalogSync: (id: string, version: number, actions: any) => Promise<Result<CatalogSync, AppError>>;
  findCatalogSyncById: (id: string) => Promise<Result<CatalogSync, AppError>>;
  saveCatalogSync: (category: CatalogSync) => Promise<Result<CatalogSync, AppError>>;
  syncCatalogs: (payload: SyncCatalogBody) => Promise<Result<boolean, AppError>>;
}

const toEntity = ({ _id, ...remainder }: CatalogSyncDAO): CatalogSync => ({
  id: _id,
  ...remainder
});

const mongoPatch = function (patch: any) {
  let query: any = {};
  let set: any = {};

  if ('object' === typeof patch) {
    for (var key in patch) {
      const entry = patch[key];

      if (entry['@op'] == 'SwapValue') {
        query[key] = entry['@before'];
        set[key] = entry['@after'];
      } else if (key === '_id') {
        query[key] = entry;
      } else {
        let [sub_query, sub_set] = mongoPatch(entry);
        query[key] = sub_query;
        if (!sub_set === null) {
          set[key] = sub_set;
        }
      }
    }
    return [query, set];
  } else {
    return [patch, null];
  }
};

// SERVICE IMPLEMENTATION
export class CatalogSyncService implements ICatalogSyncService {
  private static instance: ICatalogSyncService;
  private repo: ICatalogSyncRepository;
  private cols;
  private actionHandlers: ActionHandlersList;
  private actionsRunner: UpdateEntityActionsRunner<CatalogSyncDAO, ICatalogSyncRepository>;
  private config: Config;
  private messages;
  private log;
  private batchSize = 1000;

  private constructor(server: any) {
    this.repo = server.db.repo.catalogSyncRepository as ICatalogSyncRepository;
    this.cols = server.db.col.product;
    this.actionHandlers = {
      changeName: new ChangeNameActionHandler(server),
      changeDescription: new ChangeDescriptionActionHandler(server)
    };
    this.actionsRunner = new UpdateEntityActionsRunner<CatalogSyncDAO, ICatalogSyncRepository>();
    this.config = server.config;
    this.messages = server.messages;
    this.log = server.log;
  }

  public static getInstance(server: any): ICatalogSyncService {
    if (!CatalogSyncService.instance) {
      CatalogSyncService.instance = new CatalogSyncService(server);
    }
    return CatalogSyncService.instance;
  }

  // CREATE CATALOGSYNC
  public async createCatalogSync(payload: CreateCatalogSyncBody): Promise<Result<CatalogSync, AppError>> {
    // Save the entity
    const result = await this.repo.create({
      id: nanoid(),
      ...payload
    });
    if (result.err) return result;
    return new Ok(toEntity(result.val));
  }

  // UPDATE CATALOGSYNC
  public async updateCatalogSync(
    id: string,
    version: number,
    actions: UpdateCatalogSyncAction[]
  ): Promise<Result<CatalogSync, AppError>> {
    // Find the Entity
    let result = await this.repo.findOne(id, version);
    if (result.err) return result;
    const entity: CatalogSyncDAO = result.val;
    const toUpdateEntity = Value.Clone(entity);
    // Execute actions
    const actionRunnerResults = await this.actionsRunner.run(
      entity,
      toUpdateEntity,
      this.repo,
      this.actionHandlers,
      actions
    );
    if (actionRunnerResults.err) return actionRunnerResults;
    // Compute difference, and save if needed
    const difference = Value.Diff(entity, toUpdateEntity);
    if (difference.length > 0) {
      // Save the entity
      const saveResult = await this.repo.updateOne(id, version, actionRunnerResults.val.update);
      if (saveResult.err) return saveResult;
      toUpdateEntity.version = version + 1;
      // Send differences via messagging
      this.messages.publish(this.config.EXCHANGE, this.config.ENTITY_UPDATE_ROUTE, {
        entity: 'catalogSync',
        source: entity,
        difference,
        metadata: { type: 'entityUpdate' }
      });
      // Send side effects via messagging
      actionRunnerResults.val.sideEffects?.forEach((sideEffect: any) => {
        this.messages.publish(this.config.EXCHANGE, sideEffect.action, {
          ...sideEffect.data,
          metadata: { type: sideEffect.action }
        });
      });
    }
    // Return udated entity
    return Ok(toEntity(toUpdateEntity));
  }

  // FIND CATALOGSYNC
  public async findCatalogSyncById(id: string): Promise<Result<CatalogSync, AppError>> {
    const result = await this.repo.findOne(id);
    if (result.err) return result;
    return new Ok(toEntity(result.val));
  }

  // SAVE CATALOGSYNC
  public async saveCatalogSync(category: CatalogSync): Promise<Result<CatalogSync, AppError>> {
    const result = await this.repo.save(category);
    if (result.err) return result;
    return new Ok(toEntity(result.val));
  }

  // SYNC CATALOGSYNC
  public async syncCatalogs(payload: SyncCatalogBody): Promise<Result<boolean, AppError>> {
    // Find the Sync
    const catalogSyncResult = await this.repo.findOne(payload.id);
    if (catalogSyncResult.err) return catalogSyncResult;
    // Sync configuration
    const createNewItems = catalogSyncResult.val.createNewItems;
    const removeNonExistent = catalogSyncResult.val.removeNonExistent;
    // Hold the source and target catalogs
    const sourceCatalog = catalogSyncResult.val.sourceCatalog;
    const targetCatalog = catalogSyncResult.val.targetCatalog;
    const sourceCol = this.cols[sourceCatalog];
    const targetCol = this.cols[targetCatalog];
    // Loop the source catalog products and sync them to the target catalog
    this.log.info(
      `Syncing catalog [${sourceCatalog}] to catalog [${targetCatalog}], start`,
      catalogSyncResult.val.lastSync
    );
    const productsToUpdate = await sourceCol.find({
      $or: [
        { createdAt: { $gte: catalogSyncResult.val.lastSync } },
        { lastModifiedAt: { $gte: catalogSyncResult.val.lastSync } }
      ]
    });
    let count = 0;
    let start = new Date().getTime();
    let updates = [];
    for await (const product of productsToUpdate) {
      const productId = product._id;
      const targetProductResult = await targetCol.find({ _id: productId }).toArray();
      if (targetProductResult.length === 1) {
        // Product exists, update
        const update = patch(targetProductResult[0], product, {
          version: 0,
          createdAt: 0,
          lastModifiedAt: 0,
          catalog: 0
        });
        if (update.$set) {
          const u = {
            updateOne: {
              filter: { _id: productId, version: targetProductResult[0].version },
              update: update
            }
          };
          updates.push(u);
          count = count + 1;
        }
      } else if (targetProductResult.length === 0 && createNewItems === true) {
        // Product desn't exist, insert if configured to do so in the sync
        product.catalog = targetCatalog;
        delete product.version;
        delete product.createdAt;
        delete product.lastModifiedAt;
        const u = {
          insertOne: {
            document: product
          }
        };
        updates.push(u);
        count = count + 1;
      }
      if (count % this.batchSize === 0 && count > 0) {
        const result = await targetCol.bulkWrite(updates);
        let end = new Date().getTime();
        this.log.info(
          `Syncing catalog [${sourceCatalog}] to catalog [${targetCatalog}], updated ${count} products at ${(
            (this.batchSize * 1000) /
            (end - start)
          ).toFixed()} products/second`
        );
        start = new Date().getTime();
        updates = [];
      }
    }
    if (updates.length > 0) {
      const result = await targetCol.bulkWrite(updates);
      let end = new Date().getTime();
      this.log.info(
        `Syncing catalog [${sourceCatalog}] to catalog [${targetCatalog}], updated ${count} products at ${(
          (this.batchSize * 1000) /
          (end - start)
        ).toFixed()} products/second`
      );
    }

    // TODO: Remove non existent products in target if configured to do so in the sync
    if (removeNonExistent === true) {
    }

    this.log.info(`Syncing catalog [${sourceCatalog}] to catalog [${targetCatalog}], end`);

    // Update the last sync time
    const result = await this.repo.updateOne(catalogSyncResult.val._id, catalogSyncResult.val.version!, {
      $set: { lastSync: new Date().toISOString() }
    });
    if (result.err) return result;
    return new Ok(true);
  }
}
