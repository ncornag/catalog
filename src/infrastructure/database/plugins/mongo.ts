import fp from 'fastify-plugin';
import mongo from '@fastify/mongodb';
import { FastifyInstance } from 'fastify';
import { green, red, magenta, yellow, bold } from 'kolorist';
import { Collection } from 'mongodb';
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
import { ProductRepository, getProductCollection } from '@infrastructure/repositories/product.repo';
import { PriceRepository, getPriceCollection } from '@infrastructure/repositories/price.repo';
import { CatalogRepository, getCatalogCollection } from '@infrastructure/repositories/catalog.repo';
import { CatalogSyncRepository, getCatalogSyncCollection } from '@infrastructure/repositories/catalogSync.repo';
import { AuditLogRepository, getAuditLogCollection } from '@infrastructure/repositories/auditLog.repo';

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

  server.log.info(`${yellow('MongoDB')} ${green('starting in')} [${mongoUrl}]`);

  // Log
  const dbOut = bold(yellow('→')) + yellow('DB:');
  const dbIn = bold(yellow('←')) + yellow('DB:');
  const ignoredCommandsForLogging = ['createIndexes', 'listCollections', 'currentOp', 'drop'];

  server.mongo.client.on('commandStarted', (event) => {
    if (ignoredCommandsForLogging.includes(event.commandName)) return;
    if (server.log.isLevelEnabled('debug'))
      server.log.debug(
        `${magenta('#' + (requestContext.get(REQUEST_ID_STORE_KEY) || ''))} ${dbOut} ${event.requestId} ${green(
          JSON.stringify(event.command)
        )}`
      );
  });
  server.mongo.client.on('commandSucceeded', (event) => {
    if (ignoredCommandsForLogging.includes(event.commandName)) return;
    if (server.log.isLevelEnabled('debug'))
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
  const projectIdTargets: string[] = ['find', 'insertOne', 'updateOne', 'updateMany', 'bulkWrite'];
  const createTargets: string[] = ['insertOne'];
  const updateTargets: string[] = ['updateOne', 'updateMany', 'bulkWrite'];

  // ProjectId Interceptor -- Force projectId in find & updates
  const projectIdOne = function (data: any) {
    // Add projectId
    const projectId = requestContext.get(PROJECT_ID_STORE_KEY) || 'TestProject';
    data.projectId = projectId;
    return data;
  };
  const projectIdInterceptor: Function = function (obj: any, replace: Function, name: string) {
    obj.prototype[name] = function (...args: any[]) {
      if (Array.isArray(args[0])) {
        args[0] = args[0].map((a) => {
          if (a.updateOne) {
            return { updateOne: { filter: projectIdOne(a.updateOne.filter), update: a.updateOne.update } };
          } else if (a.insertOne) {
            return { insertOne: { document: projectIdOne(a.insertOne.document) } };
          }
          return a;
        });
      } else {
        projectIdOne(args[0]);
      }
      // console.log(name, 'pidInterceptor');
      // console.log(JSON.stringify(args, null, 2));
      return replace.apply(this, args as any);
    };
  };

  // Create Interceptor -- Create timestamp / version
  const createOne = function (data: any) {
    // Add timestamp
    data.createdAt = new Date().toISOString();
    // Add version
    data.version = 0;
    return data;
  };
  const createInterceptor: Function = function (obj: any, replace: Function, name: string) {
    obj.prototype[name] = function (...args: any[]) {
      createOne(args[0]);
      // console.log(name, 'insertInterceptor');
      // console.log(JSON.stringify(args[0], null, 2));
      return replace.apply(this, args as any);
    };
  };

  // Update Interceptor -- Update timestamp / version
  const updateOne = function (filter: any, update: any) {
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
    return { filter, update };
  };
  const updateInterceptor: Function = function (obj: any, replace: Function, name: string) {
    obj.prototype[name] = function (...args: any[]) {
      // console.log(name, 'updateInterceptor, before');
      // console.log(JSON.stringify(args, null, 2));
      if (Array.isArray(args[0])) {
        args[0] = args[0].map((a) => {
          if (a.updateOne) {
            return { updateOne: updateOne(a.updateOne.filter, a.updateOne.update) };
          } else if (a.insertOne) {
            return { insertOne: { document: createOne(a.insertOne.document) } };
          }
          return a;
        });
      } else {
        updateOne(args[0], args[1]);
      }
      // console.log(name, 'updateInterceptor');
      // console.log(JSON.stringify(args, null, 2));
      return replace.apply(this, args as any);
    };
  };

  // Intercept
  projectIdTargets.forEach((m: string) =>
    projectIdInterceptor(Collection, (Collection.prototype as any)[m] as Function, m)
  );
  createTargets.forEach((m: string) => createInterceptor(Collection, (Collection.prototype as any)[m] as Function, m));
  updateTargets.forEach((m: string) => updateInterceptor(Collection, (Collection.prototype as any)[m] as Function, m));

  // Register Collections
  server.db.col.classificationCategory = getClassificationCategoryCollection(server.mongo.db!);
  server.db.col.productCategory = getProductCategoryCollection(server.mongo.db!);
  server.db.col.product = await getProductCollection(server.mongo.db!);
  server.db.col.price = await getPriceCollection(server.mongo.db!);
  server.db.col.catalog = getCatalogCollection(server.mongo.db!);
  server.db.col.catalogSync = getCatalogSyncCollection(server.mongo.db!);
  server.db.col.auditLog = getAuditLogCollection(server.mongo.db!);

  // Register Repositories
  server.db.repo.classificationCategoryRepository = new ClassificationCategoryRepository(server);
  server.db.repo.productCategoryRepository = new ProductCategoryRepository(server);
  server.db.repo.productRepository = new ProductRepository(server);
  server.db.repo.priceRepository = new PriceRepository(server);
  server.db.repo.catalogRepository = new CatalogRepository(server);
  server.db.repo.catalogSyncRepository = new CatalogSyncRepository(server);
  server.db.repo.auditLogRepository = new AuditLogRepository(server);

  // Indexes
  const indexes = [];
  indexes.push(server.db.col.classificationCategory.createIndex({ projectId: 1, key: 1 }, { name: 'CC_Key' })); // unique: true
  indexes.push(server.db.col.productCategory.createIndex({ projectId: 1, 'attributes.name': 1 }, { name: 'CCA_Key' }));
  indexes.push(
    server.db.col.auditLog.createIndex({ projectId: 1, catalogId: 1, entity: 1, entityId: 1 }, { name: 'CCA_Key' })
  );
  Object.keys(server.db.col.product).forEach((key) => {
    indexes.push(server.db.col.product[key].createIndex({ parent: 1 }, { name: 'parent' }));
    indexes.push(server.db.col.product[key].createIndex({ sku: 1 }, { name: 'sku' }));
  });
  Object.keys(server.db.col.price).forEach((key) => {
    indexes.push(server.db.col.price[key].createIndex({ sku: 1 }, { name: 'sku' }));
  });
  const r = await Promise.all(indexes);
});
