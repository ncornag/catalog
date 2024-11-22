import tsresult, { type Result } from 'ts-results';
const { Ok, Err } = tsresult;
import { AppError } from '#core/lib/appError';
import { type ActionHandlerResult } from '#core/services/actions/index';
import { type UpdateProductChangeDescription } from '#core/entities/product';

interface DAOwithDescription {
  [key: string]: any;
  key: string;
}

export class ChangeDescriptionActionHandler<Repository> {
  private server: any;
  constructor(server: any) {
    this.server = server;
  }
  async run(
    entity: DAOwithDescription,
    toUpdateEntity: DAOwithDescription,
    action: UpdateProductChangeDescription,
    classificationCategoryRepository: Repository
  ): Promise<Result<ActionHandlerResult, AppError>> {
    if (entity.description === action.description) return new Ok({ update: {} });
    toUpdateEntity.description = action.description;
    return new Ok({ update: { $set: { description: action.description } } });
  }
}
