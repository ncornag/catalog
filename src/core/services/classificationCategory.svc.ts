import { Err, Ok, Result } from 'ts-results';
import { AppError, ErrorCode } from '@core/lib/appError';
import { Value } from '@sinclair/typebox/value';
import { nanoid } from 'nanoid';
import { type ClassificationCategory, UpdateClassificationCategoryAction } from '@core/entities/classificationCategory';
import { type ClassificationAttribute, ClassificationAttributeSchema } from '@core/entities/classificationAttribute';
import { type ClassificationCategoryPayload } from '@infrastructure/http/schemas/classificationCategory.schemas';
import { type ClassificationAttributePayload } from '@infrastructure/http/schemas/classificationAttribute.schemas';
import { ClassificationCategoryDAO } from '@infrastructure/repositories/dao/classificationCategory.dao.schema';
import { IClassificationCategoryRepository } from '@core/repositories/classificationCategory.repo';
import { ActionHandlersList } from '@core/services/actions';
import { ChangeParentActionHandler } from '@core/lib/tree';
import { SetKeyActionHandler } from '@core/services/actions/setKey.handler';
import { ChangeNameActionHandler } from '@core/services/actions/changeName.handler';
import { UpdateEntityActionsRunner } from '@core/lib/updateEntityActionsRunner';
import { Config } from '@infrastructure/http/plugins/config';

// SERVICE INTERFACE
export interface IClassificationCategoryService {
  createClassificationCategory: (
    payload: ClassificationCategoryPayload
  ) => Promise<Result<ClassificationCategory, AppError>>;
  updateClassificationCategory: (
    id: string,
    version: number,
    actions: any
  ) => Promise<Result<ClassificationCategory, AppError>>;
  findClassificationCategoryById: (id: string) => Promise<Result<ClassificationCategory, AppError>>;
  saveClassificationCategory: (category: ClassificationCategory) => Promise<Result<ClassificationCategory, AppError>>;
  validate: (id: string, data: any) => Promise<Result<any, AppError>>;
  createClassificationAttribute: (
    id: string,
    categoryVersion: number,
    payload: ClassificationAttributePayload
  ) => Promise<Result<ClassificationAttribute, AppError>>;
  findClassificationAttributeById: (
    id: string,
    attributeId: string
  ) => Promise<Result<ClassificationAttribute, AppError>>;
}

const toEntity = ({ _id, ...remainder }: ClassificationCategoryDAO): ClassificationCategory => ({
  id: _id,
  ...remainder
});

// SERVICE IMPLEMENTATION
export class ClassificationCategoryService implements IClassificationCategoryService {
  private static instance: IClassificationCategoryService;
  private repo: IClassificationCategoryRepository;
  private actionHandlers: ActionHandlersList;
  private actionsRunner: UpdateEntityActionsRunner<ClassificationCategoryDAO, IClassificationCategoryRepository>;
  private config: Config;
  private messages;
  private validator;

  private constructor(server: any) {
    this.repo = server.db.repo.classificationCategoryRepository as IClassificationCategoryRepository;
    this.actionHandlers = {
      setKey: new SetKeyActionHandler(server),
      changeName: new ChangeNameActionHandler(server),
      changeParent: new ChangeParentActionHandler(server)
    };
    this.actionsRunner = new UpdateEntityActionsRunner<ClassificationCategoryDAO, IClassificationCategoryRepository>();
    this.config = server.config;
    this.messages = server.messages;
    this.validator = server.validator;
  }

  public static getInstance(server: any): IClassificationCategoryService {
    if (!ClassificationCategoryService.instance) {
      ClassificationCategoryService.instance = new ClassificationCategoryService(server);
    }
    return ClassificationCategoryService.instance;
  }

  // CREATE CATEGORY
  public async createClassificationCategory(
    payload: ClassificationCategoryPayload
  ): Promise<Result<ClassificationCategory, AppError>> {
    // Add ancestors
    if (payload.parent) {
      const actionResult = await this.actionHandlers['changeParent'].run(
        {},
        payload,
        { action: 'changeParent', parent: payload.parent },
        this.repo
      );
      if (actionResult.err) return actionResult;
    }
    // Save the entity
    const result = await this.repo.create({
      id: nanoid(),
      ...payload
    });
    if (result.err) return result;
    return new Ok(toEntity(result.val));
  }

