import * as color from 'kolorist';
color.options.supportLevel = 2; // Hack for fastify-request-logger@1.3.0 to allow 'supportsArt'

import fastify, { type FastifyInstance, type FastifyServerOptions } from 'fastify';
import { type TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import fastifyRequestLogger from '@mgcrea/fastify-request-logger';
import { fastifyRequestContext } from '@fastify/request-context';
import mongo from '@infrastructure/database/plugins/mongo';
import rabbitmq from '@infrastructure/queues/plugins/rabbitmq';

import docs from '@infrastructure/http/plugins/docs';
import sendAppError from '@infrastructure/http/plugins/sendAppError';
import config from '@infrastructure/http/plugins/config';
import attributesValidator from '@infrastructure/http/plugins/attributesValidator';
import { requestContextProvider, getRequestIdFastifyAppConfig } from '@infrastructure/http/plugins/requestContext';
import { AppError, ErrorCode } from '@core/lib/appError';
import { errorName } from '@infrastructure/database/mongoErrors';
import { auditLogService } from '@core/services/listeners/auditLog.svc';
import { updateChildAncestorsForIdService } from '@core/services/listeners/updateChildAncestorsForId.svc';
import classificationCategoryRoutes from '@infrastructure/http/routes/classificationCategory.routes';
import productCategoryRoutes from '@infrastructure/http/routes/productCategory.routes';
import productRoutes from '@infrastructure/http/routes/product.routes';
import productRoutesV1 from '@infrastructure/http/routes/productV1.routes';
import catalogRoutes from '@infrastructure/http/routes/catalog.routes';
import catalogSyncRoutes from '@infrastructure/http/routes/catalogSync.routes';
import typesense from '@infrastructure/search/plugins/typesense';

export const createServer = async (): Promise<FastifyInstance> => {
  const environment = process.env.NODE_ENV ?? 'production';

  // Logger options per environment
  const envToLogger: any = {
    development: {
      level: 'debug',
      transport: {
        target: '@mgcrea/pino-pretty-compact',
        options: {
          translateTime: 'yyyy-mm-dd HH:MM:ss.l',
          colorize: true,
          ignore: 'pid,hostname,plugin'
        }
      }
    },
    production: true,
    test: false
  };

  // Server
  const serverOptions: FastifyServerOptions = {
    ajv: {
      customOptions: {
        removeAdditional: false,
        coerceTypes: 'array',
        useDefaults: true
        //keywords: ['kind', 'modifier']
      },
      plugins: [require('ajv-formats')]
    },
    logger: envToLogger[environment] ?? true,
    disableRequestLogging: true,
    ...getRequestIdFastifyAppConfig()
  };
  const server = fastify(serverOptions).withTypeProvider<TypeBoxTypeProvider>();

  // Global Error handler
  server.setErrorHandler(function (error, request, reply) {
    console.log(JSON.stringify(error, null, 2));
    if (error.validation) {
      const additionalProperty = error.validation[0]?.params?.additionalProperty
        ? ' [' + error.validation[0]?.params?.additionalProperty + ']'
        : '';
      const instancePath = error.validation[0]?.instancePath ? ' [' + error.validation[0]?.instancePath + ']' : '';
      const message = error.validation[0]
        ? error.validation[0].message + instancePath + additionalProperty
        : error.message;
      reply.send(new AppError(ErrorCode.UNPROCESSABLE_ENTITY, message));
    } else if (error.name == 'MongoServerError') {
      reply.send(new AppError(ErrorCode.BAD_REQUEST, errorName(error.code as any)));
    } else {
      reply.send(error);
    }
  });

  // Plugins
  await server.register(config);
  const { PROJECTID: projectId = 'TestProject' } = server.config;
  await server.register(fastifyRequestLogger); //, { logBody: true }
  await server.register(docs);
  await server.register(rabbitmq);
  await server.register(mongo);
  await server.register(typesense);
  await server.register(sendAppError);
  await server.register(fastifyRequestContext);
  await server.register(requestContextProvider, { projectId });
  await server.register(attributesValidator);

  // Print Routes
  // const importDynamic = new Function('modulePath', 'return import(modulePath)');
  // const fastifyPrintRoutes = await importDynamic('fastify-print-routes');
  // await server.register(fastifyPrintRoutes);

  // Load Routes
  await server.register(classificationCategoryRoutes, { prefix: '/classificationCategories' });
  await server.register(productCategoryRoutes, { prefix: '/productCategories' });
  await server.register(productRoutes, { prefix: '/products' });
  await server.register(productRoutesV1, { prefix: '/v1/products' });
  await server.register(catalogRoutes, { prefix: '/catalog' });
  await server.register(catalogSyncRoutes, { prefix: '/catalogSync' });

  // Load Services
  auditLogService(server);
  updateChildAncestorsForIdService(server);

  await server.ready();

  return server;
};
