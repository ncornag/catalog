import { Err, Ok, Result } from 'ts-results';
import { AppError, ErrorCode } from '@core/lib/appError';
import { IProductRepository } from '@core/repositories/product.repo';
import { CT } from '@core/lib/ct';

// SERVICE INTERFACE
export interface IProductServiceV1 {
  findProductById: (catalogId: string, id: string) => Promise<Result<any, AppError>>;
}

// SERVICE IMPLEMENTATION
export class ProductService implements IProductServiceV1 {
  private static instance: IProductServiceV1;
  private repo: IProductRepository;
  private cols;
  private ct;

  private constructor(server: any) {
    this.repo = server.db.repo.productRepository as IProductRepository;
    this.cols = server.db.col.product;
    this.ct = new CT(server);
  }

  public static getInstance(server: any): IProductServiceV1 {
    if (!ProductService.instance) {
      ProductService.instance = new ProductService(server);
    }
    return ProductService.instance;
  }

  // FIND PRODUCT BY ID
  public async findProductById(catalogId: string, id: string): Promise<Result<any, AppError>> {
    const stagedCatalog = 'stage';
    const currentCatalog = 'online';
    // Return the product from the staged catalog
    const resultStaged = await this.getProductFromCatalog(stagedCatalog, id);
    if (resultStaged.err) return resultStaged;
    // Return the product from the current catalog
    const resultCurrent = await this.getProductFromCatalog(currentCatalog, id);
    if (resultCurrent.err) return resultCurrent;
    // Return the converted Product
    const productV1 = this.ct.toCTProduct(resultStaged.val[0], resultCurrent.val[0] || undefined);
    return new Ok(productV1);
  }

  async getProductFromCatalog(catalogId: string, id: string) {
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
