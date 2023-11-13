import { Err, Ok, Result } from 'ts-results';
import { AppError, ErrorCode } from '@core/lib/appError';
import { Value } from '@sinclair/typebox/value';
import { nanoid } from 'nanoid';
import { type Catalog, UpdateCatalogAction } from '@core/entities/catalog';
import { type CreateCatalogBody } from '@infrastructure/http/schemas/catalog.schemas';
import { CatalogDAO } from '@infrastructure/repositories/dao/catalog.dao.schema';
import { ActionHandlersList, actionHandlersList } from '@core/services/actions';
import { ICatalogRepository } from '@core/repositories/catalog.repo';
import { UpdateEntityActionsRunner } from '@core/lib/updateEntityActionsRunner';
import { ChangeNameActionHandler } from './actions/changeName.handler';
import { ChangeDescriptionActionHandler } from './actions/changeDescription.handler';

// SERVICE INTERFACE
interface ICatalogService {
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
export const catalogService = (server: any): ICatalogService => {
  const ActionHandlers: ActionHandlersList = {
    changeName: new ChangeNameActionHandler(server),
    changeDescription: new ChangeDescriptionActionHandler(server)
  };
  const repo = server.db.repo.catalogRepository as ICatalogRepository;
  const actionsRunner = new UpdateEntityActionsRunner<CatalogDAO, ICatalogRepository>();
  return {
    // CREATE CATALOG
    createCatalog: async (payload: CreateCatalogBody): Promise<Result<Catalog, AppError>> => {
      // Save the entity
      const result = await repo.create({
        id: nanoid(),
        ...payload
      });
      if (result.err) return result;
      return new Ok(toEntity(result.val));
    },

    // UPDATE CATALOG
    updateCatalog: async (
      id: string,
      version: number,
      actions: UpdateCatalogAction[]
    ): Promise<Result<Catalog, AppError>> => {
      // Find the Entity
      let result = await repo.findOne(id, version);
      if (result.err) return result;
      const entity: CatalogDAO = result.val;
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
        messages.publish(server.config.EXCHANGE, server.config.ENTITY_UPDATE_ROUTE, {
          entity: 'catalog',
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

    // FIND CATALOG
    findCatalogById: async (id: string): Promise<Result<Catalog, AppError>> => {
      const result = await repo.findOne(id);
      if (result.err) return result;
      return new Ok(toEntity(result.val));
    },

    // SAVE CATALOG
    saveCatalog: async (category: Catalog): Promise<Result<Catalog, AppError>> => {
      const result = await repo.save(category);
      if (result.err) return result;
      return new Ok(toEntity(result.val));
    }
  };
};
