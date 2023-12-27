import { Err, Ok, Result } from 'ts-results';
import { AppError, ErrorCode } from '@core/lib/appError';
import { type Price } from '@core/entities/price';
import { PriceDAO } from '@infrastructure/repositories/dao/price.dao.schema';
import { IPriceRepository } from '@core/repositories/price.repo';

// SERVICE INTERFACE
export interface IPriceService {
  getPricesForSKU: (catalogId: string, skus: [string]) => Promise<Result<Price[], AppError>>;
  findPriceById: (catalogId: string, id: string) => Promise<Result<Price, AppError>>;
}

const toEntity = ({ _id, ...remainder }: PriceDAO): Price => ({
  id: _id,
  ...remainder
});

export const FieldPredicateOperators: any = {
  country: { operator: 'in', field: 'country', type: 'array' },
  customerGroup: { operator: 'in', field: 'customerGroup', type: 'array', typeId: 'customer-group' },
  channel: { operator: 'in', field: 'channel', type: 'array', typeId: 'channel' },
  validFrom: { operator: '>=', field: 'date', type: 'date' },
  validUntil: { operator: '<=', field: 'date', type: 'date' },
  minimumQuantity: { operator: '>=', field: 'quantity', type: 'number' }
};

export function createPredicateExpression(data: any) {
  const surroundByQuotes = (value: any) => (typeof value === 'string' ? `'${value}'` : value);
  let predicate = Object.entries(data).reduce((acc, [key, value]) => {
    if (acc) acc += ' and ';
    let op = FieldPredicateOperators[key] ? FieldPredicateOperators[key].operator : '=';
    let field = FieldPredicateOperators[key] ? FieldPredicateOperators[key].field : key;
    let val: any = value;
    if (op === 'in') {
      if (!Array.isArray(val)) val = [val];
      if (val.length > 1) acc += '(';
      for (let i = 0; i < val.length; i++) {
        if (i > 0) acc += ' or ';
        acc += `${surroundByQuotes(val[i])} in ${field}`;
      }
      if (val.length > 1) acc += ')';
    } else {
      acc += `${field}${op}${surroundByQuotes(val)}`;
    }
    return acc;
  }, '');
  return predicate === '' ? undefined : predicate;
}

// SERVICE IMPLEMENTATION
export class PriceService implements IPriceService {
  private static instance: IPriceService;
  private repo: IPriceRepository;

  private constructor(server: any) {
    this.repo = server.db.repo.priceRepository as IPriceRepository;
  }

  public static getInstance(server: any): IPriceService {
    if (!PriceService.instance) {
      PriceService.instance = new PriceService(server);
    }
    return PriceService.instance;
  }

  public async getPricesForSKU(catalogId: string, skus: [string]): Promise<Result<Price[], AppError>> {
    const result = await this.repo.find(catalogId, { sku: { $in: skus } });
    if (result.err) return result;
    return new Ok(result.val.map((e: PriceDAO) => toEntity(e)));
  }

  // FIND PRICE BY ID
  public async findPriceById(catalogId: string, id: string): Promise<Result<Price, AppError>> {
    const result = await this.repo.findOne(catalogId, id);
    if (result.err) return result;
    return new Ok(toEntity(result.val));
  }
}
