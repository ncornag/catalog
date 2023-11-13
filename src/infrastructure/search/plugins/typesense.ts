import fp from 'fastify-plugin';
import { FastifyInstance } from 'fastify';
import { Client } from 'typesense';

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
  let productsSchema = {
    name: 'products',
    fields: [
      { name: 'name', type: 'object' },
      { name: 'description', type: 'string', optional: true },
      { name: 'searchKeywords', type: 'string[]', facet: true },
      { name: 'attributes', type: 'object' }
    ],
    enable_nested_fields: true
  };

  await client.collections('products').delete();
  await client
    .collections('products')
    .retrieve()
    .then(function (data) {})
    .catch(function (error) {
      client.collections().create(productsSchema);
    });

  server.log.info(`Connected to Typesense at [${ts_host}:${ts_port}]`);
});
