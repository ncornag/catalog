import { FastifyInstance, FastifyPluginAsync, FastifyPluginOptions, FastifyReply, FastifyRequest } from 'fastify';
import { Result } from 'ts-results';
import { AppError } from '@core/lib/appError';
import {
  CreateProductBody,
  UpdateProductBody,
  FindProductParms,
  postProductSchema,
  updateProductSchema
} from '@infrastructure/http/schemas/product.schemas';
import { productService } from '@core/services/product.svc';
import { Product } from '@core/entities/product';

export default <FastifyPluginAsync>async function (server: FastifyInstance, opts: FastifyPluginOptions) {
  let service = productService(server);

  // CREATE
  server.route({
    method: 'POST',
    url: '/',
    schema: postProductSchema,
    handler: async (request: FastifyRequest<{ Body: CreateProductBody }>, reply: FastifyReply) => {
      const result: Result<Product, AppError> = await service.createProduct(request.body);

      if (!result.ok) return reply.sendAppError(result.val);
      return reply.code(201).send(result.val);
    }
  });

  // UPDATE
  server.route({
    method: 'PATCH',
    url: '/:id',
    schema: updateProductSchema,
    handler: async (
      request: FastifyRequest<{ Params: FindProductParms; Body: UpdateProductBody }>,
      reply: FastifyReply
    ) => {
      const result: Result<Product, AppError> = await service.updateProduct(
        request.params.id,
        request.body.version,
        request.body.actions
      );

      if (!result.ok) return reply.sendAppError(result.val);
      return reply.code(201).send(result.val);
    }
  });

  // GET
  server.route({
    method: 'GET',
    url: '/:id',
    handler: async (request: FastifyRequest<{ Params: FindProductParms }>, reply: FastifyReply) => {
      const result: Result<Product, AppError> = await service.findProductById(request.params.id);
      if (!result.ok) return reply.sendAppError(result.val);
      return reply.code(201).send(result.val);
    }
  });

  // VALIDATE
  server.route({
    method: 'POST',
    url: '/:id/validate',
    handler: async (request: FastifyRequest<{ Params: FindProductParms }>, reply: FastifyReply) => {
      const result: Result<Boolean, AppError> = await service.validate(request.params.id, request.body);
      if (!result.ok) return reply.sendAppError(result.val);
      return reply.code(201).send(result.val);
    }
  });
};
