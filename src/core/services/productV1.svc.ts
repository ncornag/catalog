import { Err, Ok, Result } from 'ts-results';
import { AppError, ErrorCode } from '@core/lib/appError';
import { type Product } from '@core/entities/product';
import { ProductDAO } from '@infrastructure/repositories/dao/product.dao.schema';
import { IProductRepository } from '@core/repositories/product.repo';

// SERVICE INTERFACE
export interface IProductServiceV1 {
  findProductById: (catalogId: string, id: string) => Promise<Result<any, AppError>>;
}

const toEntity = ({ _id, ...remainder }: ProductDAO): Product => ({
  id: _id,
  ...remainder
});

// SERVICE IMPLEMENTATION
export class ProductService implements IProductServiceV1 {
  private static instance: IProductServiceV1;
  private repo: IProductRepository;
  private cols;

  private constructor(server: any) {
    this.repo = server.db.repo.productRepository as IProductRepository;
    this.cols = server.db.col.product;
  }

  public static getInstance(server: any): IProductServiceV1 {
    if (!ProductService.instance) {
      ProductService.instance = new ProductService(server);
    }
    return ProductService.instance;
  }

  // FIND PRODUCT BY ID
  public async findProductById(
    catalogId: string,
    id: string,
    materialized: boolean = false
  ): Promise<Result<any, AppError>> {
    const result = await this.repo.aggregate(catalogId, [
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
    if (result.err) return result;
    const entity = result.val[0];
    const productV1 = {
      id: entity._id,
      version: entity.version,
      // TODO: Get the first Classification Category of the first Product Category
      productType: {
        id: 'xxx-yyy-zzz',
        typeId: 'product-type'
      },
      // Unsupported right now, faking data
      taxCategory: {
        id: 'f1e10e3a-45eb-49d8-ad0b-fdf984202f59',
        typeId: 'tax-category'
      },
      createdAt: entity.createdAt,
      lastModifiedAt: entity.lastModifiedAt,
      masterData: {
        current: {
          categories: entity.categories?.map((c: any) => ({ id: c, typeId: 'category' })),
          // TODO: Do it right when slug supports locale, assuming "en"
          description: {
            en: entity.description
          },
          name: entity.name,
          // TODO: Do it right when slug supports locale, assuming "en"
          slug: {
            en: entity.slug
          },
          // TODO: Do it right when searchKeywords supports locale, assuming "en"
          searchKeywords: {
            en: entity.searchKeywords.map((k: any) => {
              return { text: k };
            })
          },
          masterVariant: {
            id: entity.variants[0].id,
            sku: entity.variants[0].sku,
            // TODO: Mix with Base Attributes
            attributes: entity.variants[0].attributes,
            // Unsupported right now, faking data
            images: [],
            // Unsupported right now, faking data
            prices: []
          },
          variants: entity.variants.slice(1).map((v: any) => ({
            id: v.id,
            sku: v.sku,
            // TODO: Mix with Base Attributes
            attributes: v.attributes,
            // Unsupported right now, faking data
            images: [],
            // Unsupported right now, faking data
            prices: []
          }))
        },
        staged: {},
        // Unsupported right now, faking data
        hasStagedChanges: false,
        // Unsupported right now, faking data
        published: true
      }
    };
    return new Ok(productV1);
  }
}
