import { Err, Ok, Result } from 'ts-results';
import { AppError, ErrorCode } from '@core/lib/appError';
import { IProductRepository } from '@core/repositories/product.repo';
import { CT } from '@core/lib/ct';
import { IPriceService, PriceService } from '@core/services/price.svc';
import { Price } from '@core/entities/price';

// SERVICE INTERFACE
export interface IProductServiceV1 {
  findProductById: (id: string) => Promise<Result<any, AppError>>;
}

// SERVICE IMPLEMENTATION
export class ProductServiceV1 implements IProductServiceV1 {
  private static instance: IProductServiceV1;
  private repo: IProductRepository;
  private cols;
  private ct;
  private priceService: IPriceService;

  private constructor(server: any) {
    this.repo = server.db.repo.productRepository as IProductRepository;
    this.cols = server.db.col.product;
    this.ct = new CT(server);
    this.priceService = PriceService.getInstance(server);
  }

  public static getInstance(server: any): IProductServiceV1 {
    if (!ProductServiceV1.instance) {
      ProductServiceV1.instance = new ProductServiceV1(server);
    }
    return ProductServiceV1.instance;
  }

  // FIND PRODUCT BY ID
  public async findProductById(id: string): Promise<Result<any, AppError>> {
    const stagedCatalog = 'stage';
    const onlineCatalog = 'online';
    // Return the product from the staged catalog
    const productResultStaged = await this.getProductFromCatalog(stagedCatalog, id);
    if (productResultStaged.err) return productResultStaged;
    // Return the product from the current catalog
    const productResultOnline = await this.getProductFromCatalog(onlineCatalog, id);
    if (productResultOnline.err) return productResultOnline;
    // Get Prices
    let productStaged = productResultStaged.val[0];
    let productOnline;
    let priceResultStaged: Result<Price[], AppError> = new Ok([]);
    let priceResultOnline: Result<Price[], AppError> = new Ok([]);
    if (productStaged.priceMode === 'Embedded') {
      priceResultStaged = await this.priceService.getPricesForSKU(
        stagedCatalog,
        productStaged.variants.map((v: any) => v.sku)
      );
      if (priceResultStaged.err) return priceResultStaged;
      if (productResultOnline.val[0]) {
        productOnline = productResultOnline.val[0];
        priceResultOnline = await this.priceService.getPricesForSKU(
          onlineCatalog,
          productOnline.variants.map((v: any) => v.sku)
        );
        if (priceResultOnline.err) return priceResultStaged;
      }
    }
    // Return the converted Product
    const productV1 = this.ct.toCTProduct(productStaged, productOnline, priceResultStaged.val, priceResultOnline.val);
    return new Ok(productV1);
  }

  private async getProductFromCatalog(catalogId: string, id: string) {
    return await this.repo.aggregate(catalogId, [
      { $match: { _id: id } },
      {
        $lookup: {
          from: this.cols[catalogId].collectionName,
          localField: '_id',
          foreignField: 'parent',
          as: 'variants'
        }
      },
      {
        $project: {
          'variants.parent': 0,
          'variants.catalog': 0,
          'variants.projectId': 0,
          'variants.createdAt': 0,
          'variants.lastModifiedAt': 0,
          'variants.version': 0
        }
      }
    ]);
  }
}
