import tsresult, { type Result } from 'ts-results';
const { Ok, Err } = tsresult;
import { AppError } from '#core/lib/appError';
import { type Product } from '#core/entities/product';
import { type ProductDAO } from '#infrastructure/repositories/dao/product.dao.schema';

export interface IProductRepository {
  create: (catalogId: string, category: Product) => Promise<Result<ProductDAO, AppError>>;
  save: (catalogId: string, category: Product) => Promise<Result<ProductDAO, AppError>>;
  updateOne: (catalogId: string, id: string, categoryVersion: number, update: any) => Promise<Result<any, AppError>>;
  update: (catalogId: string, filter: any, update: any) => Promise<Result<any, AppError>>;
  findOne: (catalogId: string, id: string, version?: number) => Promise<Result<ProductDAO, AppError>>;
  find: (catalogId: string, query: any, options?: any) => Promise<Result<ProductDAO[], AppError>>;
  aggregate: (catalogId: string, pipeline: any[], options?: any) => Promise<Result<any[], AppError>>;
}
