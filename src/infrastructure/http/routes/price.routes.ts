import tsresult, { type Result } from 'ts-results';
const { Ok, Err } = tsresult;
import { type FastifyInstance, type FastifyPluginOptions, type FastifyReply, type FastifyRequest } from 'fastify';
import { AppError } from '#core/lib/appError';
import { PriceService as PriceService } from '#core/services/price.svc';
import { type Price } from '#core/entities/price';
import { type CreatePriceBody, type FindPriceQueryString, postPriceSchema } from '../schemas/price.schemas.ts';

export default async function (server: FastifyInstance, opts: FastifyPluginOptions) {
  let service = PriceService.getInstance(server);

  // CREATE
  server.route({
    method: 'POST',
    url: '/',
    schema: postPriceSchema,
    handler: async (
      request: FastifyRequest<{ Body: CreatePriceBody; Querystring: FindPriceQueryString }>,
      reply: FastifyReply
    ) => {
      const result: Result<Price, AppError> = await service.createPrice(request.query.catalog, request.body);

      if (!result.ok) return reply.sendAppError(result.val);
      return reply.code(201).send(result.val);
    }
  });

  // GET
  server.route({
    method: 'GET',
    url: '/:id',
    //schema: postPriceSchema,
    handler: async (request, reply) => {
      const result: Result<Price, AppError> = await service.findPriceById('', '');
      if (!result.ok) return reply.sendAppError(result.val);
      return reply.code(201).send(result.val);
    }
  });
};
