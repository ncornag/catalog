import fp from 'fastify-plugin';
import { FastifyInstance } from 'fastify';
import { Client } from 'typesense';
import { CollectionCreateSchema } from 'typesense/lib/Typesense/Collections';

declare module 'fastify' {
  export interface FastifyInstance {
    search: { client: Client };
  }
}

export default fp(async function (server: FastifyInstance) {
  const { TYPESENSE_HOST: ts_host, TYPESENSE_PORT: ts_port, TYPESENSE_API_KEY: ts_key } = server.config;

  let client = new Client({
    nodes: [
      {
        host: ts_host!,
        port: Number(ts_port!),
        protocol: 'http'
      }
    ],
    apiKey: ts_key!,
    connectionTimeoutSeconds: 2
  });

  server.decorate('search', {
    client
  });

  // PRODUCT SCHEMA
  let productsSchema: CollectionCreateSchema = {
    name: 'products',
    fields: [
      { name: 'catalog', type: 'string' },
      { name: 'name', type: 'object', optional: true },
      { name: 'description', type: 'object', optional: true },
      { name: 'searchKeywords', type: 'object', optional: true, facet: true },
      { name: 'attributes', type: 'object', optional: true, facet: true }
    ],
    enable_nested_fields: true
  };

  if (process.env.DROP_PRODUCT_INDEX === 'YES')
    await client
      .collections('products')
      .delete()
      .catch(function (error) {});

  await client
    .collections('products')
    .retrieve()
    .then(function (data) {})
    .catch(function (error) {
      server.log.info('Creating search collection [products]', error);
      return client.collections().create(productsSchema);
    });

  server.log.info(`Connected to Typesense at [${ts_host}:${ts_port}]`);
});
