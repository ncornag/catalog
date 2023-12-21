import 'dotenv/config';
import { nanoid } from 'nanoid';
import { CT } from '../../src/core/lib/ct';
import { Db, Collection, MongoClient } from 'mongodb';
import { Product, ProductPagedQueryResponse, ProductVariant } from '@commercetools/platform-sdk';

const server = {
  config: process.env
};

class ProductImporter {
  private server: any;
  private ct: CT;
  private mongoClient: MongoClient;
  private db: Db;
  private collection: Collection;
  private colName = 'ProductStage';
  private logCount = 1000;

  constructor(server: any) {
    this.server = server;
    this.ct = new CT(this.server);
    this.mongoClient = new MongoClient(this.server.config.MONGO_URL);
    this.db = this.mongoClient.db();
    this.collection = this.db.collection(this.colName);
  }

  public async writeAndLog(
    count: number,
    logCount: number,
    start: number,
    collection: any,
    products: any[],
    force: boolean = false
  ) {
    if (count % logCount === 0 || force) {
      await collection.insertMany(products);
      products.splice(0, products.length);
      let end = new Date().getTime();
      console.log(`Inserted ${count} products at ${((count * 1000) / (end - start)).toFixed()} items/s`);
    }
  }

  public createProduct(p: Product | ProductVariant, projectId: string, catalog: string, parent?: string): any {
    //console.log(JSON.stringify(p, null, 2));
    let result: any = {
      projectId,
      catalog,
      createdAt: new Date().toISOString()
    };
    if ('masterData' in p) {
      const c = p.masterData.current;
      result._id = p.id;
      result.type = 'base';
      result.key = p.key;
      result.version = p.version;
      result.name = c.name;
      result.description = c.description;
      result.slug = c.slug;
      result.categories = c.categories;
      result.searchKeywords = [];
    } else {
      result._id = nanoid();
      result.type = 'variant';
      result.parent = parent;
      result.sku = p.sku;
      result.key = p.key;
      result.attributes = {};
      result.prices = this.createPrices(p.prices);
      p.attributes?.forEach((a) => {
        result.attributes[a.name] = a.value;
      });
    }
    //console.log(JSON.stringify(result, null, 2));
    return result;
  }
  createPrices(prices: any): any {
    let order = 1;
    return prices
      .sort((a, b) => {
        let ac = 0;
        if (a.country) ac += 1;
        if (a.customerGroup) ac += 1;
        if (a.channel) ac += 1;
        if (a.validFrom) ac += 1;
        let bc = 0;
        if (b.country) bc += 1;
        if (b.customerGroup) bc += 1;
        if (b.channel) bc += 1;
        if (b.validFrom) bc += 1;
        return ac < bc;
      })
      .map((pr: any) => {
        const tiers: any = [{ value: pr.value, n: 0 }].concat(pr.tiers ?? []);
        let n = 1;
        return tiers
          .sort((a, b) => {
            return a.minimumQuantity < b.minimumQuantity;
          })
          .map((t: any) => {
            let r: any = { order: order++, id: `${pr.id}#${t.n ?? n++}` };
            if (pr.key) r.key = `${pr.key}#${t.n ?? n - 1}`;
            let predicate = '';
            if (pr.country) predicate += `${predicate ?? ' AND '}country='${pr.country}'`;
            if (pr.customerGroup) predicate += `${predicate ? ' AND ' : ''}customerGroup='${pr.customerGroup.id}'`;
            if (pr.channel) predicate += `${predicate ? ' AND ' : ''}channel='${pr.channel.id}'`;
            if (pr.validFrom) predicate += `${predicate ? ' AND ' : ''}date>='${pr.validFrom}'`;
            if (pr.validUntil) predicate += `${predicate ? ' AND ' : ''}date<='${pr.validUntil}'`;
            if (t.minimumQuantity) predicate += `${predicate ? ' AND ' : ''}minimumQuantity>=${t.minimumQuantity}`;
            r.predicate = predicate;
            r.value = t.value;
            return r;
          });
      })
      .flat();
  }

  public async importProducts(firstProductToImport: number = 0, productsToImport: number = 1) {
    const products: Product[] = [];
    const pageSize = 500;
    let limit = productsToImport > pageSize ? pageSize : productsToImport;
    let offset = firstProductToImport;
    let body: ProductPagedQueryResponse;
    let productsCount = 0;
    let variantsCount = 0;
    let lastId: any = null;

    try {
      await this.collection.drop();
      console.log(`Collection ${this.colName} dropped!`);
    } catch (e) {
      //console.log(e);
    }

    let start = new Date().getTime();
    let queryArgs: any = {
      limit,
      offset,
      withTotal: false,
      sort: 'id asc',
      //where: 'id = "ee30b714-ebc4-4d00-969b-b6a16e156bf8"'
      where: 'id = "57d89fc3-2034-4c3d-b2e1-5617a32bdb45"'
    };
    do {
      if (lastId != null) {
        queryArgs.where = `id > "${lastId}'`;
        delete queryArgs.offset;
      }
      body = (await this.ct.api.products().get({ queryArgs }).execute()).body;
      console.log(
        `offset: ${body.offset} limit: ${body.limit} count: ${body.count} query: ${JSON.stringify(queryArgs)}`
      );
      for (let p = 0; p < body.results.length; p++) {
        const product = body.results[p];
        //console.log(`Importing product ${product.id} ${product.key} ${product.masterData.current.name}`);
        // Write Base
        const base = this.createProduct(product, 'TestProject', 'stage');
        products.push(base);
        productsCount++;
        await this.writeAndLog(productsCount, this.logCount, start, this.collection, products);
        // Write Variants
        product.masterData.current.variants.push(product.masterData.current.masterVariant);
        for (let v = 0; v < product.masterData.current.variants.length; v++) {
          const variant = product.masterData.current.variants[v];
          products.push(this.createProduct(variant, 'TestProject', 'stage', base._id));
          variantsCount++;
          await this.writeAndLog(productsCount, this.logCount, start, this.collection, products);
        }
      }
      if (body.results.length != 0) lastId = body.results[body.results.length - 1].id;
      limit = productsToImport - productsCount > pageSize ? pageSize : productsToImport - productsCount;
      offset = body.offset + body.count;
    } while (body.count > 0 && productsCount < productsToImport);
    if (products.length > 0) {
      await this.writeAndLog(productsCount, this.logCount, start, this.collection, products, true);
    }
    console.log(`Products imported! ${productsCount} products and ${variantsCount} variants.`);
  }
}

const firstProductToImport = parseInt(process.argv[2]) || 0;
const productsToImport = parseInt(process.argv[3]) || 1;

const productImporter = new ProductImporter(server);

await productImporter.importProducts(firstProductToImport, productsToImport);

console.log('Done!');
process.exit(0);
