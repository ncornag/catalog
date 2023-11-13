import { FastifyInstance, FastifyPluginAsync, FastifyPluginOptions, FastifyReply, FastifyRequest } from 'fastify';
import { Result } from 'ts-results';
import { AppError } from '@core/lib/appError';
import { CatalogSyncService } from '@core/services/catalogSync.svc';
import {
  syncCatalogSchema,
  SyncCatalogBody,
  postCatalogSyncSchema,
  CreateCatalogSyncBody,
  FindCatalogSyncParms,
  UpdateCatalogSyncBody,
  updateCatalogSyncSchema
} from '@infrastructure/http/schemas/catalogSync.schemas';
import { CatalogSync } from '@core/entities/catalogSync';

export default <FastifyPluginAsync>async function (server: FastifyInstance, opts: FastifyPluginOptions) {
  let service = CatalogSyncService.getInstance(server);

  // SYNC
  server.route({
    method: 'POST',
    url: '/sync',
    schema: syncCatalogSchema,
    handler: async (request: FastifyRequest<{ Body: SyncCatalogBody }>, reply: FastifyReply) => {
      const result: Result<boolean, AppError> = await service.syncCatalogs(request.body);

      if (!result.ok) return reply.sendAppError(result.val);
      return reply.code(201).send(result.val);
    }
  });

  // CREATE
  server.route({
    method: 'POST',
    url: '/',
    schema: postCatalogSyncSchema,
    handler: async (request: FastifyRequest<{ Body: CreateCatalogSyncBody }>, reply: FastifyReply) => {
      const result: Result<CatalogSync, AppError> = await service.createCatalogSync(request.body);

      if (!result.ok) return reply.sendAppError(result.val);
      return reply.code(201).send(result.val);
    }
  });

  // UPDATE
  server.route({
    method: 'PATCH',
    url: '/:id',
    schema: updateCatalogSyncSchema,
    handler: async (
      request: FastifyRequest<{ Params: FindCatalogSyncParms; Body: UpdateCatalogSyncBody }>,
      reply: FastifyReply
    ) => {
      const result: Result<CatalogSync, AppError> = await service.updateCatalogSync(
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
    handler: async (request: FastifyRequest<{ Params: FindCatalogSyncParms }>, reply: FastifyReply) => {
      const result: Result<CatalogSync, AppError> = await service.findCatalogSyncById(request.params.id);
      if (!result.ok) return reply.sendAppError(result.val);
      return reply.code(201).send(result.val);
    }
  });
};
