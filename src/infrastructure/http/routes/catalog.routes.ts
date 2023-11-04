import { FastifyInstance, FastifyPluginAsync, FastifyPluginOptions, FastifyReply, FastifyRequest } from 'fastify';
import { Result } from 'ts-results';
import { AppError } from '@core/lib/appError';
import { catalogService } from '@core/services/catalog.svc';
import {
  postCatalogSchema,
  CreateCatalogBody,
  FindCatalogParms,
  UpdateCatalogBody,
  updateCatalogSchema
} from '@infrastructure/http/schemas/catalog.schemas';
import { Catalog } from '@core/entities/catalog';

export default <FastifyPluginAsync>async function (server: FastifyInstance, opts: FastifyPluginOptions) {
  let service = catalogService(server);

  // CREATE
  server.route({
    method: 'POST',
    url: '/',
    schema: postCatalogSchema,
    handler: async (request: FastifyRequest<{ Body: CreateCatalogBody }>, reply: FastifyReply) => {
      const result: Result<Catalog, AppError> = await service.createCatalog(request.body);

      if (!result.ok) return reply.sendAppError(result.val);
      return reply.code(201).send(result.val);
    }
  });

  // UPDATE
  server.route({
    method: 'PATCH',
    url: '/:id',
    schema: updateCatalogSchema,
    handler: async (
      request: FastifyRequest<{ Params: FindCatalogParms; Body: UpdateCatalogBody }>,
      reply: FastifyReply
    ) => {
      const result: Result<Catalog, AppError> = await service.updateCatalog(
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
    handler: async (request: FastifyRequest<{ Params: FindCatalogParms }>, reply: FastifyReply) => {
      const result: Result<Catalog, AppError> = await service.findCatalogById(request.params.id);
      if (!result.ok) return reply.sendAppError(result.val);
      return reply.code(201).send(result.val);
    }
  });
};
