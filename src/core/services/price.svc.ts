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
