import { Db, Collection } from '@fastify/mongodb/node_modules/mongodb/mongodb';
import { Ok, Err, Result } from 'ts-results';
import { ErrorCode, AppError } from '@core/lib/appError';
import { type ICatalogRepository } from '@core/repositories/catalog.repo';
import { Catalog } from '@core/entities/catalog';
import { CatalogDAO } from '@infrastructure/repositories/dao/catalog.dao.schema';
import { ITreeRepo } from '@core/lib/tree';

export const getCatalogCollection = (db: Db): Collection<CatalogDAO> => {
  return db.collection<CatalogDAO>('Catalog');
};

export class CatalogRepository implements ICatalogRepository, ITreeRepo<CatalogDAO> {
  private col: Collection<CatalogDAO>;

  constructor(server: any) {
    this.col = server.db.col.catalog;
  }

  // CREATE CATALOG
  async create(catalog: Catalog): Promise<Result<CatalogDAO, AppError>> {
    const { id: _id, ...data } = catalog;
    const catalogDAO = { _id, ...data };
    const result = await this.col.insertOne(catalogDAO);
    if (!result || result.insertedId == '')
      // TODO: Check if this is the correct way to check for succesul inserts
      return new Err(new AppError(ErrorCode.BAD_REQUEST, `Can't save catalog [${_id}]`));
    return new Ok(catalogDAO);
  }

  // SAVE CATALOG
  async save(catalog: Catalog): Promise<Result<CatalogDAO, AppError>> {
    const { id: _id, ...data } = catalog;
    const catalogDAO = { _id, ...data };
    const version = catalogDAO.version!;
    const result = await this.col.updateOne({ _id }, { $set: catalogDAO });
    if (!result || result.modifiedCount != 1)
      return new Err(new AppError(ErrorCode.BAD_REQUEST, `Can't save catalog [${_id}]`));
    catalogDAO.version = version + 1;
    return new Ok(catalogDAO);
  }

  // UPDATE ONE CATALOG
  async updateOne(id: string, catalogVersion: number, update: any): Promise<Result<any, AppError>> {
    const result = await this.col.updateOne(
      {
        _id: id,
        version: catalogVersion
      },
      update
    );
    if (result.modifiedCount != 1) return new Err(new AppError(ErrorCode.BAD_REQUEST, `Can't update catalog.`));
    return new Ok({});
  }

  // UPDATE MANY CATEGORIES
  async update(filter: any, update: any): Promise<Result<any, AppError>> {
    const result = await this.col.updateMany(filter, update);
    // TODO Handle errors
    //if (result.ok != 1) return new Err(new AppError(ErrorCode.BAD_REQUEST, `Can't update categories.`));
    return new Ok({});
  }

  // FIND ONE CATALOG
  async findOne(id: string, version?: number): Promise<Result<CatalogDAO, AppError>> {
    const filter: any = { _id: id };
    if (version !== undefined) filter.version = version;
    const entity = await this.col.findOne(filter);
    if (!entity) {
      return new Err(new AppError(ErrorCode.BAD_REQUEST, `Can't find catalog with id [${id}]`));
    }
    return new Ok(entity);
  }

  // FIND MANY CATEGORIES
  async find(query: any, options: any): Promise<Result<CatalogDAO[], AppError>> {
    // TODO: Add query limit
    const entities = await this.col.find(query, options).toArray();
    return new Ok(entities);
  }

  // AGGREGATE CATEGORIES
  async aggregate(pipeline: any[], options: any): Promise<Result<any, AppError>> {
    const result: any[] = [];
    const cursor = this.col.aggregate(pipeline, options);
    for await (const doc of cursor) {
      result.push(doc);
    }
    return new Ok(result);
  }
}
