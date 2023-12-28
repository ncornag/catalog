import { FastifyInstance, FastifyPluginAsync, FastifyPluginOptions, FastifyReply, FastifyRequest } from 'fastify';
import { Result } from 'ts-results';
import { AppError } from '@core/lib/appError';
import { PriceService as CartService } from '@core/services/price.svc';
import { Cart } from '@core/entities/cart';

export default <FastifyPluginAsync>async function (server: FastifyInstance, opts: FastifyPluginOptions) {
  let service = CartService.getInstance(server);

  // GET
  server.route({
    method: 'POST',
    url: '/',
    //schema: postCartSchema,
    handler: async (
      //request: FastifyRequest<{ Body: CreateCartBody; Querystring: FindCartQueryString }>,
      request: FastifyRequest,
      reply: FastifyReply
    ) => {
      const result: Result<Cart, AppError> = await service.createCart(request.body);
      if (!result.ok) return reply.sendAppError(result.val);
      return reply.code(201).send(result.val);
    }
  });
};
