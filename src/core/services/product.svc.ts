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
  createProduct: (catalogId: string, payload: CreateProductBody) => Promise<Result<Product, AppError>>;
  updateProduct: (catalogId: string, id: string, version: number, actions: any) => Promise<Result<Product, AppError>>;
  findProductById: (catalogId: string, id: string, materialized: boolean) => Promise<Result<Product, AppError>>;
  saveProduct: (catalogId: string, category: Product) => Promise<Result<Product, AppError>>;
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
    // CREATE PRODUCT
    createProduct: async (catalogId: string, payload: CreateProductBody): Promise<Result<Product, AppError>> => {
      // Save the entity
      const result = await repo.create(catalogId, {
        id: nanoid(),
        ...payload
      } as Product);
      if (result.err) return result;
      return new Ok(toEntity(result.val));
    },

    // UPDATE PRODUCT
    updateProduct: async (
      catalogId: string,
      id: string,
      version: number,
      actions: UpdateProductAction[]
    ): Promise<Result<Product, AppError>> => {
      // Find the Entity
      let result = await repo.findOne(catalogId, id, version);
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
        const saveResult = await repo.updateOne(catalogId, id, version, actionRunnerResults.val.update);
        if (saveResult.err) return saveResult;
        toUpdateEntity.version = version + 1;
        // Send differences via messagging
        const messages = await server.messages; //rabbitMQProducer;
        messages.publish(server.config.EXCHANGE, server.config.AUDITLOG_ROUTE, {
          entity: 'product',
          catalogId,
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

    // FIND PRODUCT BY ID
    findProductById: async (
      catalogId: string,
      id: string,
      materialized: boolean = false
    ): Promise<Result<Product, AppError>> => {
      if (!!materialized === false) {
        const result = await repo.findOne(catalogId, id);
        if (result.err) return result;
        return new Ok(toEntity(result.val));
      } else {
        const result = await repo.aggregate(catalogId, [
          { $match: { _id: id } },
          {
            $lookup: {
              from: server.db.col.product[catalogId].collectionName,
              localField: '_id',
              foreignField: 'parent',
              as: 'variants'
            }
          },
          {
            $lookup: {
              from: server.db.col.product[catalogId].collectionName,
              localField: 'parent',
              foreignField: '_id',
              as: 'base'
            }
          }
        ]);
        if (result.err) return result;
        const entity = result.val[0];
        if (entity.isBase === true) {
          delete entity.base;
        } else {
          if (!entity.name) entity.name = entity.base[0].name;
          entity.searchKeywords.push(...entity.base[0].searchKeywords);
          delete entity.base;
          delete entity.variants;
        }
        return new Ok(toEntity(entity));
      }
    },

    // SAVE PRODUCT
    saveProduct: async (catalogId: string, category: Product): Promise<Result<Product, AppError>> => {
      const result = await repo.save(catalogId, category);
      if (result.err) return result;
      return new Ok(toEntity(result.val));
    }
  };
};
