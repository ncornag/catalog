import { Err, Ok, Result } from 'ts-results';
import { AppError, ErrorCode } from '@core/lib/appError';
import { Value } from '@sinclair/typebox/value';
import { nanoid } from 'nanoid';
import { type ProductCategory, UpdateProductCategoryAction } from '@core/entities/productCategory';
import { type CreateProductCategoryBody } from '@infrastructure/http/schemas/productCategory.schemas';
import { ProductCategoryDAO } from '@infrastructure/repositories/dao/productCategory.dao.schema';
import { ActionHandlersList, actionHandlersList } from '@core/services/actions';
import { IProductCategoryRepository } from '@core/repositories/productCategory.repo';
import { SetKeyActionHandler } from './actions/setKey.handler';
import { ChangeNameActionHandler } from './actions/changeName.handler';
import { ChangeParentActionHandler } from '@core/lib/tree';
import { UpdateEntityActionsRunner } from '@core/lib/updateEntityActionsRunner';

// SERVICE INTERFACE
interface IProductCategoryService {
  createProductCategory: (payload: CreateProductCategoryBody) => Promise<Result<ProductCategory, AppError>>;
  updateProductCategory: (id: string, version: number, actions: any) => Promise<Result<ProductCategory, AppError>>;
  findProductCategoryById: (id: string) => Promise<Result<ProductCategory, AppError>>;
  saveProductCategory: (category: ProductCategory) => Promise<Result<ProductCategory, AppError>>;
  validate: (id: string, data: any) => Promise<Result<any, AppError>>;
}

const toEntity = ({ _id, ...remainder }: ProductCategoryDAO): ProductCategory => ({
  id: _id,
  ...remainder
});

// SERVICE IMPLEMENTATION
export const productCategoryService = (server: any): IProductCategoryService => {
  const ActionHandlers: ActionHandlersList = {
    setKey: new SetKeyActionHandler(server),
    changeName: new ChangeNameActionHandler(server),
    changeParent: new ChangeParentActionHandler(server)
  };
  const repo = server.db.repo.productCategoryRepository as IProductCategoryRepository;
  const actionsRunner = new UpdateEntityActionsRunner<ProductCategoryDAO, IProductCategoryRepository>();
  return {
    // CREATE CATEGORY
    createProductCategory: async (payload: CreateProductCategoryBody): Promise<Result<ProductCategory, AppError>> => {
      // Add ancestors
      if (payload.parent) {
        const actionResult = await ActionHandlers['changeParent'].run(
          {} as ProductCategoryDAO,
          payload as ProductCategoryDAO,
          { action: 'changeParent', parent: payload.parent },
          repo
        );
        if (actionResult.err) return actionResult;
      }
      // Save the entity
      const result = await repo.create({
        id: nanoid(),
        ...payload
      });
      if (result.err) return result;
      return new Ok(toEntity(result.val));
    },

    // UPDATE CATEGORY
    updateProductCategory: async (
      id: string,
      version: number,
      actions: UpdateProductCategoryAction[]
    ): Promise<Result<ProductCategory, AppError>> => {
      // Find the Entity
      let result = await repo.findOne(id, version);
      if (result.err) return result;
      const entity: ProductCategoryDAO = result.val;
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
          entity: 'productCategory',
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

    // FIND CATEGORY
    findProductCategoryById: async (id: string): Promise<Result<ProductCategory, AppError>> => {
      const result = await repo.findOne(id);
      if (result.err) return result;
      return new Ok(toEntity(result.val));
    },

    // SAVE  CATEGORY
    saveProductCategory: async (category: ProductCategory): Promise<Result<ProductCategory, AppError>> => {
      const result = await repo.save(category);
      if (result.err) return result;
      return new Ok(toEntity(result.val));
    },

    // VALIDATE
    validate: async (id: string, data: any): Promise<Result<any, AppError>> => {
      let schemaResult: Result<any, AppError> = await server.validator.getProductCategorySchema(id);
      if (!schemaResult.ok) return new Err(schemaResult.val);
      const validation: Result<any, AppError> = server.validator.validate(schemaResult.val.jsonSchema, data);
      if (!validation.ok) return new Err(validation.val);
      return new Ok({ ok: true });
    }
  };
};
