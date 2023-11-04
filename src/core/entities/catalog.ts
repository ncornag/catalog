import { AuditFields } from '@core/lib/auditFields';
import { Type, type Static } from '@sinclair/typebox';

// Action Types
export enum CatalogUpdateActionType {
  CHANGENAME = 'changeName'
}

// ACTIONS

// changeName action
export const UpdateCatalogChangeNameSchema = Type.Object(
  {
    action: Type.Literal(CatalogUpdateActionType.CHANGENAME),
    name: Type.String()
  },
  { additionalProperties: false }
);
export type UpdateCatalogChangeName = Static<typeof UpdateCatalogChangeNameSchema>;

// ACTION
export const UpdateCatalogAction = Type.Union([UpdateCatalogChangeNameSchema]);
export type UpdateCatalogAction = Static<typeof UpdateCatalogAction>;

// ENTITY
export const CatalogSchema = Type.Object(
  {
    id: Type.String(),
    name: Type.String(),
    ...AuditFields
  },
  { additionalProperties: false }
);
export type Catalog = Static<typeof CatalogSchema>;
