import { type FastifySchema } from 'fastify';
import { Type, type Static } from '@sinclair/typebox';
import { UpdateProductCategoryAction, ProductCategorySchema } from '@core/entities/productCategory';
// import { notFoundSchema } from '@infrastructure/http/schemas/error.schemas'

const defaultExample = {
  name: 'Root Category',
  key: 'root'
};

const ProductCategoryResponse = Type.Composite([ProductCategorySchema], {
  examples: [
    {
      id: '63cd0e4be59031edffa39f5c',
      verdion: 0,
      ...defaultExample,
      createdAt: '2021-01-01T00:00:00.000Z'
    }
  ]
});

// CREATE
export const CreateProductCategoryBodySchema = Type.Omit(
  ProductCategorySchema,
  ['id', 'ancestors', 'createdAt', 'lastModifiedAt', 'version'],
  {
    examples: [defaultExample],
    additionalProperties: false
  }
);
export type CreateProductCategoryBody = Static<typeof CreateProductCategoryBodySchema>;

// UPDATE
export const UpdateProductCategoryBodySchema = Type.Object(
  {
    version: Type.Number(),
    actions: Type.Array(UpdateProductCategoryAction)
  },
  { additionalProperties: false }
);
export type UpdateProductCategoryBody = Static<typeof UpdateProductCategoryBodySchema>;

export const FindProductCategoryParmsSchema = Type.Object({ id: Type.String() });
export type FindProductCategoryParms = Static<typeof FindProductCategoryParmsSchema>;

// ROUTE SCHEMAS

export const postProductCategorySchema: FastifySchema = {
  description: 'Create a new productCategory',
  tags: ['productCategory'],
  summary: 'Creates new productCategory with given values',
  body: CreateProductCategoryBodySchema,
  response: {
    201: { ...ProductCategoryResponse, description: 'Success' }
  }
};

export const updateProductCategorySchema: FastifySchema = {
  description: 'Update a productCategory',
  tags: ['productCategory'],
  summary: 'Updates a productCategory with given values',
  body: UpdateProductCategoryBodySchema,
  params: FindProductCategoryParmsSchema,
  response: {
    201: { ...ProductCategoryResponse, description: 'Success' }
  }
};
