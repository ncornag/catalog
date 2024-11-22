import { ClassificationCategorySchema } from '#core/entities/classificationCategory';
import { type ITree } from '#core/lib/tree';
import { type Static, Type } from '@sinclair/typebox';

// DAO
export const ClassificationCategoryDAOSchema = Type.Composite([
  Type.Omit(ClassificationCategorySchema, ['id']),
  Type.Object({ _id: Type.String() })
]);
export type ClassificationCategoryDAO = Static<typeof ClassificationCategoryDAOSchema, [ITree<string>]>;
