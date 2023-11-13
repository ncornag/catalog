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
import { UpdateEntityActionsRunner, updateEntityActionsRunner } from '@core/lib/updateEntityActionsRunner';

// SERVICE INTERFACE
interface IClassificationCategoryService {
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
export const classificationCategoryService = (server: any): IClassificationCategoryService => {
  const ActionHandlers: ActionHandlersList = {
    setKey: new SetKeyActionHandler(server),
    changeName: new ChangeNameActionHandler(server),
    changeParent: new ChangeParentActionHandler(server)
  };
  const repo = server.db.repo.classificationCategoryRepository as IClassificationCategoryRepository;
  const actionsRunner = new UpdateEntityActionsRunner<ClassificationCategoryDAO, IClassificationCategoryRepository>();
  return {
    // CREATE CATEGORY
    createClassificationCategory: async (
      payload: ClassificationCategoryPayload
    ): Promise<Result<ClassificationCategory, AppError>> => {
      // Add ancestors
      if (payload.parent) {
        const actionResult = await ActionHandlers['changeParent'].run(
          {},
          payload,
          { action: 'changeParent', parent: payload.parent },
          repo
        );
        if (actionResult.err) return actionResult;
      }
      // Save the entity
      const result = await repo.create({
        id: nanoid(),
        ...payload
      });
      if (result.err) return result;
      return new Ok(toEntity(result.val));
    },

    // UPDATE CATEGORY
    updateClassificationCategory: async (
      id: string,
      version: number,
      actions: UpdateClassificationCategoryAction[]
    ): Promise<Result<ClassificationCategory, AppError>> => {
      // Find the Entity
      let result = await repo.findOne(id, version);
      if (result.err) return result;
      const entity: ClassificationCategoryDAO = result.val;
      const toUpdateEntity = Value.Clone(entity);
      // Execute actions
      const actionRunnerResults = await actionsRunner.run(entity, toUpdateEntity, repo, ActionHandlers, actions);
      if (actionRunnerResults.err) return actionRunnerResults;
      // Compute difference, and save if needed
      const difference = Value.Diff(entity, toUpdateEntity);
      if (difference.length > 0) {
        // Save the entity
        const saveResult = await repo.updateOne(id, version, actionRunnerResults.val.update);
        if (saveResult.err) return saveResult;
        toUpdateEntity.version = version + 1;
        // Send differences via messagging
        const messages = await server.messages;
        messages.publish(server.config.EXCHANGE, server.config.ENTITY_UPDATE_ROUTE, {
          entity: 'classificationCategory',
          source: entity,
          difference,
          metadata: { type: 'entityUpdate' }
        });
        // Send side effects via messagging
        actionRunnerResults.val.sideEffects?.forEach((sideEffect: any) => {
          messages.publish(server.config.EXCHANGE, sideEffect.action, {
            ...sideEffect.data,
            metadata: { type: sideEffect.action }
          });
        });
      }
      // Return udated entity
      return Ok(toEntity(toUpdateEntity));
    },

    // FIND CATEGORY
    findClassificationCategoryById: async (id: string): Promise<Result<ClassificationCategory, AppError>> => {
      const result = await repo.findOne(id);
      if (result.err) return result;
      return new Ok(toEntity(result.val));
    },

    // SAVE  CATEGORY
    saveClassificationCategory: async (
      category: ClassificationCategory
    ): Promise<Result<ClassificationCategory, AppError>> => {
      const result = await repo.save(category);
      if (result.err) return result;
      return new Ok(toEntity(result.val));
    },

    // VALIDATE
    validate: async (id: string, data: any): Promise<Result<any, AppError>> => {
      let schemaResult: Result<any, AppError> = await server.validator.getClassificationCategorySchema(id);
      if (!schemaResult.ok) return new Err(schemaResult.val);
      const validation: Result<any, AppError> = server.validator.validate(schemaResult.val.jsonSchema, data);
      if (!validation.ok) return new Err(validation.val);
      return new Ok({ ok: true });
    },

    // CREATE ATTRIBUTE
    createClassificationAttribute: async (
      id: string,
      categoryVersion: number,
      payload: ClassificationAttributePayload
    ): Promise<Result<ClassificationAttribute, AppError>> => {
      // Find the Category
      const result = await repo.createClassificationAttribute(id, categoryVersion, payload);
      if (result.err) return result;
      const entity = Value.Convert(ClassificationAttributeSchema, {
        ...result.val
      }) as ClassificationAttribute;
      return new Ok(entity);
    },

    // FIND ATTRIBUTE
    findClassificationAttributeById: async (
      id: string,
      attributeId: string
    ): Promise<Result<ClassificationAttribute, AppError>> => {
      const criteria: any = { _id: id, 'attributes._id': attributeId }; // Should the '_id' implementation detail be hidden in the repository class?
      const options: any = { projections: { 'attributes.$': 1 } };
      const result = await repo.find(criteria, options);
      if (result.err) return result;
      if (result.val.length != 1) return new Err(new AppError(ErrorCode.NOT_FOUND));
      const entity = Value.Convert(ClassificationAttributeSchema, {
        ...result.val[0].attributes![0]
      }) as ClassificationAttribute;
      return new Ok(entity);
    }
  };
};
