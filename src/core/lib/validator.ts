import tsresult, { type Result } from 'ts-results';
const { Ok, Err } = tsresult;
import { Ajv } from 'ajv';
import { AppError, ErrorCode } from './appError.ts';
import { type ClassificationAttribute, ClassificationAttributeType } from '#core/entities/classificationAttribute';
import { Type } from '@sinclair/typebox';
import { type IProductCategoryRepository } from '#core/repositories/productCategory.repo';
import { type IClassificationCategoryRepository } from '#core/repositories/classificationCategory.repo';

export class Validator {
  private server: any;
  private validator;
  private classificationCategoryRepository: IClassificationCategoryRepository;
  private productCategoryRepository: IProductCategoryRepository;

  private cache: Map<string, any> = new Map<string, any>();

  constructor(server: any) {
    this.server = server;
    this.productCategoryRepository = server.db.repo.productCategoryRepository;
    this.classificationCategoryRepository = server.db.repo.classificationCategoryRepository;
    this.validator = new Ajv({
      coerceTypes: 'array',
      useDefaults: true,
      addUsedSchema: false
    });
  }

  // Generate a JSON Schema based on a list of attributes
  async generateSchema(attributes: any): Promise<Result<any, AppError>> {
    let properties = await attributes.reduce(async (accP: any, curr: any) => {
      const acc = await accP;
      let t: any;
      let opts: any = {};
      switch (curr.type) {
        case ClassificationAttributeType.NUMBER:
          if (curr.min) opts.minimum = curr.min;
          if (curr.max) opts.maximum = curr.max;
          t = Type.Number(opts);
          break;
        case ClassificationAttributeType.TEXT:
          if (curr.minLength) opts.minLength = curr.minLength;
          if (curr.maxLength) opts.maxLength = curr.maxLength;
          t = Type.String();
          break;
        case ClassificationAttributeType.DATETIME:
          // TODO review date-time format
          t = Type.Date();
          break;
        case ClassificationAttributeType.BOOLEAN:
          t = Type.Boolean();
          break;
        case ClassificationAttributeType.ENUM:
          let options: any = curr.options.map((o: any) => Type.Literal(o.key));
          t = Type.Union(options);
          break;
        case ClassificationAttributeType.OBJECT:
          const result: Result<any, AppError> = await this.getClassificationCategorySchema(curr.ref);
          if (!result.ok) return new Err(result.val);
          t = result.val.z;
          break;
        case ClassificationAttributeType.LIST:
          let elementType;
          switch (curr.elementType) {
            case 'number':
              elementType = Type.Number();
              break;
            case 'text':
              elementType = Type.String();
              break;
            default:
              // TODO: Throw error...
              console.log('Invalid elementType for ', curr.name);
              break;
          }
          t = Type.Array(elementType!);
          break;
        default:
          // TODO: Throw error, like
          //return Err(new AppError(ErrorCode.BAD_REQUEST, `Incorrect attribute type for [${a.name}]`));
          console.log('Invalid type ' + curr.type + ' for ', curr.name);
          break;
      }
      if (!curr.isRequired) t = Type.Optional(t);
      acc[curr.key] = t;
      return await acc;
    }, Promise.resolve({}));
    return Ok(Type.Object(properties, { additionalProperties: false }));
  }

  // Get the attributes of a Product Category (ancestors' attributes are included))
  async getProductCategorySchema(id: string): Promise<Result<any, AppError>> {
    let schema = this.cache.get(id);
    if (!schema) {
      let cCategories: string[] = [];
      let attributes: ClassificationAttribute[] = [];

      // Get the Category with Classifications + the ancestors with Classifications
      const resultCatCC = await this.productCategoryRepository.aggregate([
        { $match: { _id: id } },
        {
          $lookup: {
            from: 'ProductCategory',
            localField: 'ancestors',
            foreignField: '_id',
            as: 'ancestors'
          }
        },
        { $unwind: '$ancestors' },
        { $unwind: '$ancestors.classificationCategories' },
        { $project: { _id: 0, classificationCategories: 1, ancestors: '$ancestors.classificationCategories' } }
      ]);
      if (resultCatCC.err) return Err(resultCatCC.val);
      const catCC = resultCatCC.val;
      if (catCC.length < 1) return Err(new AppError(ErrorCode.NOT_FOUND, `Entity [${id}] not found`));
      cCategories = cCategories.concat(catCC[0]?.classificationCategories || []);
      cCategories = cCategories.concat(
        catCC.reduce((flattenedArray: any, element: any) => [...flattenedArray, element.ancestors], [])
      );

      // Get the Classification's Attributes
      const resultCC = await this.classificationCategoryRepository.aggregate([
        { $match: { _id: { $in: cCategories } } },
        {
          $lookup: {
            from: 'ClassificationCategory',
            localField: 'ancestors',
            foreignField: '_id',
            as: 'ancestors'
          }
        },
        { $unwind: '$ancestors' },
        { $project: { _id: 1, attributes: 1, ancestors: '$ancestors.attributes' } }
      ]);
      if (resultCC.err) return Err(resultCC.val);
      const cc = resultCC.val;
      attributes = attributes.concat(
        cc.reduce((flattenedArray: any, element: any) => [...flattenedArray, element.attributes], [])
      );
      attributes = attributes
        .concat(cc.reduce((flattenedArray: any, element: any) => [...flattenedArray, element.ancestors], []))
        .flat();

      let result = await this.generateSchema(attributes);
      if (!result.ok) return Err(result.val);
      schema = { jsonSchema: result.val, z: result.val };
      if (this.server.config.CACHE_JSON_SCHEMAS) this.cache.set(id, schema);
    }
    return Ok(schema);
  }

  // CLASSIFICATION CATEGORY
  async getClassificationCategorySchema(id: string): Promise<Result<any, AppError>> {
    let schema = this.cache.get(id);
    if (!schema) {
      console.log('Generating schema for ' + id);
      let result = await this.classificationCategoryRepository.aggregate([
        { $match: { _id: id } },
        {
          $lookup: {
            from: 'ClassificationCategory',
            localField: 'ancestors',
            foreignField: '_id',
            as: 'ancestors'
          }
        },
        { $project: { _id: 1, attributes: 1, ancestors: '$ancestors.attributes' } }
      ]);
      const entity = (result.val as any)[0];
      const attributes = entity.attributes.concat(entity.ancestors).flat();
      let schemaResult = await this.generateSchema(attributes);
      if (!schemaResult.ok) return Err(schemaResult.val);
      schema = { jsonSchema: schemaResult.val, z: schemaResult.val };
      if (this.server.config.CACHE_JSON_SCHEMAS) this.cache.set(id, schema);
    }
    return Ok(schema);
  }

  validate(schema: any, data: any): Result<any, AppError> {
    let validateFn = this.validator.compile(schema);
    let valid = validateFn(data);
    if (!valid) {
      return Err(
        new AppError(
          ErrorCode.BAD_REQUEST,
          `${validateFn.errors![0].instancePath || '/'} ${validateFn.errors![0].message} ${validateFn.errors![0].params.additionalProperty || ''
          }`
        )
      );
    }
    return Ok(true);
  }
}
