import { Err, Ok, Result } from 'ts-results';
import { AppError, ErrorCode } from '@core/lib/appError';
import { Value } from '@sinclair/typebox/value';
import { nanoid } from 'nanoid';
import { type Product, UpdateProductAction, ProductType } from '@core/entities/product';
import { type CreateProductBody } from '@infrastructure/http/schemas/product.schemas';
import { ProductDAO } from '@infrastructure/repositories/dao/product.dao.schema';
import { ActionHandlersList } from '@core/services/actions';
import { IProductRepository } from '@core/repositories/product.repo';
import { UpdateEntityActionsRunner } from '@core/lib/updateEntityActionsRunner';
import { ChangeNameActionHandler } from './actions/changeName.handler';
import { ChangeDescriptionActionHandler } from './actions/changeDescription.handler';
import { Config } from '@infrastructure/http/plugins/config';

// SERVICE INTERFACE
export interface IProductService {
  createProduct: (catalogId: string, payload: CreateProductBody) => Promise<Result<Product, AppError>>;
  updateProduct: (catalogId: string, id: string, version: number, actions: any) => Promise<Result<Product, AppError>>;
  findProductById: (catalogId: string, id: string, materialized: boolean) => Promise<Result<Product, AppError>>;
}

const toEntity = ({ _id, ...remainder }: ProductDAO): Product => ({
  id: _id,
  ...remainder
});

// SERVICE IMPLEMENTATION
export class ProductService implements IProductService {
  private static instance: IProductService;
  private repo: IProductRepository;
  private cols;
  private actionHandlers: ActionHandlersList;
  private actionsRunner: UpdateEntityActionsRunner<ProductDAO, IProductRepository>;
  private config: Config;
  private messages;

  private constructor(server: any) {
    this.repo = server.db.repo.productRepository as IProductRepository;
    this.cols = server.db.col.product;
    this.actionHandlers = {
      changeName: new ChangeNameActionHandler(server),
      changeDescription: new ChangeDescriptionActionHandler(server)
    };
    this.actionsRunner = new UpdateEntityActionsRunner<ProductDAO, IProductRepository>();
    this.config = server.config;
    this.messages = server.messages;
  }

  public static getInstance(server: any): IProductService {
    if (!ProductService.instance) {
      ProductService.instance = new ProductService(server);
    }
    return ProductService.instance;
  }

  // CREATE PRODUCT
  public async createProduct(catalogId: string, payload: CreateProductBody): Promise<Result<Product, AppError>> {
    // Save the entity
    const result = await this.repo.create(catalogId, {
      id: nanoid(),
      ...payload
    } as Product);
    if (result.err) return result;
    // Send new entity via messagging
    this.messages.publish(this.config.EXCHANGE, this.config.ENTITY_UPDATE_ROUTE, {
      source: toEntity(result.val),
      metadata: {
        catalogId,
        type: 'entityInsert',
        entity: 'product'
      }
    });
    // Return new entity
    return new Ok(toEntity(result.val));
  }

  // UPDATE PRODUCT
  public async updateProduct(
    catalogId: string,
    id: string,
    version: number,
    actions: UpdateProductAction[]
  ): Promise<Result<Product, AppError>> {
    // Find the Entity
    let result = await this.repo.findOne(catalogId, id, version);
    if (result.err) return result;
    const entity: ProductDAO = result.val;
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
    const edits = Value.Diff(entity, toUpdateEntity);
    if (edits.length > 0) {
      // Save the entity
      const saveResult = await this.repo.updateOne(catalogId, id, version, actionRunnerResults.val.update);
      if (saveResult.err) return saveResult;
      toUpdateEntity.version = version + 1;
      // Send differences via messagging
      this.messages.publish(this.config.EXCHANGE, this.config.ENTITY_UPDATE_ROUTE, {
        source: toEntity(result.val),
        difference: edits,
        metadata: {
          catalogId,
          type: 'entityUpdate',
          entity: 'product'
        }
      });
      // Send side effects via messagging
      actionRunnerResults.val.sideEffects?.forEach((sideEffect: any) => {
        this.messages.publish(this.config.EXCHANGE, sideEffect.action, {
          ...sideEffect.data,
          metadata: { type: sideEffect.action }
        });
      });
    }
    // Return updated entity
    return Ok(toEntity(toUpdateEntity));
  }

  // FIND PRODUCT BY ID
  public async findProductById(
    catalogId: string,
    id: string,
    materialized: boolean = false
  ): Promise<Result<Product, AppError>> {
    if (!!materialized === false) {
      const result = await this.repo.findOne(catalogId, id);
      if (result.err) return result;
      return new Ok(toEntity(result.val));
    } else {
      const result = await this.repo.aggregate(catalogId, [
        { $match: { _id: id } },
        {
          $lookup: {
            from: this.cols[catalogId].collectionName,
            localField: '_id',
            foreignField: 'parent',
            as: 'variants'
          }
        },
        {
          $lookup: {
            from: this.cols[catalogId].collectionName,
            localField: 'parent',
            foreignField: '_id',
            as: 'base'
          }
        },
        {
          $project: {
            'variants.parent': 0,
            'variants.catalog': 0,
            'variants.projectId': 0,
            'variants.createdAt': 0,
            'variants.lastModifiedAt': 0,
            'variants.version': 0
          }
        }
      ]);
      if (result.err) return result;
      const entity = result.val[0];
      if (entity.type === ProductType.BASE) {
        delete entity.base;
      } else if (entity.type === ProductType.VARIANT) {
        entity.inheritedFields = [];
        if (!entity.name) {
          entity.name = entity.base[0].name;
          entity.inheritedFields.push('name');
        }
        if (entity.base[0].searchKeywords.length > 0) {
          (entity.searchKeywords ?? (entity.searchKeywords = [])).concat(entity.base[0].searchKeywords);
          entity.inheritedFields.push('searchKeywords');
        }
        if (entity.base[0].categories.length > 0) {
          (entity.categories ?? (entity.categories = [])).concat(entity.base[0].categories);
          entity.inheritedFields.push('categories');
        }
        delete entity.base;
        delete entity.variants;
      }
      return new Ok(toEntity(entity));
    }
  }
}
