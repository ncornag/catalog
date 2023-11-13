import { Err, Ok, Result } from 'ts-results';
import { AppError, ErrorCode } from '@core/lib/appError';
import { type Product, UpdateProductAction, ProductType } from '@core/entities/product';
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
export const productService = (server: any): IProductServiceV1 => {
  const repo = server.db.repo.productRepository as IProductRepository;
  return {
    // FIND PRODUCT BY ID
    findProductById: async (
      catalogId: string,
      id: string,
      materialized: boolean = false
    ): Promise<Result<any, AppError>> => {
      const result = await repo.aggregate(catalogId, [
        { $match: { _id: id } },
        {
          $lookup: {
            from: server.db.col.product[catalogId].collectionName,
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
            categories: entity.categories.map((c: any) => ({ id: c, typeId: 'category' })),
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
  };
};

let a = {
  id: 'e7ba4c75-b1bb-483d-94d8-2c4a10f78472',
  version: 2,
  productType: {
    id: '24f510c3-f334-4099-94e2-d6224a8eb919',
    typeId: 'product-type'
  },
  taxCategory: {
    id: 'f1e10e3a-45eb-49d8-ad0b-fdf984202f59',
    typeId: 'tax-category'
  },
  createdAt: '1970-01-01T00:00:00.001Z',
  lastModifiedAt: '1970-01-01T00:00:00.001Z',

  masterData: {
    current: {
      categories: [
        {
          id: 'cf6d790a-f027-4f46-9a2b-4bc9a31066fb',
          typeId: 'category'
        }
      ],
      description: {
        en: 'Sample description'
      },
      name: {
        en: 'MB PREMIUM TECH T'
      },
      slug: {
        en: 'mb-premium-tech-t1369226795424'
      },
      searchKeywords: {},

      masterVariant: {
        attributes: [],
        id: 1,
        images: [
          {
            dimensions: {
              h: 1400,
              w: 1400
            },
            url: 'https://commercetools.com/cli/data/253245821_1.jpg'
          }
        ],
        prices: [
          {
            value: {
              type: 'centPrecision',
              fractionDigits: 2,
              centAmount: 10000,
              currencyCode: 'EUR'
            },
            id: '753472a3-ddff-4e0f-a93b-2eb29c90ba54'
          }
        ],
        sku: 'sku_MB_PREMIUM_TECH_T_variant1_1369226795424'
      },
      variants: []
    },
    staged: {
      categories: [
        {
          id: 'cf6d790a-f027-4f46-9a2b-4bc9a31066fb',
          typeId: 'category'
        }
      ],
      description: {
        en: 'Sample description'
      },
      masterVariant: {
        attributes: [],
        id: 1,
        images: [
          {
            dimensions: {
              h: 1400,
              w: 1400
            },
            url: 'https://commercetools.com/cli/data/253245821_1.jpg'
          }
        ],
        prices: [
          {
            value: {
              type: 'centPrecision',
              fractionDigits: 2,
              centAmount: 10000,
              currencyCode: 'EUR'
            },
            id: '753472a3-ddff-4e0f-a93b-2eb29c90ba54'
          }
        ],
        sku: 'sku_MB_PREMIUM_TECH_T_variant1_1369226795424'
      },
      name: {
        en: 'MB PREMIUM TECH T'
      },
      slug: {
        en: 'mb-premium-tech-t1369226795424'
      },
      variants: [],
      searchKeywords: {}
    },
    hasStagedChanges: false,
    published: true
  }
};
