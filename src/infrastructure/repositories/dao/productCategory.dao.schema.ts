import { ProductCategorySchema } from '@core/entities/productCategory';
import { ITree } from '@core/lib/tree';
import { Static, Type } from '@sinclair/typebox';

// DAO
export const ProductCategoryDAOSchema = Type.Composite([
  Type.Omit(ProductCategorySchema, ['id']),
  Type.Object({ _id: Type.String() })
]);
export type ProductCategoryDAO = Static<typeof ProductCategoryDAOSchema, [ITree<string>]>;
