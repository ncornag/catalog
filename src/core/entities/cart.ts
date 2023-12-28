import { AuditFields } from '@core/lib/auditFields';
import { Type, Static } from '@sinclair/typebox';
import { ValueSchema } from '@core/entities/price';

const CartProductSchema = Type.Object({
  productId: Type.String(),
  sku: Type.String(),
  name: Type.String(),
  categories: Type.Array(Type.String())
});
export type CartProduct = Static<typeof CartProductSchema>;

const CartItemSchema = Type.Object({
  productId: Type.String(),
  sku: Type.String(),
  name: Type.String(),
  categories: Type.Array(Type.String()),
  quantity: Type.Number(),
  value: ValueSchema
});
export type CartItem = Static<typeof CartItemSchema>;

// ENTITY
export const CartSchema = Type.Object(
  {
    id: Type.String(),
    items: Type.Array(CartItemSchema),
    ...AuditFields
  },
  { additionalProperties: false }
);
export type Cart = Static<typeof CartSchema>;
