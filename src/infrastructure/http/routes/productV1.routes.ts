import { FastifyInstance, FastifyPluginAsync, FastifyPluginOptions, FastifyReply, FastifyRequest } from 'fastify';
import { Result } from 'ts-results';
import { AppError } from '@core/lib/appError';
import {
  FindProductParms,
  FindProductQueryString,
  FindProductQueryStringSchema
} from '@infrastructure/http/schemas/product.schemas';
import { ProductService } from '@core/services/productV1.svc';
import { Product } from '@core/entities/product';

export default <FastifyPluginAsync>async function (server: FastifyInstance, opts: FastifyPluginOptions) {
  let service = ProductService.getInstance(server);

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
      const result: Result<Product, AppError> = await service.findProductById(request.query.catalog, request.params.id);
      if (!result.ok) return reply.sendAppError(result.val);
      return reply.code(201).send(result.val);
    }
  });
};