  // UPDATE CATEGORY
  public async updateClassificationCategory(
    id: string,
    version: number,
    actions: UpdateClassificationCategoryAction[]
  ): Promise<Result<ClassificationCategory, AppError>> {
    // Find the Entity
    let result = await this.repo.findOne(id, version);
    if (result.err) return result;
    const entity: ClassificationCategoryDAO = result.val;
    const toUpdateEntity = Value.Clone(entity);
    // Execute actions
    const actionRunnerResults = await this.actionsRunner.run(
      entity,
      toUpdateEntity,
      this.repo,
      this.actionHandlers,
      actions
    );
    if (actionRunnerResults.err) return actionRunnerResults;
    // Compute difference, and save if needed
    const difference = Value.Diff(entity, toUpdateEntity);
    if (difference.length > 0) {
      // Save the entity
      const saveResult = await this.repo.updateOne(id, version, actionRunnerResults.val.update);
      if (saveResult.err) return saveResult;
      toUpdateEntity.version = version + 1;
      // Send differences via messagging
      this.messages.publish(this.config.EXCHANGE, this.config.ENTITY_UPDATE_ROUTE, {
        entity: 'classificationCategory',
        source: entity,
        difference,
        metadata: { type: 'entityUpdate' }
      });
      // Send side effects via messagging
      actionRunnerResults.val.sideEffects?.forEach((sideEffect: any) => {
        this.messages.publish(this.config.EXCHANGE, sideEffect.action, {
          ...sideEffect.data,
          metadata: { type: sideEffect.action }
        });
      });
    }
    // Return udated entity
    return Ok(toEntity(toUpdateEntity));
  }

  // FIND CATEGORY
  public async findClassificationCategoryById(id: string): Promise<Result<ClassificationCategory, AppError>> {
    const result = await this.repo.findOne(id);
    if (result.err) return result;
    return new Ok(toEntity(result.val));
  }

  // SAVE  CATEGORY
  public async saveClassificationCategory(
    category: ClassificationCategory
  ): Promise<Result<ClassificationCategory, AppError>> {
    const result = await this.repo.save(category);
    if (result.err) return result;
    return new Ok(toEntity(result.val));
  }

  // VALIDATE
  public async validate(id: string, data: any): Promise<Result<any, AppError>> {
    let schemaResult: Result<any, AppError> = await this.validator.getClassificationCategorySchema(id);
    if (!schemaResult.ok) return new Err(schemaResult.val);
    const validation: Result<any, AppError> = this.validator.validate(schemaResult.val.jsonSchema, data);
    if (!validation.ok) return new Err(validation.val);
    return new Ok({ ok: true });
  }

  // CREATE ATTRIBUTE
  public async createClassificationAttribute(
    id: string,
    categoryVersion: number,
    payload: ClassificationAttributePayload
  ): Promise<Result<ClassificationAttribute, AppError>> {
    // Find the Category
    const result = await this.repo.createClassificationAttribute(id, categoryVersion, payload);
    if (result.err) return result;
    const entity = Value.Convert(ClassificationAttributeSchema, {
      ...result.val
    }) as ClassificationAttribute;
    return new Ok(entity);
  }

  // FIND ATTRIBUTE
  public async findClassificationAttributeById(
    id: string,
    attributeId: string
  ): Promise<Result<ClassificationAttribute, AppError>> {
    const criteria: any = { _id: id, 'attributes._id': attributeId }; // Should the '_id' implementation detail be hidden in the repository class?
    const options: any = { projections: { 'attributes.$': 1 } };
    const result = await this.repo.find(criteria, options);
    if (result.err) return result;
    if (result.val.length != 1) return new Err(new AppError(ErrorCode.NOT_FOUND));
    const entity = Value.Convert(ClassificationAttributeSchema, {
      ...result.val[0].attributes![0]
    }) as ClassificationAttribute;
    return new Ok(entity);
  }
}
