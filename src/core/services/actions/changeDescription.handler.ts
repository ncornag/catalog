import { Ok, Result } from 'ts-results';
import { AppError } from '@core/lib/appError';
import { ActionHandlerResult } from '@core/services/actions';
import { UpdateProductChangeDescription } from '@core/entities/product';

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
