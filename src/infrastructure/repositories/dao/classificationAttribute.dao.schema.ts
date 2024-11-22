import { ClassificationAttributeSchema } from '#core/entities/classificationAttribute';
import { type Static, Type } from '@sinclair/typebox';

// ATTRIBUTE DAO
export const ClassificationAttributeDAOSchema = ClassificationAttributeSchema;
export type ClassificationAttributeDAO = Static<typeof ClassificationAttributeDAOSchema>;
