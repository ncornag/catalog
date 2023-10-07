import { Result } from 'ts-results';
import { AppError } from '@core/lib/appError';
import { Product } from '@core/entities/product';
import { ProductDAO } from '@infrastructure/repositories/dao/product.dao.schema';

export interface IProductRepository {
  create: (category: Product) => Promise<Result<ProductDAO, AppError>>;
  save: (category: Product) => Promise<Result<ProductDAO, AppError>>;
  updateOne: (id: string, categoryVersion: number, update: any) => Promise<Result<any, AppError>>;
  update: (filter: any, update: any) => Promise<Result<any, AppError>>;
  findOne: (id: string, version?: number) => Promise<Result<ProductDAO, AppError>>;
  find: (query: any, options?: any) => Promise<Result<ProductDAO[], AppError>>;
  aggregate: (pipeline: any[], options?: any) => Promise<Result<any[], AppError>>;
}
