import { FastifyInstance, FastifyPluginAsync, FastifyPluginOptions, FastifyReply, FastifyRequest } from 'fastify';
import { Result } from 'ts-results';
import { AppError } from '@core/lib/appError';
import { PriceService as PriceService } from '@core/services/price.svc';
import { Price } from '@core/entities/price';
import { CreatePriceBody, FindPriceQueryString, postPriceSchema } from '../schemas/price.schemas';

export default <FastifyPluginAsync>async function (server: FastifyInstance, opts: FastifyPluginOptions) {
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
