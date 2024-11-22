import tsresult, { type Result } from 'ts-results';
const { Ok, Err } = tsresult;
import { AppError } from '#core/lib/appError';
import { type Price } from '#core/entities/price';
import { type PriceDAO } from '#infrastructure/repositories/dao/price.dao.schema';

export interface IPriceRepository {
  create: (catalogId: string, price: Price) => Promise<Result<PriceDAO, AppError>>;
  findOne: (catalogId: string, id: string, version?: number) => Promise<Result<PriceDAO, AppError>>;
  find: (catalogId: string, query: any, options?: any) => Promise<Result<PriceDAO[], AppError>>;
  aggregate: (catalogId: string, pipeline: any[], options?: any) => Promise<Result<any[], AppError>>;
}
