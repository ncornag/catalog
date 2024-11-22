import tsresult, { type Result } from 'ts-results';
const { Ok, Err } = tsresult;
import { type FastifyInstance, type FastifyPluginOptions, type FastifyReply, type FastifyRequest } from 'fastify';
import { AppError } from '#core/lib/appError';
import { PriceService as CartService } from '#core/services/price.svc';
import { type Cart } from '#core/entities/cart';

export default async function (server: FastifyInstance, opts: FastifyPluginOptions) {
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
