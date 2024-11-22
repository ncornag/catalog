import tsresult, { type Result } from 'ts-results';
const { Ok, Err } = tsresult;
import { SetKeyActionHandler } from './setKey.handler.ts';
import { ChangeNameActionHandler } from './changeName.handler.ts';
import { ChangeKeywordsActionHandler } from './changeKeywords.handler.ts';
import { ChangeParentActionHandler } from '#core/lib/tree';
import { AppError } from '#core/lib/appError';

export interface ActionHandlerDAO {
  [key: string]: any;
}
export interface ActionData { }
export interface ActionHandlerRepository { }

export interface ActionHandler {
  run(
    entity: ActionHandlerDAO,
    toUpdateEntity: ActionHandlerDAO,
    action: ActionData,
    classificationCategoryRepository: ActionHandlerRepository
  ): Promise<Result<ActionHandlerResult, AppError>>;
}

export interface ActionHandlersList {
  [key: string]: ActionHandler;
}

export const actionHandlersList = (server: any): ActionHandlersList => ({
  setKey: new SetKeyActionHandler(server),
  changeName: new ChangeNameActionHandler(server),
  changeParent: new ChangeParentActionHandler(server),
  changeKeywords: new ChangeKeywordsActionHandler(server)
});

export type ActionHandlerResult = { update: any; sideEffects?: any[] };
