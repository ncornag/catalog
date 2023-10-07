import { Type, type Static, Optional } from '@sinclair/typebox';
import { ClassificationAttributeSchema } from '@core/entities/classificationAttribute';
import { TreeFieldsSchema, UpdateChangeParent, UpdateChangeParentSchema } from '@core/lib/tree';
import { AuditFields } from '@core/lib/auditFields';

const keyAttributes = { minLength: 2, maxLength: 256, pattern: '^[A-Za-z0-9_-]+$' };

// Action Types
export enum ClassificationCategoryUpdateActionType {
  SETKEY = 'setKey',
  CHANGENAME = 'changeName',
  CHANGEPARENT = 'changeParent'
}

// ACTIONS

// setKey action
export const UpdateClassificationCategorySetKeySchema = Type.Object(
  {
    action: Type.Literal(ClassificationCategoryUpdateActionType.SETKEY),
    key: Type.String(keyAttributes)
  },
  { additionalProperties: false }
);
export type UpdateClassificationCategorySetKey = Static<typeof UpdateClassificationCategorySetKeySchema>;

// changeName action
export const UpdateClassificationCategoryChangeNameSchema = Type.Object(
  {
    action: Type.Literal(ClassificationCategoryUpdateActionType.CHANGENAME),
    name: Type.String()
  },
  { additionalProperties: false }
);
export type UpdateClassificationCategoryChangeName = Static<typeof UpdateClassificationCategoryChangeNameSchema>;

export const UpdateClassificationCategoryChangeParentSchema = UpdateChangeParentSchema;
export type UpdateClassificationCategoryChangeParent = UpdateChangeParent;

// ACTION
export const UpdateClassificationCategoryAction = Type.Union([
  UpdateClassificationCategorySetKeySchema,
  UpdateClassificationCategoryChangeNameSchema,
  UpdateClassificationCategoryChangeParentSchema
]);
export type UpdateClassificationCategoryAction = Static<typeof UpdateClassificationCategoryAction>;

// ENTITY
export const ClassificationCategorySchema = Type.Object(
  {
    id: Type.String(),
    name: Type.String(),
    key: Type.Optional(Type.String(keyAttributes)),
    attributes: Type.Optional(Type.Array(ClassificationAttributeSchema, { default: [] })),
    ...TreeFieldsSchema,
    ...AuditFields
  },
  { additionalProperties: false }
);
export type ClassificationCategory = Static<typeof ClassificationCategorySchema>;
