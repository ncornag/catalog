import { MongoMemoryServer } from 'mongodb-memory-server';
import { createServer } from '#infrastructure/http/server/index';
import { describe, it, before, after } from "node:test";
import assert from "node:assert";
import { default as request } from 'supertest';
import { MongoDBStorage, Umzug } from 'umzug';
import { Value } from '@sinclair/typebox/value';
import productShoes from '../data/migrations/development/productShoes.json' with { type: "json" };
import { toEntity as toProductEntity } from '#core/services/product.svc'
import { type ProductDAO } from '#infrastructure/repositories/dao/product.dao.schema';
import { type Product } from '#core/entities/product';

let app: any;
let server: any;
let catalogParam = 'stage'

describe("Product", () => {
  before(async () => {
    // Memory Mongo up
    const memoryMongo = await MongoMemoryServer.create();
    const uri = memoryMongo.getUri();
    process.env.MONGO_URL = `${uri}test`;
    (global as any).__MONGOINSTANCE = memoryMongo;
    // App up (& Migrations up)
    server = await createServer();
    await server.ready();
    app = server.server;
  });

  after(async () => {
    // Migrations down
    const migrator = new Umzug({
      migrations: { glob: `data/migrations/${server.config.NODE_ENV}/*.ts` },
      storage: new MongoDBStorage({
        collection: server.mongo.db!.collection('migrations')
      }),
      logger: server.logger,
      context: {
        server,
      },
    });
    await migrator.down();
    // App down
    await server.close();
    // Memory Mongo down
    const memoryMongo: MongoMemoryServer = (global as any).__MONGOINSTANCE;
    await memoryMongo.stop();
  });

  it("findOneProduct", async () => {
    const pId = 'adizeroPrimeX2-base';
    const expected: Product = toProductEntity(productShoes.find((p) => p._id == pId) as unknown as ProductDAO);
    const response = await request(app)
      .get(`/products/${pId}?catalog=${catalogParam}`)
      .expect(200)
      .expect('Content-Type', 'application/json; charset=utf-8');
    assert.strictEqual(response.body.id, pId);
    assert.deepEqual(response.body, expected, `Differences: ${Value.Diff(response.body, expected)}`);
  });

  it("createProduct [BASE]", async () => {
    const requestData = {
      "name": { "en": "English Base text" },
      "description": { "en": "English Description ..." },
      "slug": { "en": "slug1" },
      "searchKeywords": { "en": [{ "text": "keyword1" }] },
      "categories": ["shoes"],
      "type": "base"
    }
    const response = await request(app)
      .post(`/products?catalog=${catalogParam}`)
      .send(requestData)
      .set('Accept', 'application/json')
      .expect(201)
      .expect('Content-Type', 'application/json; charset=utf-8');

    const expected = Object.assign({ attributes: {}, categories: [], version: 0, id: response.body.id, createdAt: response.body.createdAt }, requestData);
    assert.deepEqual(response.body, expected, `Differences: ${JSON.stringify(Value.Diff(response.body, expected), null, 2)}`);
  });

  it("createProduct [VARIANT]", async () => {
    const parentId = 'adizeroPrimeX2-base';
    const parentResponse = await request(app)
      .get(`/products/${parentId}?catalog=${catalogParam}`)
      .expect(200)
    const requestData = {
      "name": { "en": "English Variant text" },
      "sku": "HP9708_570",
      "searchKeywords": { "en": [{ "text": "keyword2" }] },
      "parent": parentResponse.body.id,
      "attributes": {
        "color": "Cloud White",
        "size": "M 6/W 7"
      },
      "type": "variant"
    }
    const response = await request(app)
      .post(`/products?catalog=${catalogParam}`)
      .send(requestData)
      .set('Accept', 'application/json')
      .expect(201)
      .expect('Content-Type', 'application/json; charset=utf-8');

    const expected = Object.assign({ attributes: {}, categories: [], version: 0, id: response.body.id, createdAt: response.body.createdAt }, requestData);
    assert.deepEqual(response.body, expected, `Differences: ${JSON.stringify(Value.Diff(response.body, expected), null, 2)}`);
  });

  it("updateProduct [changeName]", async () => {
    const pId = 'adizeroPrimeX2-base';
    const newName = "TestName"
    const before = await request(app)
      .get(`/products/${pId}?catalog=${catalogParam}`)
      .expect(200);
    const requestData = {
      "version": before.body.version,
      "actions": [
        { "action": "changeName", "name": { "en": newName } }
      ]
    }
    const expected = Object.assign(before.body, { "name": { "en": newName }, "version": before.body.version + 1 });
    const response = await request(app)
      .patch(`/products/${pId}?catalog=${catalogParam}`)
      .send(requestData)
      .set('Accept', 'application/json')
      .expect(200)
      .expect('Content-Type', 'application/json; charset=utf-8');

    assert.deepEqual(response.body, expected, `Differences: ${JSON.stringify(Value.Diff(response.body, expected), null, 2)}`);
  });

});