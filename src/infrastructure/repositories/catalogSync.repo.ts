import { Db, Collection } from '@fastify/mongodb/node_modules/mongodb/mongodb';
import { Ok, Err, Result } from 'ts-results';
import { ErrorCode, AppError } from '@core/lib/appError';
import { type ICatalogSyncRepository } from '@core/repositories/catalogSync.repo';
import { CatalogSync } from '@core/entities/catalogSync';
import { CatalogSyncDAO } from '@infrastructure/repositories/dao/catalogSync.dao.schema';
import { ITreeRepo } from '@core/lib/tree';

export const getCatalogSyncCollection = (db: Db): Collection<CatalogSyncDAO> => {
  return db.collection<CatalogSyncDAO>('CatalogSync');
};

export class CatalogSyncRepository implements ICatalogSyncRepository, ITreeRepo<CatalogSyncDAO> {
  private col: Collection<CatalogSyncDAO>;

  constructor(server: any) {
    this.col = server.db.col.catalogSync;
  }

  // CREATE CATALOGSYNC
  async create(catalogSync: CatalogSync): Promise<Result<CatalogSyncDAO, AppError>> {
    const { id: _id, ...data } = catalogSync;
    const catalogSyncDAO = { _id, ...data };
    const result = await this.col.insertOne(catalogSyncDAO);
    if (!result || result.insertedId == '')
      // TODO: Check if this is the correct way to check for succesul inserts
      return new Err(new AppError(ErrorCode.BAD_REQUEST, `Can't save catalogSync [${_id}]`));
    return new Ok(catalogSyncDAO);
  }

  // SAVE CATALOGSYNC
  async save(catalogSync: CatalogSync): Promise<Result<CatalogSyncDAO, AppError>> {
    const { id: _id, ...data } = catalogSync;
    const catalogSyncDAO = { _id, ...data };
    const version = catalogSyncDAO.version!;
    const result = await this.col.updateOne({ _id }, { $set: catalogSyncDAO });
    if (!result || result.modifiedCount != 1)
      return new Err(new AppError(ErrorCode.BAD_REQUEST, `Can't save catalogSync [${_id}]`));
    catalogSyncDAO.version = version + 1;
    return new Ok(catalogSyncDAO);
  }

  // UPDATE ONE CATALOGSYNC
  async updateOne(id: string, catalogSyncVersion: number, update: any): Promise<Result<any, AppError>> {
    const result = await this.col.updateOne(
      {
        _id: id,
        version: catalogSyncVersion
      },
      update
    );
    if (result.modifiedCount != 1) return new Err(new AppError(ErrorCode.BAD_REQUEST, `Can't update catalogSync.`));
    return new Ok({});
  }

  // UPDATE MANY CATEGORIES
  async update(filter: any, update: any): Promise<Result<any, AppError>> {
    const result = await this.col.updateMany(filter, update);
    // TODO Handle errors
    //if (result.ok != 1) return new Err(new AppError(ErrorCode.BAD_REQUEST, `Can't update catalogSync.`));
    return new Ok({});
  }

  // FIND ONE CATALOGSYNC
  async findOne(id: string, version?: number): Promise<Result<CatalogSyncDAO, AppError>> {
    const filter: any = { _id: id };
    if (version !== undefined) filter.version = version;
    const entity = await this.col.findOne(filter);
    if (!entity) {
      return new Err(new AppError(ErrorCode.BAD_REQUEST, `Can't find catalogSync with id [${id}]`));
    }
    return new Ok(entity);
  }

  // FIND MANY CATALOGSYNC
  async find(query: any, options: any): Promise<Result<CatalogSyncDAO[], AppError>> {
    // TODO: Add query limit
    const entities = await this.col.find(query, options).toArray();
    return new Ok(entities);
  }

  // AGGREGATE CATALOGSYNC
  async aggregate(pipeline: any[], options: any): Promise<Result<any, AppError>> {
    const result: any[] = [];
    const cursor = this.col.aggregate(pipeline, options);
    for await (const doc of cursor) {
      result.push(doc);
    }
    return new Ok(result);
  }
}
