import tsresult, { type Result } from 'ts-results';
const { Ok, Err } = tsresult;
import { type FastifyInstance, type FastifyPluginOptions, type FastifyReply, type FastifyRequest } from 'fastify';
import { AppError } from '#core/lib/appError';
import {
  type FindProductParms,
  FindProductParmsSchema,
  FindProductQueryStringSchema
} from '#infrastructure/http/schemas/product.schemas';
import { ProductServiceV1 } from '#core/services/productV1.svc';
import { type Product } from '#core/entities/product';

export default async function (server: FastifyInstance, opts: FastifyPluginOptions) {
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
