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
  private productCollection: Collection;
  private productCollectionName = 'ProductStage';
  private priceCollection: Collection;
  private priceCollectionName = 'PricesStage';
  private logCount = 1000;
  private fieldPredicateOperators = {
    country: { operator: 'in', field: 'country', type: 'array' },
    customerGroup: { operator: 'in', field: 'customerGroup', type: 'array', typeId: 'customer-group' },
    channel: { operator: 'in', field: 'channel', type: 'array', typeId: 'channel' },
    validFrom: { operator: '>=', field: 'date', type: 'date' },
    validUntil: { operator: '<=', field: 'date', type: 'date' },
    minimumQuantity: { operator: '>=', field: 'quantity', type: 'number' }
  };

  constructor(server: any) {
    this.server = server;
    this.ct = new CT(this.server);
    this.mongoClient = new MongoClient(this.server.config.MONGO_URL);
    this.db = this.mongoClient.db();
    this.productCollection = this.db.collection(this.productCollectionName);
    this.priceCollection = this.db.collection(this.priceCollectionName);
  }

  private async writeAndLog(params: any) {
    if (params.count % this.logCount === 0 || params.force === true) {
      await this.productCollection.insertMany(params.products);
      await this.priceCollection.insertMany(params.prices);
      params.products.splice(0, params.products.length);
      params.prices.splice(0, params.prices.length);
      let end = new Date().getTime();
      console.log(
        `Inserted ${params.productsCount} products at ${(
          (params.productsCount * 1000) /
          (end - params.start)
        ).toFixed()} items/s`
      );
    }
  }

  private createProduct(p: Product | ProductVariant, projectId: string, catalog: string, parent?: string): any {
    let result: any = {
      projectId,
      catalog,
      createdAt: new Date().toISOString()
    };
    let key = p.key;
    if ('masterData' in p) {
      const c = p.masterData.current;
      let description = c.description;
      return Object.assign(
        result,
        {
          _id: p.id,
          type: 'base',
          version: p.version,
          name: c.name,
          slug: c.slug,
          categories: c.categories,
          searchKeywords: []
        },
        description && { description },
        key && { key }
      );
    } else {
      return Object.assign(
        result,
        {
          _id: nanoid(),
          type: 'variant',
          parent: parent,
          sku: p.sku,
          attributes: p.attributes?.reduce((acc: any, a: any) => {
            acc[a.name] = a.value;
            return acc;
          }, {})
        },
        key && { key }
      );
    }
  }

  private createPrices(variant: ProductVariant, projectId: string, catalog: string): any {
    return variant.prices?.map((price: any) => {
      let order = 1;
      const tiers: any = [{ value: price.value }].concat(price.tiers ?? []);
      let key = price.key;
      return Object.assign(
        {},
        {
          _id: price.id,
          projectId,
          catalog,
          createdAt: new Date().toISOString(),
          sku: variant.sku,
          prices: tiers
            .sort((a: any, b: any) => {
              return a.minimumQuantity < b.minimumQuantity;
            })
            .map((tier: any) => {
              let constraints = this.createConstraints(this.fieldPredicateOperators, tier, price);
              return {
                order: order++,
                value: tier.value,
                constraints,
                predicate: this.createPredicate(constraints)
              };
            })
        },
        key && { key }
      );
    });
  }

  private surroundByQuotes(value: any) {
    return typeof value === 'string' ? `'${value}'` : value;
  }
  private createConstraints(data: any, tier: any, price: any) {
    return Object.entries(data).reduce((acc: any, [key, value]: [string, any]) => {
      let dataValue = price[key] || tier[key];
      if (!dataValue) return acc;
      if (value.type === 'array' && value.typeId) {
        acc[key] = [dataValue.id];
      } else if (value.type === 'array') {
        acc[key] = [dataValue];
      } else if (value.type === 'number') {
        acc[key] = +dataValue;
      } else {
        acc[key] = dataValue;
      }
      return acc;
    }, {});
  }
  private createPredicate(data: any) {
    let predicate = Object.entries(data).reduce((acc, [key, value]) => {
      if (acc) acc += ' and ';
      let op = this.fieldPredicateOperators[key] ? this.fieldPredicateOperators[key].operator : '=';
      let field = this.fieldPredicateOperators[key] ? this.fieldPredicateOperators[key].field : key;
      let val: any = value;
      if (op === 'in') {
        if (!Array.isArray(val)) val = [val];
        if (val.length > 1) acc += '(';
        for (let i = 0; i < val.length; i++) {
          if (i > 0) acc += ' or ';
          acc += `${this.surroundByQuotes(val[i])} in ${field}`;
        }
        if (val.length > 1) acc += ')';
      } else {
        acc += `${field}${op}${this.surroundByQuotes(val)}`;
      }
      return acc;
    }, '');
    return predicate;
  }

  public async importProducts(firstProductToImport: number = 0, productsToImport: number = 1) {
    const products: any[] = [];
    const prices: any[] = [];
    const pageSize = 500;
    let limit = productsToImport > pageSize ? pageSize : productsToImport;
    let offset = firstProductToImport;
    let body: ProductPagedQueryResponse;
    let productsCount = 0;
    let variantsCount = 0;
    let pricesCount = 0;
    let lastId: any = null;

    try {
      await this.productCollection.drop();
      await this.priceCollection.drop();
      console.log(`Collections ${this.productCollectionName} and ${this.priceCollectionName} dropped!`);
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
        // Import Base
        const base = this.createProduct(product, 'TestProject', 'stage');
        products.push(base);
        productsCount++;
        await this.writeAndLog({ productsCount, start, products, prices });
        // Import Variants
        product.masterData.current.variants.push(product.masterData.current.masterVariant);
        for (let v = 0; v < product.masterData.current.variants.length; v++) {
          const variant = product.masterData.current.variants[v];
          products.push(this.createProduct(variant, 'TestProject', 'stage', base._id));
          variantsCount++;
          if (product.priceMode === 'Embedded') {
            prices.push(...this.createPrices(variant, 'TestProject', 'stage'));
            pricesCount += variant.prices?.length ?? 0;
          }
          await this.writeAndLog({ productsCount, start, products, prices });
        }
      }
      if (body.results.length != 0) lastId = body.results[body.results.length - 1].id;
      limit = productsToImport - productsCount > pageSize ? pageSize : productsToImport - productsCount;
      offset = body.offset + body.count;
    } while (body.count > 0 && productsCount < productsToImport);
    if (products.length > 0) {
      await this.writeAndLog({ productsCount, start, products, prices, force: true });
    }
    console.log(`Products imported! ${productsCount} products, ${variantsCount} variants and ${pricesCount} prices.`);
  }
}

const firstProductToImport = parseInt(process.argv[2]) || 0;
const productsToImport = parseInt(process.argv[3]) || 1;

const productImporter = new ProductImporter(server);

await productImporter.importProducts(firstProductToImport, productsToImport);

console.log('Done!');
process.exit(0);
