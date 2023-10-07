import { type FastifySchema } from 'fastify';
import { Type, type Static } from '@sinclair/typebox';
import { UpdateProductAction, ProductSchema } from '@core/entities/product';

const defaultExample = {
  name: 'Root Category',
  key: 'root'
};

const ProductResponse = Type.Composite([ProductSchema], {
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
export const CreateProductBodySchema = Type.Omit(ProductSchema, ['id', 'createdAt', 'updatedAt', 'version'], {
  examples: [defaultExample],
  additionalProperties: false
});
export type CreateProductBody = Static<typeof CreateProductBodySchema>;

// UPDATE
export const UpdateProductBodySchema = Type.Object(
  {
    version: Type.Number(),
    actions: Type.Array(UpdateProductAction)
  },
  { additionalProperties: false }
);
export type UpdateProductBody = Static<typeof UpdateProductBodySchema>;

export const FindProductParmsSchema = Type.Object({ id: Type.String() });
export type FindProductParms = Static<typeof FindProductParmsSchema>;

// ROUTE SCHEMAS

export const postProductSchema: FastifySchema = {
  description: 'Create a new product',
  tags: ['product'],
  summary: 'Creates new product with given values',
  body: CreateProductBodySchema,
  response: {
    201: { ...ProductResponse, description: 'Success' }
  }
};

export const updateProductSchema: FastifySchema = {
  description: 'Update a product',
  tags: ['product'],
  summary: 'Updates a product with given values',
  body: UpdateProductBodySchema,
  params: FindProductParmsSchema,
  response: {
    201: { ...ProductResponse, description: 'Success' }
  }
};
