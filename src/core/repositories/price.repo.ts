import { Result } from 'ts-results';
import { AppError } from '@core/lib/appError';
import { Price } from '@core/entities/price';
import { PriceDAO } from '@infrastructure/repositories/dao/price.dao.schema';

export interface IPriceRepository {
  findOne: (catalogId: string, id: string, version?: number) => Promise<Result<PriceDAO, AppError>>;
  find: (catalogId: string, query: any, options?: any) => Promise<Result<PriceDAO[], AppError>>;
  aggregate: (catalogId: string, pipeline: any[], options?: any) => Promise<Result<any[], AppError>>;
}
