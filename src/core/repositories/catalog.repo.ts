import { Result } from 'ts-results';
import { AppError } from '@core/lib/appError';
import { Catalog } from '@core/entities/catalog';
import { CatalogDAO } from '@infrastructure/repositories/dao/catalog.dao.schema';

export interface ICatalogRepository {
  create: (category: Catalog) => Promise<Result<CatalogDAO, AppError>>;
  save: (category: Catalog) => Promise<Result<CatalogDAO, AppError>>;
  updateOne: (id: string, categoryVersion: number, update: any) => Promise<Result<any, AppError>>;
  update: (filter: any, update: any) => Promise<Result<any, AppError>>;
  findOne: (id: string, version?: number) => Promise<Result<CatalogDAO, AppError>>;
  find: (query: any, options?: any) => Promise<Result<CatalogDAO[], AppError>>;
  aggregate: (pipeline: any[], options?: any) => Promise<Result<any[], AppError>>;
}
