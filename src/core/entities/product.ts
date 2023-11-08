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

// PRODUCT TYPES
export enum ProductType {
  BASE = 'base',
  VARIANT = 'variant',
  COMPOSITE = 'composite'
}

// ENTITY
export const ProductSchema = Type.Object(
  {
    id: Type.String(),
    catalog: Type.String(),
    name: Type.String(),
    description: Type.Optional(Type.String()),
    sku: Type.Optional(Type.String()), // Optional in the base product
    slug: Type.Optional(Type.String()), // Optional in the variants
    searchKeywords: Type.Array(Type.String(), { default: [] }),
    categories: Type.Array(Type.String(), { default: [] }),
    attributes: Type.Any({ default: {} }),
    type: Type.Enum(ProductType), // BASE, VARIANT, COMPOSITE...
    parent: Type.String({ default: '' }), // If this is a variant, the parent product id
    status: Type.Optional(Type.String()), // Active, Inactive... Approved, Pending, Rejected
    original: Type.Optional(Type.Any()), // The original product before any changes
    ...AuditFields
  },
  { additionalProperties: false }
);
export type Product = Static<typeof ProductSchema>;
