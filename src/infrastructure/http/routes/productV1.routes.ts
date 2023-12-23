import { FastifyInstance, FastifyPluginAsync, FastifyPluginOptions, FastifyReply, FastifyRequest } from 'fastify';
import { Result } from 'ts-results';
import { AppError } from '@core/lib/appError';
import {
  FindProductParms,
  FindProductParmsSchema,
  FindProductQueryStringSchema
} from '@infrastructure/http/schemas/product.schemas';
import { ProductServiceV1 } from '@core/services/productV1.svc';
import { Product } from '@core/entities/product';

export default <FastifyPluginAsync>async function (server: FastifyInstance, opts: FastifyPluginOptions) {
  let service = ProductServiceV1.getInstance(server);

  // GET
  server.route({
    method: 'GET',
    url: '/:id',
    schema: {
      params: FindProductParmsSchema
    },
    handler: async (request: FastifyRequest<{ Params: FindProductParms }>, reply: FastifyReply) => {
      const result: Result<Product, AppError> = await service.findProductById(request.params.id);
      if (!result.ok) return reply.sendAppError(result.val);
      return reply.send(result.val);
    }
  });
};
