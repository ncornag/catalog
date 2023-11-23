import { FastifyInstance, FastifyPluginAsync, FastifyPluginOptions, FastifyReply, FastifyRequest } from 'fastify';
import { Result } from 'ts-results';
import { AppError } from '@core/lib/appError';
import {
  CreateProductCategoryBody,
  UpdateProductCategoryBody,
  FindProductCategoryParms,
  postProductCategorySchema,
  updateProductCategorySchema
} from '@infrastructure/http/schemas/productCategory.schemas';
import { ProductCategoryService } from '@core/services/productCategory.svc';
import { ProductCategory } from '@core/entities/productCategory';

export default <FastifyPluginAsync>async function (server: FastifyInstance, opts: FastifyPluginOptions) {
  let service = ProductCategoryService.getInstance(server);

  // CREATE
  server.route({
    method: 'POST',
    url: '/',
    schema: postProductCategorySchema,
    handler: async (request: FastifyRequest<{ Body: CreateProductCategoryBody }>, reply: FastifyReply) => {
      const result: Result<ProductCategory, AppError> = await service.createProductCategory(request.body);

      if (!result.ok) return reply.sendAppError(result.val);
      return reply.code(201).send(result.val);
    }
  });

  // UPDATE
  server.route({
    method: 'PATCH',
    url: '/:id',
    schema: updateProductCategorySchema,
    handler: async (
      request: FastifyRequest<{ Params: FindProductCategoryParms; Body: UpdateProductCategoryBody }>,
      reply: FastifyReply
    ) => {
      const result: Result<ProductCategory, AppError> = await service.updateProductCategory(
        request.params.id,
        request.body.version,
        request.body.actions
      );

      if (!result.ok) return reply.sendAppError(result.val);
      return reply.send(result.val);
    }
  });

  // GET
  server.route({
    method: 'GET',
    url: '/:id',
    handler: async (request: FastifyRequest<{ Params: FindProductCategoryParms }>, reply: FastifyReply) => {
      const result: Result<ProductCategory, AppError> = await service.findProductCategoryById(request.params.id);
      if (!result.ok) return reply.sendAppError(result.val);
      return reply.send(result.val);
    }
  });

  // VALIDATE
  server.route({
    method: 'POST',
    url: '/:id/validate',
    handler: async (request: FastifyRequest<{ Params: FindProductCategoryParms }>, reply: FastifyReply) => {
      const result: Result<Boolean, AppError> = await service.validate(request.params.id, request.body);
      if (!result.ok) return reply.sendAppError(result.val);
      return reply.send(result.val);
    }
  });
};
