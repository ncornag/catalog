import tsresult, { type Result } from 'ts-results';
const { Ok, Err } = tsresult;
import { Db, Collection } from 'mongodb';
import { ErrorCode, AppError } from '#core/lib/appError';
import { type IClassificationCategoryRepository } from '#core/repositories/classificationCategory.repo';
import { type ClassificationCategory } from '#core/entities/classificationCategory';
import { type ClassificationCategoryDAO } from '#infrastructure/repositories/dao/classificationCategory.dao.schema';
import { type ClassificationAttributeDAO } from '#infrastructure/repositories/dao/classificationAttribute.dao.schema';
import { type ClassificationAttributePayload } from '#infrastructure/http/schemas/classificationAttribute.schemas';
import { type ITreeRepo } from '#core/lib/tree';

export const getClassificationCategoryCollection = (db: Db): Collection<ClassificationCategoryDAO> => {
  return db.collection<ClassificationCategoryDAO>('ClassificationCategory');
};

export class ClassificationCategoryRepository
  implements IClassificationCategoryRepository, ITreeRepo<ClassificationCategoryDAO> {
  private col: Collection<ClassificationCategoryDAO>;

  constructor(server: any) {
    this.col = server.db.col.classificationCategory;
  }

  // CREATE CATEGORY
  async create(category: ClassificationCategory): Promise<Result<ClassificationCategoryDAO, AppError>> {
    const { id: _id, ...data } = category;
    const categoryDAO = { _id, ...data };
    const result = await this.col.insertOne(categoryDAO);
    if (!result || result.insertedId == '')
      // TODO: Check if this is the correct way to check for succesul inserts
      return new Err(new AppError(ErrorCode.BAD_REQUEST, `Can't save category [${_id}]`));
    return new Ok(categoryDAO);
  }

  // SAVE CATEGORY
  async save(category: ClassificationCategory): Promise<Result<ClassificationCategoryDAO, AppError>> {
    const { id: _id, ...data } = category;
    const categoryDAO = { _id, ...data };
    const version = categoryDAO.version!;
    const result = await this.col.updateOne({ _id }, { $set: categoryDAO });
    if (!result || result.modifiedCount != 1)
      return new Err(new AppError(ErrorCode.BAD_REQUEST, `Can't save category [${_id}]`));
    categoryDAO.version = version + 1;
    return new Ok(categoryDAO);
  }

  // UPDATE ONE CATEGORY
  async updateOne(id: string, categoryVersion: number, update: any): Promise<Result<any, AppError>> {
    const result = await this.col.updateOne(
      {
        _id: id,
        version: categoryVersion
      },
      update
    );
    if (result.modifiedCount != 1) return new Err(new AppError(ErrorCode.BAD_REQUEST, `Can't update category.`));
    return new Ok({});
  }

  // UPDATE MANY CATEGORIES
  async update(filter: any, update: any): Promise<Result<any, AppError>> {
    const result = await this.col.updateMany(filter, update);
    //if (result.ok != 1) return new Err(new AppError(ErrorCode.BAD_REQUEST, `Can't update categories.`));
    return new Ok({});
  }

  // FIND ONE CATEGORY
  async findOne(id: string, version?: number): Promise<Result<ClassificationCategoryDAO, AppError>> {
    const filter: any = { _id: id };
    if (version !== undefined) filter.version = version;
    const entity = await this.col.findOne(filter);
    if (!entity) {
      return new Err(new AppError(ErrorCode.BAD_REQUEST, `Can't find category with id [${id}]`));
    }
    return new Ok(entity);
  }

  // FIND MANY CATEGORIES
  async find(query: any, options: any): Promise<Result<ClassificationCategoryDAO[], AppError>> {
    // TODO: Add query limit?
    const entities = await this.col.find(query, options).toArray();
    // if (entities.length === 0) {
    //   return new Err(new AppError(ErrorCode.BAD_REQUEST, `Can't find categories matching the criteria.`));
    // }
    return new Ok(entities);
  }

  // AGGREGATE CATEGORIES
  async aggregate(pipeline: any[], options: any): Promise<Result<any, AppError>> {
    const result: any[] = [];
    const cursor = this.col.aggregate(pipeline, options);
    for await (const doc of cursor) {
      result.push(doc);
    }
    return new Ok(result);
  }
  // CREATE ATTRIBUTE
  async createClassificationAttribute(
    id: string,
    categoryVersion: number,
    payload: ClassificationAttributePayload
  ): Promise<Result<ClassificationAttributeDAO, AppError>> {
    // TODO: Rewrite with validations and attribute uniqueness
    const result = await this.col.updateOne(
      {
        _id: id,
        version: categoryVersion,
        'attributes.key': {
          $ne: payload.key
        }
      },
      { $push: { attributes: payload } }
    );
    if (result.modifiedCount != 1) {
      return Err(new AppError(ErrorCode.BAD_REQUEST, `Can't create attribute [${payload.key}]`));
    }
    return new Ok(payload);
  }
}
