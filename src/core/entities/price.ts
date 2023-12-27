import { AuditFields } from '@core/lib/auditFields';
import { Type, Static } from '@sinclair/typebox';

export const ValueSchema = Type.Object(
  {
    type: Type.String(),
    currencyCode: Type.String(),
    centAmount: Type.Number(),
    fractionDigits: Type.Number()
  },
  { additionalProperties: false }
);
export type Value = Static<typeof ValueSchema>;

export const PredicateSchema = Type.Object(
  {
    order: Type.Number(),
    value: ValueSchema,
    expression: Type.String(),
    constraints: Type.Object({
      country: Type.Optional(Type.String()),
      customerGroup: Type.Optional(Type.String()),
      channel: Type.Optional(Type.String()),
      validFrom: Type.Optional(Type.String({ format: 'date-time' })),
      validUntil: Type.Optional(Type.String({ format: 'date-time' })),
      minimumQuantity: Type.Optional(Type.Number())
    })
  },
  { additionalProperties: false }
);
export type Predicate = Static<typeof PredicateSchema>;

// ENTITY
export const PriceSchema = Type.Object(
  {
    id: Type.String(),
    catalog: Type.String(),
    key: Type.Optional(Type.String()),
    active: Type.Boolean({ default: false }),
    sku: Type.String(),
    prices: Type.Array(PredicateSchema),
    ...AuditFields
  },
  { additionalProperties: false }
);
export type Price = Static<typeof PriceSchema>;
