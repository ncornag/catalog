import { Err, Ok, Result } from 'ts-results';
import { AppError, ErrorCode } from '@core/lib/appError';
import { Value } from '@sinclair/typebox/value';
import { nanoid } from 'nanoid';
import { type CatalogSync, UpdateCatalogSyncAction } from '@core/entities/catalogSync';
import { SyncCatalogBody, type CreateCatalogSyncBody } from '@infrastructure/http/schemas/catalogSync.schemas';
import { CatalogSyncDAO } from '@infrastructure/repositories/dao/catalogSync.dao.schema';
import { ActionHandlersList, actionHandlersList } from '@core/services/actions';
import { ICatalogSyncRepository } from '@core/repositories/catalogSync.repo';
import { UpdateEntityActionsRunner } from '@core/lib/updateEntityActionsRunner';
import { ChangeNameActionHandler } from './actions/changeName.handler';
import { ChangeDescriptionActionHandler } from './actions/changeDescription.handler';
import { Queue, Worker, Job } from 'bullmq';
var patch = require('mongo-update');

// SERVICE INTERFACE
interface ICatalogSyncService {
  createCatalogSync: (payload: CreateCatalogSyncBody) => Promise<Result<CatalogSync, AppError>>;
  updateCatalogSync: (id: string, version: number, actions: any) => Promise<Result<CatalogSync, AppError>>;
  findCatalogSyncById: (id: string) => Promise<Result<CatalogSync, AppError>>;
  saveCatalogSync: (category: CatalogSync) => Promise<Result<CatalogSync, AppError>>;
  syncCatalogs: (payload: SyncCatalogBody) => Promise<Result<string, AppError>>;
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
export const catalogSyncService = (server: any): ICatalogSyncService => {
  const ActionHandlers: ActionHandlersList = {
    changeName: new ChangeNameActionHandler(server),
    changeDescription: new ChangeDescriptionActionHandler(server)
  };
  const repo = server.db.repo.catalogSyncRepository as ICatalogSyncRepository;
  const actionsRunner = new UpdateEntityActionsRunner<CatalogSyncDAO, ICatalogSyncRepository>();
  const logCount = 1000;
  const productUpdatesQueue = new Queue('productUpdates', {
    connection: {
      host: 'localhost',
      port: 6379
    }
  });
  const worker = new Worker(
    'productUpdates',
    async (job: Job) => {
      let start = new Date().getTime();
      const sourceCol = server.db.col.product[job.data.sourceCatalog];
      const targetCol = server.db.col.product[job.data.targetCatalog];
      let updates = [];

      const productsToUpdate = await sourceCol.find({
        _id: {
          $in: job.data.products
        }
      });

      for await (const product of productsToUpdate) {
        const targetProductResult = await targetCol.find({ _id: product._id }).toArray();
        if (targetProductResult.length === 1) {
          // Product exists, generate update
          const update = patch(targetProductResult[0], product, {
            version: 0,
            createdAt: 0,
            lastModifiedAt: 0,
            catalog: 0
          });
          if (update.$set) {
            updates.push({
              updateOne: {
                filter: { _id: product._id, version: targetProductResult[0].version },
                update: update
              }
            });
          }
        } else if (targetProductResult.length === 0 && job.data.createNewItems === true) {
          // Product desn't exist, generate the insert if configured to do so in the sync
          product.catalog = job.data.targetCatalog;
          delete product.version;
          delete product.createdAt;
          delete product.lastModifiedAt;
          updates.push({
            insertOne: {
              document: product
            }
          });
        }
      }
      const result = await targetCol.bulkWrite(updates);
      let end = new Date().getTime();
      return { count: job.data.products.length, time: end - start };
    },
    {
      concurrency: 1000,
      connection: {
        host: 'localhost',
        port: 6379
      }
    }
  );
  worker.on('completed', (job: Job) => {
    console.log(`${job.id} has completed! ${job.returnvalue.count} products updated in ${job.returnvalue.time} ms`);
  });
  worker.on('failed', (job: Job, err) => {
    console.log(`${job.id} has failed with ${err.message}`);
  });
  process.on('SIGINT', async () => {
    await worker.close();
  });

  return {
    // CREATE CATALOGSYNC
    createCatalogSync: async (payload: CreateCatalogSyncBody): Promise<Result<CatalogSync, AppError>> => {
      // Save the entity
      const result = await repo.create({
        id: nanoid(),
        ...payload
      });
      if (result.err) return result;
      return new Ok(toEntity(result.val));
    },

    // UPDATE CATALOGSYNC
    updateCatalogSync: async (
      id: string,
      version: number,
      actions: UpdateCatalogSyncAction[]
    ): Promise<Result<CatalogSync, AppError>> => {
      // Find the Entity
      let result = await repo.findOne(id, version);
      if (result.err) return result;
      const entity: CatalogSyncDAO = result.val;
      const toUpdateEntity = Value.Clone(entity);
      // Execute actions
      const actionRunnerResults = await actionsRunner.run(entity, toUpdateEntity, repo, ActionHandlers, actions);
      if (actionRunnerResults.err) return actionRunnerResults;
      // Compute difference, and save if needed
      const difference = Value.Diff(entity, toUpdateEntity);
      if (difference.length > 0) {
        // Save the entity
        const saveResult = await repo.updateOne(id, version, actionRunnerResults.val.update);
        if (saveResult.err) return saveResult;
        toUpdateEntity.version = version + 1;
        // Send differences via messagging
        const messages = await server.messages; //rabbitMQProducer;
        messages.publish(server.config.EXCHANGE, server.config.AUDITLOG_ROUTE, {
          entity: 'catalogSync',
          source: entity,
          difference,
          metadata: { type: 'entityUpdate' }
        });
        // Send side effects via messagging
        actionRunnerResults.val.sideEffects?.forEach((sideEffect: any) => {
          messages.publish(server.config.EXCHANGE, sideEffect.action, {
            ...sideEffect.data,
            metadata: { type: sideEffect.action }
          });
        });
      }
      // Return udated entity
      return Ok(toEntity(toUpdateEntity));
    },

    // FIND CATALOGSYNC
    findCatalogSyncById: async (id: string): Promise<Result<CatalogSync, AppError>> => {
      const result = await repo.findOne(id);
      if (result.err) return result;
      return new Ok(toEntity(result.val));
    },

    // SAVE CATALOGSYNC
    saveCatalogSync: async (category: CatalogSync): Promise<Result<CatalogSync, AppError>> => {
      const result = await repo.save(category);
      if (result.err) return result;
      return new Ok(toEntity(result.val));
    },

    // SYNC CATALOGSYNC
    syncCatalogs: async (payload: SyncCatalogBody): Promise<Result<string, AppError>> => {
      // Find the Sync
      const catalogSyncResult = await repo.findOne(payload.id);
      if (catalogSyncResult.err) return catalogSyncResult;

      // Sync configuration
      const createNewItems = catalogSyncResult.val.createNewItems;
      const removeNonExistent = catalogSyncResult.val.removeNonExistent;

      // Hold the source and target catalogs
      const sourceCatalog = catalogSyncResult.val.sourceCatalog;
      const targetCatalog = catalogSyncResult.val.targetCatalog;
      const sourceCol = server.db.col.product[sourceCatalog];

      // Loop the source catalog products and sync them to the target catalog
      server.log.info(
        `Syncing catalog [${sourceCatalog}] to catalog [${targetCatalog}], start`,
        catalogSyncResult.val.lastSync
      );
      const productsToUpdate = await sourceCol.find(
        {
          $or: [
            { createdAt: { $gte: catalogSyncResult.val.lastSync } },
            { lastModifiedAt: { $gte: catalogSyncResult.val.lastSync } }
          ]
        },
        { projection: { _id: 1 } }
      );
      let count = 0;
      let start = new Date().getTime();
      let products = [];
      for await (const product of productsToUpdate) {
        products.push(product._id);
        count = count + 1;
        if (count % logCount === 0 && count > 0) {
          await productUpdatesQueue.add('updateProduct', {
            products,
            sourceCatalog,
            targetCatalog,
            createNewItems,
            removeNonExistent
          });
          let end = new Date().getTime();
          server.log.info(
            `Syncing catalog [${sourceCatalog}] to [${targetCatalog}], reading ${count} products to update in ${
              end - start
            } ms`
          );
          start = new Date().getTime();
          products = [];
        }
      }
      if (products.length > 0) {
        await productUpdatesQueue.add('updateProduct', {
          products,
          sourceCatalog,
          targetCatalog,
          createNewItems,
          removeNonExistent
        });
        let end = new Date().getTime();
        server.log.info(
          `Syncing catalog [${sourceCatalog}] to [${targetCatalog}], reading ${count} products to update in ${
            end - start
          } ms`
        );
      }

      // TODO: Remove non existent products in target if configured to do so in the sync
      if (removeNonExistent === true) {
        // This is a very expensive operation...
      }

      // Update CatalogSync lastSync
      const result = await repo.updateOne(catalogSyncResult.val._id, catalogSyncResult.val.version!, {
        $set: { lastSync: new Date().toISOString() }
      });
      if (result.err) return result;

      return new Ok('Done adding products to the update queue');
    }
  };
};
