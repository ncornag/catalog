import { Err, Ok, Result } from 'ts-results';
import { AppError, ErrorCode } from '@core/lib/appError';
import { Value } from '@sinclair/typebox/value';
import { nanoid } from 'nanoid';
import { type Catalog, UpdateCatalogAction } from '@core/entities/catalog';
import { type CreateCatalogBody } from '@infrastructure/http/schemas/catalog.schemas';
import { CatalogDAO } from '@infrastructure/repositories/dao/catalog.dao.schema';
import { ActionHandlersList } from '@core/services/actions';
import { ICatalogRepository } from '@core/repositories/catalog.repo';
import { UpdateEntityActionsRunner } from '@core/lib/updateEntityActionsRunner';
import { ChangeNameActionHandler } from './actions/changeName.handler';
import { ChangeDescriptionActionHandler } from './actions/changeDescription.handler';
import { Config } from '@infrastructure/http/plugins/config';

// SERVICE INTERFACE
export interface ICatalogService {
  createCatalog: (payload: CreateCatalogBody) => Promise<Result<Catalog, AppError>>;
  updateCatalog: (id: string, version: number, actions: any) => Promise<Result<Catalog, AppError>>;
  findCatalogById: (id: string) => Promise<Result<Catalog, AppError>>;
  saveCatalog: (category: Catalog) => Promise<Result<Catalog, AppError>>;
}

const toEntity = ({ _id, ...remainder }: CatalogDAO): Catalog => ({
  id: _id,
  ...remainder
});

// SERVICE IMPLEMENTATION
export class CatalogService implements ICatalogService {
  private static instance: ICatalogService;
  private repo: ICatalogRepository;
  private actionHandlers: ActionHandlersList;
  private actionsRunner: UpdateEntityActionsRunner<CatalogDAO, ICatalogRepository>;
  private config: Config;
  private messages;

  private constructor(server: any) {
    this.repo = server.db.repo.catalogRepository as ICatalogRepository;
    this.actionHandlers = {
      changeName: new ChangeNameActionHandler(server),
      changeDescription: new ChangeDescriptionActionHandler(server)
    };
    this.actionsRunner = new UpdateEntityActionsRunner<CatalogDAO, ICatalogRepository>();
    this.config = server.config;
    this.messages = server.messages;
  }

  public static getInstance(server: any): ICatalogService {
    if (!CatalogService.instance) {
      CatalogService.instance = new CatalogService(server);
    }
    return CatalogService.instance;
  }

  // CREATE CATALOG
  public async createCatalog(payload: CreateCatalogBody): Promise<Result<Catalog, AppError>> {
    // Save the entity
    const result = await this.repo.create({
      id: nanoid(),
      ...payload
    });
    if (result.err) return result;
    return new Ok(toEntity(result.val));
  }

  // UPDATE CATALOG
  public async updateCatalog(
    id: string,
    version: number,
    actions: UpdateCatalogAction[]
  ): Promise<Result<Catalog, AppError>> {
    // Find the Entity
    let result = await this.repo.findOne(id, version);
    if (result.err) return result;
    const entity: CatalogDAO = result.val;
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
        entity: 'catalog',
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

  // FIND CATALOG
  public async findCatalogById(id: string): Promise<Result<Catalog, AppError>> {
    const result = await this.repo.findOne(id);
    if (result.err) return result;
    return new Ok(toEntity(result.val));
  }

  // SAVE CATALOG
  public async saveCatalog(category: Catalog): Promise<Result<Catalog, AppError>> {
    const result = await this.repo.save(category);
    if (result.err) return result;
    return new Ok(toEntity(result.val));
  }
}
