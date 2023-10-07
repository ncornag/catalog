import { AuditFields } from '@core/lib/auditFields';
import { Type, type Static } from '@sinclair/typebox';

// Action Types
export enum ProductUpdateActionType {
  CHANGENAME = 'changeName',
  CHANGEDESCRIPTION = 'changeDescription'
}

// ACTIONS

// changeName action
export const UpdateProductChangeNameSchema = Type.Object(
  {
    action: Type.Literal(ProductUpdateActionType.CHANGENAME),
    name: Type.String()
  },
  { additionalProperties: false }
);
export type UpdateProductChangeName = Static<typeof UpdateProductChangeNameSchema>;

// ChangeDescription action
export const UpdateProductChangeDescriptionSchema = Type.Object(
  {
    action: Type.Literal(ProductUpdateActionType.CHANGEDESCRIPTION),
    description: Type.String()
  },
  { additionalProperties: false }
);
export type UpdateProductChangeDescription = Static<typeof UpdateProductChangeDescriptionSchema>;

// ACTION
export const UpdateProductAction = Type.Union([UpdateProductChangeDescriptionSchema, UpdateProductChangeNameSchema]);
export type UpdateProductAction = Static<typeof UpdateProductAction>;

// ENTITY
export const ProductSchema = Type.Object(
  {
    id: Type.String(),
    name: Type.String(),
    description: Type.String(),
    categories: Type.Array(Type.String(), { default: [] }),
    ...AuditFields
  },
  { additionalProperties: false }
);
export type Product = Static<typeof ProductSchema>;
