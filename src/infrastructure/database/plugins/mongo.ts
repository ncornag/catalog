import fp from 'fastify-plugin';
import mongo from '@fastify/mongodb';
import { FastifyInstance } from 'fastify';
import { green, red, magenta, yellow, bold } from 'kolorist';
import { Collection } from '@fastify/mongodb/node_modules/mongodb';
import { requestContext } from '@fastify/request-context';
import { REQUEST_ID_STORE_KEY, PROJECT_ID_STORE_KEY } from '@infrastructure/http/plugins/requestContext';

import {
  ClassificationCategoryRepository,
  getClassificationCategoryCollection
} from '@infrastructure/repositories/classificationCategory.repo';
import {
  ProductCategoryRepository,
  getProductCategoryCollection
} from '@infrastructure/repositories/productCategory.repo';

declare module 'fastify' {
  export interface FastifyInstance {
    db: { mongo: any; col: any; repo: any };
  }
}

export default fp(async function (server: FastifyInstance) {
  server.decorate('db', { mongo, col: {}, repo: {} } as any);

  // Register
  const { MONGO_URL: mongoUrl } = server.config;
  await server.register(mongo, { forceClose: true, url: mongoUrl, monitorCommands: true });

  // Log
  const dbOut = bold(yellow('→')) + yellow('DB:');
  const dbIn = bold(yellow('←')) + yellow('DB:');
  const ignoredCommandsForLogging = ['createIndexes', 'listCollections', 'currentOp', 'drop'];

  server.mongo.client.on('commandStarted', (event) => {
    if (ignoredCommandsForLogging.includes(event.commandName)) return;
    server.log.debug(
      `${magenta('#' + (requestContext.get(REQUEST_ID_STORE_KEY) || ''))} ${dbOut} ${event.requestId} ${green(
        JSON.stringify(event.command)
      )}`
    );
  });
  server.mongo.client.on('commandSucceeded', (event) => {
    if (ignoredCommandsForLogging.includes(event.commandName)) return;
    server.log.debug(
      `${magenta('#' + (requestContext.get(REQUEST_ID_STORE_KEY) || ''))} ${dbIn} ${event.requestId} ${green(
        JSON.stringify(event.reply)
      )}`
    );
  });
  server.mongo.client.on('commandFailed', (event) =>
    server.log.warn(
      `${magenta('#' + (requestContext.get(REQUEST_ID_STORE_KEY) || ''))} ${dbIn} ${event.requestId} ${red(
        JSON.stringify(event, null, 2)
      )}`
    )
  );

  // Iterceptor targets
  const pidTargets: string[] = ['find', 'insertOne', 'updateOne', 'updateMany'];
  const insertTargets: string[] = ['insertOne'];
  const updateTargets: string[] = ['updateOne', 'updateMany'];

  // Interceptor -- Force projectId in find & updates
  const pidInterceptor: Function = function (obj: any, replace: Function, name: string) {
    obj.prototype[name] = function (...args: any[]) {
      // Add projectId
      const projectId = requestContext.get(PROJECT_ID_STORE_KEY) || 'TestProject';
      args[0].projectId = projectId;
      // console.log(name, 'pidInterceptor');
      // console.log(JSON.stringify(args, null, 2));
      return replace.apply(this, args as any);
    };
  };

  // Interceptor -- Create timestamp / version
  const insertInterceptor: Function = function (obj: any, replace: Function, name: string) {
    obj.prototype[name] = function (...args: any[]) {
      // Add timestamp
      args[0].createdAt = new Date().toISOString();
      // Add version
      args[0].version = 0;
      // console.log(name, 'insertInterceptor');
      // console.log(JSON.stringify(args, null, 2));
      return replace.apply(this, args as any);
    };
  };

  // Interceptor -- Update timestamp / version
  const updateInterceptor: Function = function (obj: any, replace: Function, name: string) {
    obj.prototype[name] = function (...args: any[]) {
      // console.log(name, 'updateInterceptor, original values:');
      // console.log(JSON.stringify(args, null, 2));
      const filter = args[0];
      const update = args[1];
      const set = update.$set || {};
      const inc = update.$inc || {};
      // Version management
      const setVersion = set.version || 0;
      if (filter.version === undefined) {
        filter.version = setVersion;
      }
      delete set.version;
      // Update Timestamp
      set.lastModifiedAt = new Date().toISOString(); // TODO use server date?
      update.$set = set;
      // Update Version
      inc.version = 1;
      update.$inc = inc;
      // console.log(name, 'updateInterceptor, updated values:');
      // console.log(JSON.stringify(args, null, 2));
      return replace.apply(this, args as any);
    };
  };

  // Intercept
  pidTargets.forEach((m: string) => pidInterceptor(Collection, (Collection.prototype as any)[m] as Function, m));
  insertTargets.forEach((m: string) => insertInterceptor(Collection, (Collection.prototype as any)[m] as Function, m));
  updateTargets.forEach((m: string) => updateInterceptor(Collection, (Collection.prototype as any)[m] as Function, m));

  // Register Collections
  server.db.col.classificationCategory = getClassificationCategoryCollection(server.mongo.db!);
  server.db.col.productCategory = getProductCategoryCollection(server.mongo.db!);

  // Register Repositories
  server.db.repo.classificationCategoryRepository = new ClassificationCategoryRepository(server);
  server.db.repo.productCategoryRepository = new ProductCategoryRepository(server);

  // Indexes
  await Promise.all([
    server.db.col.classificationCategory.createIndex({ projectId: 1, key: 1 }, { name: 'CC_Key' }), // unique: true
    server.db.col.productCategory.createIndex({ projectId: 1, 'attributes.name': 1 }, { name: 'CCA_Key' })
  ]);
});
