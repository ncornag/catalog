import { AuditFields } from '@core/lib/auditFields';
import { Type, Static } from '@sinclair/typebox';

// ENTITY
export const PriceSchema = Type.Object(
  {
    id: Type.String(),
    catalog: Type.String(),
    key: Type.Optional(Type.String()),
    active: Type.Boolean({ default: false }),
    sku: Type.String(),
    ...AuditFields
  },
  { additionalProperties: false }
);
export type Price = Static<typeof PriceSchema>;
