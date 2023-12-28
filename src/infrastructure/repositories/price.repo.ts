import { Db, Collection } from '@fastify/mongodb/node_modules/mongodb/mongodb';
import { Ok, Err, Result } from 'ts-results';
import { ErrorCode, AppError } from '@core/lib/appError';
import { type IPriceRepository } from '@core/repositories/price.repo';
import { Price } from '@core/entities/price';
import { PriceDAO } from '@infrastructure/repositories/dao/price.dao.schema';

export const getPriceCollection = async (
  db: Db
): Promise<Collection<PriceDAO> | Record<string, Collection<PriceDAO>>> => {
  const catalogDb = db.collection('Catalog');
  const catalogs = await catalogDb.find({}).toArray();
  return catalogs.reduce((acc: any, catalog: any) => {
    acc[catalog._id] = db.collection<PriceDAO>(`Prices${catalog.name}`);
    return acc;
  }, {});
};

export class PriceRepository implements IPriceRepository {
  private col: Record<string, Collection<PriceDAO>>;

  constructor(server: any) {
    this.col = server.db.col.price;
  }

  // FIND ONE
  async findOne(catalogId: string, id: string, version?: number): Promise<Result<PriceDAO, AppError>> {
    const filter: any = { _id: id };
    if (version !== undefined) filter.version = version;
    const catAwareCol = this.col[catalogId];
    const entity = await catAwareCol.findOne(filter);
    if (!entity) {
      return new Err(new AppError(ErrorCode.BAD_REQUEST, `Can't find price with id [${id}]`));
    }
    return new Ok(entity);
  }

  // FIND MANY
  async find(catalogId: string, query: any, options: any = {}): Promise<Result<PriceDAO[], AppError>> {
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
