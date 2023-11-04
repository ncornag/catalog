import { FastifyInstance, FastifyPluginAsync, FastifyPluginOptions, FastifyReply, FastifyRequest } from 'fastify';
import { Result } from 'ts-results';
import { AppError } from '@core/lib/appError';
import {
  CreateProductBody,
  UpdateProductBody,
  FindProductParms,
  postProductSchema,
  updateProductSchema,
  FindProductQueryString,
  FindProductQueryStringSchema
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
    handler: async (
      request: FastifyRequest<{ Body: CreateProductBody; Querystring: FindProductQueryString }>,
      reply: FastifyReply
    ) => {
      const result: Result<Product, AppError> = await service.createProduct(request.query.catalog, request.body);

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
      request: FastifyRequest<{
        Params: FindProductParms;
        Body: UpdateProductBody;
        Querystring: FindProductQueryString;
      }>,
      reply: FastifyReply
    ) => {
      const result: Result<Product, AppError> = await service.updateProduct(
        request.query.catalog,
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
    schema: {
      querystring: FindProductQueryStringSchema
    },
    handler: async (
      request: FastifyRequest<{ Params: FindProductParms; Querystring: FindProductQueryString }>,
      reply: FastifyReply
    ) => {
      console.log(request.query);
      const result: Result<Product, AppError> = await service.findProductById(
        request.query.catalog,
        request.params.id,
        request.query.materialized
      );
      if (!result.ok) return reply.sendAppError(result.val);
      return reply.code(201).send(result.val);
    }
  });
};
