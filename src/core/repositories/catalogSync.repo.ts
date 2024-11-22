import tsresult, { type Result } from 'ts-results';
const { Ok, Err } = tsresult;
import { AppError } from '#core/lib/appError';
import { type CatalogSync } from '#core/entities/catalogSync';
import { type CatalogSyncDAO } from '#infrastructure/repositories/dao/catalogSync.dao.schema';

export interface ICatalogSyncRepository {
  create: (category: CatalogSync) => Promise<Result<CatalogSyncDAO, AppError>>;
  save: (category: CatalogSync) => Promise<Result<CatalogSyncDAO, AppError>>;
  updateOne: (id: string, categoryVersion: number, update: any) => Promise<Result<any, AppError>>;
  update: (filter: any, update: any) => Promise<Result<any, AppError>>;
  findOne: (id: string, version?: number) => Promise<Result<CatalogSyncDAO, AppError>>;
  find: (query: any, options?: any) => Promise<Result<CatalogSyncDAO[], AppError>>;
  aggregate: (pipeline: any[], options?: any) => Promise<Result<any[], AppError>>;
}
