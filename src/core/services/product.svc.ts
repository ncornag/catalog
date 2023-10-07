import { Err, Ok, Result } from 'ts-results';
import { AppError, ErrorCode } from '@core/lib/appError';
import { Value } from '@sinclair/typebox/value';
import { nanoid } from 'nanoid';
import { type Product, UpdateProductAction } from '@core/entities/product';
import { type CreateProductBody } from '@infrastructure/http/schemas/product.schemas';
import { ProductDAO } from '@infrastructure/repositories/dao/product.dao.schema';
import { ActionHandlersList, actionHandlersList } from '@core/services/actions';
import { IProductRepository } from '@core/repositories/product.repo';
import { UpdateEntityActionsRunner } from '@core/lib/updateEntityActionsRunner';
import { ChangeNameActionHandler } from './actions/changeName.handler';
import { ChangeDescriptionActionHandler } from './actions/changeDescription.handler';

// SERVICE INTERFACE
interface IProductService {
  createProduct: (payload: CreateProductBody) => Promise<Result<Product, AppError>>;
  updateProduct: (id: string, version: number, actions: any) => Promise<Result<Product, AppError>>;
  findProductById: (id: string) => Promise<Result<Product, AppError>>;
  saveProduct: (category: Product) => Promise<Result<Product, AppError>>;
  validate: (id: string, data: any) => Promise<Result<any, AppError>>;
}

const toEntity = ({ _id, ...remainder }: ProductDAO): Product => ({
  id: _id,
  ...remainder
});

// SERVICE IMPLEMENTATION
export const productService = (server: any): IProductService => {
  const ActionHandlers: ActionHandlersList = {
    changeName: new ChangeNameActionHandler(server),
    changeDescription: new ChangeDescriptionActionHandler(server)
  };
  const repo = server.db.repo.productRepository as IProductRepository;
  const actionsRunner = new UpdateEntityActionsRunner<ProductDAO, IProductRepository>();
  return {
    // CREATE CATEGORY
    createProduct: async (payload: CreateProductBody): Promise<Result<Product, AppError>> => {
      // Save the entity
      const result = await repo.create({
        id: nanoid(),
        ...payload
      });
      if (result.err) return result;
      return new Ok(toEntity(result.val));
    },

    // UPDATE CATEGORY
    updateProduct: async (
      id: string,
      version: number,
      actions: UpdateProductAction[]
    ): Promise<Result<Product, AppError>> => {
      // Find the Entity
      let result = await repo.findOne(id, version);
      if (result.err) return result;
      const entity: ProductDAO = result.val;
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
          entity: 'product',
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
    findProductById: async (id: string): Promise<Result<Product, AppError>> => {
      const result = await repo.findOne(id);
      if (result.err) return result;
      return new Ok(toEntity(result.val));
    },

    // SAVE  CATEGORY
    saveProduct: async (category: Product): Promise<Result<Product, AppError>> => {
      const result = await repo.save(category);
      if (result.err) return result;
      return new Ok(toEntity(result.val));
    },

    // VALIDATE
    validate: async (id: string, data: any): Promise<Result<any, AppError>> => {
      let schemaResult: Result<any, AppError> = await server.validator.getProductSchema(id);
      if (!schemaResult.ok) return new Err(schemaResult.val);
      const validation: Result<any, AppError> = server.validator.validate(schemaResult.val.jsonSchema, data);
      if (!validation.ok) return new Err(validation.val);
      return new Ok({ ok: true });
    }
  };
};
