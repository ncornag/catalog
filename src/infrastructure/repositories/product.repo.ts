import { Db, Collection } from '@fastify/mongodb/node_modules/mongodb/mongodb';
import { Ok, Err, Result } from 'ts-results';
import { ErrorCode, AppError } from '@core/lib/appError';
import { type IProductRepository } from '@core/repositories/product.repo';
import { Product } from '@core/entities/product';
import { ProductDAO } from '@infrastructure/repositories/dao/product.dao.schema';

export const getProductCollection = async (
  db: Db
): Promise<Collection<ProductDAO> | Record<string, Collection<ProductDAO>>> => {
  const catalogDb = db.collection('Catalog');
  const catalogs = await catalogDb.find({}).toArray();
  return catalogs.reduce((acc: any, catalog: any) => {
    acc[catalog._id] = db.collection<ProductDAO>(`Product${catalog.name}`);
    return acc;
  }, {});
};

export class ProductRepository implements IProductRepository {
  private col: Record<string, Collection<ProductDAO>>;

  constructor(server: any) {
    this.col = server.db.col.product;
  }

  // CREATE
  async create(catalogId: string, product: Product): Promise<Result<ProductDAO, AppError>> {
    const { id: _id, ...data } = product;
    const productDAO = { _id, ...data };
    if (productDAO.parent) productDAO.isBase = false;
    const catAwareCol = this.col[catalogId];
    product.catalog = catalogId;
    const result = await catAwareCol.insertOne(productDAO);
    if (!result || result.insertedId == '') {
      // TODO: Check if this is the correct way to check for succesul inserts
      return new Err(new AppError(ErrorCode.BAD_REQUEST, `Can't save product [${_id}]`));
    }
    return new Ok(productDAO);
  }

  // SAVE
  async save(catalogId: string, product: Product): Promise<Result<ProductDAO, AppError>> {
    const { id: _id, ...data } = product;
    const productDAO = { _id, ...data };
    const catAwareCol = this.col[catalogId];
    product.catalog = catalogId;
    const version = productDAO.version!;
    const result = await catAwareCol.updateOne({ _id }, { $set: productDAO });
    if (!result || result.modifiedCount != 1)
      return new Err(new AppError(ErrorCode.BAD_REQUEST, `Can't save product [${_id}]`));
    productDAO.version = version + 1;
    return new Ok(productDAO);
  }

  // UPDATE ONE
  async updateOne(catalogId: string, id: string, productVersion: number, update: any): Promise<Result<any, AppError>> {
    const catAwareCol = this.col[catalogId];
    const result = await catAwareCol.updateOne(
      {
        _id: id,
        version: productVersion
      },
      update
    );
    if (result.modifiedCount != 1) return new Err(new AppError(ErrorCode.BAD_REQUEST, `Can't update product.`));
    return new Ok({});
  }

  // UPDATE MANY
  async update(catalogId: string, filter: any, update: any): Promise<Result<any, AppError>> {
    const catAwareCol = this.col[catalogId];
    const result = await catAwareCol.updateMany(filter, update);
    // TODO Handle errors
    //if (result.ok != 1) return new Err(new AppError(ErrorCode.BAD_REQUEST, `Can't update categories.`));
    return new Ok({});
  }

  // FIND ONE
  async findOne(catalogId: string, id: string, version?: number): Promise<Result<ProductDAO, AppError>> {
    const filter: any = { _id: id };
    if (version !== undefined) filter.version = version;
    const catAwareCol = this.col[catalogId];
    const entity = await catAwareCol.findOne(filter);
    if (!entity) {
      return new Err(new AppError(ErrorCode.BAD_REQUEST, `Can't find product with id [${id}]`));
    }
    return new Ok(entity);
  }

  // FIND MANY
  async find(catalogId: string, query: any, options: any): Promise<Result<ProductDAO[], AppError>> {
    // TODO: Add query limit
    const catAwareCol = this.col[catalogId];
    const entities = await catAwareCol.find(query, options).toArray();
    return new Ok(entities);
  }

  // AGGREGATE
  async aggregate(catalogId: string, pipeline: any[], options: any): Promise<Result<any, AppError>> {
    const result: any[] = [];
    const catAwareCol = this.col[catalogId];
    const cursor = catAwareCol.aggregate(pipeline, options);
    for await (const doc of cursor) {
      result.push(doc);
    }
    return new Ok(result);
  }
}
