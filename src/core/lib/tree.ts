import { Err, Ok, Result } from 'ts-results';
import { AppError, ErrorCode } from './appError';
import { ClassificationCategoryUpdateActionType } from '@core/entities/classificationCategory';
import { ActionHandler, ActionHandlerResult } from '@core/services/actions';
import { Type, type Static } from '@sinclair/typebox';

export const TreeFieldsSchema = {
  parent: Type.Optional(Type.String()),
  ancestors: Type.Optional(Type.Array(Type.String(), { default: [] }))
};

export interface ITree<T> {
  _id: T;
  parent?: T;
  ancestors?: T[];
}

export interface ITreeRepo<DAO> {
  find(query: any, options: any): Promise<Result<DAO[], AppError>>;
}

export const UpdateChangeParentSchema = Type.Object(
  {
    action: Type.Literal('changeParent'),
    parent: Type.String()
  },
  { additionalProperties: false }
);
export type UpdateChangeParent = Static<typeof UpdateChangeParentSchema>;

// export function createChangeParentActionHandler<DAO extends ITree<string>, REPO extends ITreeRepo<DAO>>(
//   server: any
// ): ActionHandler {
//   return {
//     run: async (
//       entity: DAO,
//       toUpdateEntity: DAO,
//       action: UpdateChangeParent,
//       repo: REPO
//     ): Promise<Result<ActionHandlerResult, AppError>> => {
//       if (entity.parent === action.parent) return new Ok({ update: {} });
//       const parentResult = await repo.find({ _id: action.parent }, { projection: { _id: 0, ancestors: 1 } });
//       if (parentResult.err) return new Err(new AppError(ErrorCode.BAD_REQUEST, `Can't find parent [${action.parent}]`));
//       const ancestors: string[] = parentResult.val[0].ancestors || [];
//       ancestors.push(action.parent);
//       toUpdateEntity.ancestors = ancestors;
//       toUpdateEntity.parent = action.parent;
//       return new Ok({
//         update: { $set: { parent: action.parent, ancestors } },
//         sideEffects: [{ action: server.config.CC_TREE_ROUTE, data: { id: entity._id, oldAncestors: entity.ancestors } }]
//       });
//     }
//   };
// }

export class ChangeParentActionHandler<DAO extends ITree<string>, REPO extends ITreeRepo<DAO>> {
  private server: any;
  constructor(server: any) {
    this.server = server;
  }
  async run(
    entity: DAO,
    toUpdateEntity: DAO,
    action: UpdateChangeParent,
    repo: REPO
  ): Promise<Result<ActionHandlerResult, AppError>> {
    if (entity.parent === action.parent) return new Ok({ update: {} });
    const parentResult = await repo.find({ _id: action.parent }, { projection: { _id: 0, ancestors: 1 } });
    if (parentResult.err) return new Err(new AppError(ErrorCode.BAD_REQUEST, `Can't find parent [${action.parent}]`));
    const ancestors: string[] = parentResult.val[0].ancestors || [];
    ancestors.push(action.parent);
    toUpdateEntity.ancestors = ancestors;
    toUpdateEntity.parent = action.parent;
    return new Ok({
      update: { $set: { parent: action.parent, ancestors } },
      sideEffects: [
        { action: this.server.config.CC_TREE_ROUTE, data: { id: entity._id, oldAncestors: entity.ancestors } }
      ]
    });
  }
}
