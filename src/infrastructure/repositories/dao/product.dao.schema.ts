import { ProductSchema } from '@core/entities/product';
import { Static, Type } from '@sinclair/typebox';

// DAO
export const ProductDAOSchema = Type.Composite([Type.Omit(ProductSchema, ['id']), Type.Object({ _id: Type.String() })]);
export type ProductDAO = Static<typeof ProductDAOSchema>;
