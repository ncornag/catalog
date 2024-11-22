import tsresult, { type Result } from 'ts-results';
const { Ok, Err } = tsresult;
import { AppError } from '#core/lib/appError';
import { type UpdateClassificationCategorySetKey } from '#core/entities/classificationCategory';
import { type ActionHandlerResult } from './index.ts';

interface DAOwithKey {
  [key: string]: any;
  key: string;
}

export class SetKeyActionHandler<Repository> {
  private server: any;
  constructor(server: any) {
    this.server = server;
  }
  async run(
    entity: DAOwithKey,
    toUpdateEntity: DAOwithKey,
    action: UpdateClassificationCategorySetKey,
    classificationCategoryRepository: Repository
  ): Promise<Result<ActionHandlerResult, AppError>> {
    if (entity.key === action.key) return new Ok({ update: {} });
    toUpdateEntity.key = action.key;
    return new Ok({ update: { $set: { key: action.key } } });
  }
}
