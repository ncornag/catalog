import fp from 'fastify-plugin';
import { FastifyInstance } from 'fastify';
import { Client } from 'typesense';
import { CollectionCreateSchema } from 'typesense/lib/Typesense/Collections';
import { green, yellow } from 'kolorist';

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
      { name: 'sku', type: 'string' },
      { name: 'catalog', type: 'string' },
      { name: 'name', type: 'string' },
      { name: 'description', type: 'string', optional: true },
      { name: 'searchKeywords', type: 'string[]', optional: true, facet: true },
      { name: 'attributes', type: 'object', optional: true, facet: true },
      { name: 'categories', type: 'string[]', optional: true, facet: true },
      { name: 'prices', type: 'object', optional: true, facet: true },
      // Compatibility
      {
        name: 'brand',
        type: 'string',
        facet: true
      },
      {
        name: 'categories.lvl0',
        type: 'string[]',
        facet: true
      },
      {
        name: 'categories.lvl1',
        type: 'string[]',
        facet: true,
        optional: true
      },
      {
        name: 'categories.lvl2',
        type: 'string[]',
        facet: true,
        optional: true
      },
      {
        name: 'categories.lvl3',
        type: 'string[]',
        facet: true,
        optional: true
      },
      {
        name: 'price',
        type: 'float',
        facet: true,
        optional: true
      },
      {
        name: 'popularity',
        type: 'int32',
        facet: false
      },
      {
        name: 'free_shipping',
        type: 'bool',
        facet: true
      },
      {
        name: 'rating',
        type: 'int32',
        facet: true
      },
      {
        name: 'vectors',
        type: 'float[]',
        num_dim: 384,
        optional: true
      }
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

  server.log.info(`${yellow('Tysesense')} ${green('starting in')} [${ts_host}:${ts_port}]`);
});
