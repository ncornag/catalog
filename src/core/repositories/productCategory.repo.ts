import { Result } from 'ts-results';
import { AppError } from '@core/lib/appError';
import { ProductCategory } from '@core/entities/productCategory';
import { ProductCategoryDAO } from '@infrastructure/repositories/dao/productCategory.dao.schema';

export interface IProductCategoryRepository {
  create: (category: ProductCategory) => Promise<Result<ProductCategoryDAO, AppError>>;
  save: (category: ProductCategory) => Promise<Result<ProductCategoryDAO, AppError>>;
  updateOne: (id: string, categoryVersion: number, update: any) => Promise<Result<any, AppError>>;
  update: (filter: any, update: any) => Promise<Result<any, AppError>>;
  findOne: (id: string, version?: number) => Promise<Result<ProductCategoryDAO, AppError>>;
  find: (query: any, options?: any) => Promise<Result<ProductCategoryDAO[], AppError>>;
  aggregate: (pipeline: any[], options?: any) => Promise<Result<any[], AppError>>;
}
