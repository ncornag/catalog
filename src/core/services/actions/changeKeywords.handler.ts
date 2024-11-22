import tsresult, { type Result } from 'ts-results';
const { Ok, Err } = tsresult;
import { AppError } from '#core/lib/appError';
import { type UpdateProductChangeKeywords } from '#core/entities/product';
import { type ActionHandlerResult } from '#core/services/actions/index';

interface DAOwithKeywords {
  [key: string]: any;
  key: string;
}

export class ChangeKeywordsActionHandler<Repository> {
  private server: any;
  constructor(server: any) {
    this.server = server;
  }
  async run(
    entity: DAOwithKeywords,
    toUpdateEntity: DAOwithKeywords,
    action: UpdateProductChangeKeywords,
    repository: Repository
  ): Promise<Result<ActionHandlerResult, AppError>> {
    //if (entity.searchKeywords === action.searchKeywords) return new Ok({ update: {} });
    toUpdateEntity.searchKeywords = action.searchKeywords;
    return new Ok({ update: { $set: { searchKeywords: action.searchKeywords } } });
  }
}
