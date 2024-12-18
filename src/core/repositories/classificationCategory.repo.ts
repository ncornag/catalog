import tsresult, { type Result } from 'ts-results';
const { Ok, Err } = tsresult;
import { AppError } from '#core/lib/appError';
import { type ClassificationCategory } from '#core/entities/classificationCategory';
import { type ClassificationCategoryDAO } from '#infrastructure/repositories/dao/classificationCategory.dao.schema';
import { type ClassificationAttributeDAO } from '#infrastructure/repositories/dao/classificationAttribute.dao.schema';
import { type ClassificationAttributePayload } from '#infrastructure/http/schemas/classificationAttribute.schemas';

export interface IClassificationCategoryRepository {
  create: (category: ClassificationCategory) => Promise<Result<ClassificationCategoryDAO, AppError>>;
  save: (category: ClassificationCategory) => Promise<Result<ClassificationCategoryDAO, AppError>>;
  updateOne: (id: string, categoryVersion: number, update: any) => Promise<Result<any, AppError>>;
  update: (filter: any, update: any) => Promise<Result<any, AppError>>;
  findOne: (id: string, version?: number) => Promise<Result<ClassificationCategoryDAO, AppError>>;
  find: (query: any, options?: any) => Promise<Result<ClassificationCategoryDAO[], AppError>>;
  aggregate: (pipeline: any[], options?: any) => Promise<Result<any[], AppError>>;
  createClassificationAttribute: (
    id: string,
    categoryVersion: number,
    payload: ClassificationAttributePayload
  ) => Promise<Result<ClassificationAttributeDAO, AppError>>;
}
