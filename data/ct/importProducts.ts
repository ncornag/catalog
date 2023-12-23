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
  private productCollectionName = 'Product';
  private pricesCollectionName = 'Prices';
  private col: any = {};
  private logCount = 1000;
  private fieldPredicateOperators = {
    country: { operator: 'in', field: 'country', type: 'array' },
    customerGroup: { operator: 'in', field: 'customerGroup', type: 'array', typeId: 'customer-group' },
    channel: { operator: 'in', field: 'channel', type: 'array', typeId: 'channel' },
    validFrom: { operator: '>=', field: 'date', type: 'date' },
    validUntil: { operator: '<=', field: 'date', type: 'date' },
    minimumQuantity: { operator: '>=', field: 'quantity', type: 'number' }
  };

  constructor(server: any, stageSufix: string, currentSufix: string) {
    this.server = server;
    this.ct = new CT(this.server);
    this.mongoClient = new MongoClient(this.server.config.MONGO_URL);
    this.db = this.mongoClient.db();
    this.col.products = {
      staged: this.db.collection(`${this.productCollectionName}${stageSufix}`),
      current: this.db.collection(`${this.productCollectionName}${currentSufix}`)
    };
    this.col.prices = {
      staged: this.db.collection(`${this.pricesCollectionName}${stageSufix}`),
      current: this.db.collection(`${this.pricesCollectionName}${currentSufix}`)
    };
  }

  private async writeAndLog(params: any) {
    if (params.count % this.logCount === 0 || params.force === true) {
      await this.col.products.staged.insertMany(params.stagedProducts);
      await this.col.prices.staged.insertMany(params.stagedPrices);
      await this.col.products.current.insertMany(params.currentProducts);
      await this.col.prices.current.insertMany(params.currentPrices);
      params.stagedProducts.splice(0, params.stagedProducts.length);
      params.stagedPrices.splice(0, params.stagedPrices.length);
      params.currentProducts.splice(0, params.currentProducts.length);
      params.currentPrices.splice(0, params.currentPrices.length);
      let end = new Date().getTime();
      console.log(
        `Inserted ${params.productsCount} products at ${(
          (params.productsCount * 1000) /
          (end - params.start)
        ).toFixed()} items/s`
      );
    }
  }

  private createProduct(p: Product, projectId: string, catalog: string): any {
    const c = p.masterData[catalog];
    return Object.assign(
      {},
      {
        _id: p.id,
        version: p.version,
        projectId,
        catalog: catalog === 'staged' ? 'stage' : 'online',
        type: 'base',
        createdAt: p.createdAt,
        name: c.name,
        slug: c.slug,
        categories: c.categories.map((c) => {
          return c.id;
        }),
        searchKeywords: c.searchKeywords,
        priceMode: p.priceMode,
        taxCategory: p.taxCategory?.id
      },
      c.description && { description: c.description },
      p.key && { key: p.key },
      p.lastModifiedAt && { lastModifiedAt: p.lastModifiedAt }
    );
  }

  private createVariant(v: ProductVariant, p: Product, projectId: string, catalog: string, parent: string): any {
    return Object.assign(
      {},
      {
        _id: p.id + '#' + v.id,
        version: p.version,
        projectId,
        catalog: catalog === 'staged' ? 'stage' : 'online',
        createdAt: p.createdAt,
        type: 'variant',
        parent: parent,
        sku: v.sku,
        attributes: v.attributes?.reduce((acc: any, a: any) => {
          acc[a.name] = a.value;
          return acc;
        }, {}),
        priceMode: p.priceMode
      },
      v.key && { key: v.key },
      p.lastModifiedAt && { lastModifiedAt: p.lastModifiedAt }
    );
  }

  private createPrices(v: ProductVariant, p: Product, projectId: string, catalog: string): any {
    return v.prices?.map((price: any) => {
      let order = 1;
      const tiers: any = [{ value: price.value }].concat(price.tiers ?? []);
      return Object.assign(
        {},
        {
          _id: price.id,
          version: p.version,
          projectId,
          catalog: catalog === 'staged' ? 'stage' : 'online',
          createdAt: p.createdAt,
          sku: v.sku,
          active: true,
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
        price.key && { key: price.key },
        p.lastModifiedAt && { lastModifiedAt: p.lastModifiedAt }
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
    const stagedProducts: any[] = [];
    const stagedPrices: any[] = [];
    const currentProducts: any[] = [];
    const currentPrices: any[] = [];
    const pageSize = 500;
    let limit = productsToImport > pageSize ? pageSize : productsToImport;
    let offset = firstProductToImport;
    let body: ProductPagedQueryResponse;
    let productsCount = 0;
    let lastId: any = null;

    try {
      await this.col.products.staged.drop();
      await this.col.prices.staged.drop();
      await this.col.products.current.drop();
      await this.col.prices.current.drop();
    } catch (e) {
      //console.log(e);
    }

    let start = new Date().getTime();
    let queryArgs: any = {
      limit,
      offset,
      withTotal: false,
      sort: 'id asc',
      where: 'id = "57d89fc3-2034-4c3d-b2e1-5617a32bdb45" or id = "6a3736e4-eaba-416c-87f0-77612f9bb265"'
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
        await this.importCatalogProduct('staged', 'TestProject', body.results[p], stagedProducts, stagedPrices);
        await this.importCatalogProduct('current', 'TestProject', body.results[p], currentProducts, currentPrices);
        productsCount++;
        await this.writeAndLog({
          productsCount,
          start,
          stagedProducts,
          stagedPrices,
          currentProducts,
          currentPrices
        });
      }
      if (body.results.length != 0) lastId = body.results[body.results.length - 1].id;
      limit = productsToImport - productsCount > pageSize ? pageSize : productsToImport - productsCount;
      offset = body.offset + body.count;
    } while (body.count > 0 && productsCount < productsToImport);
    if (stagedProducts.length > 0) {
      await this.writeAndLog({
        productsCount,
        start,
        stagedProducts,
        stagedPrices,
        currentProducts,
        currentPrices,
        force: true
      });
    }
    console.log(`Products imported! ${productsCount} products`);
  }

  private async importCatalogProduct(catalog, project, product, products, prices) {
    // Import Base
    const base = this.createProduct(product, project, catalog);
    products.push(base);
    // Import Variants
    product.masterData[catalog].variants.push(product.masterData[catalog].masterVariant);
    for (let v = 0; v < product.masterData[catalog].variants.length; v++) {
      const variant = product.masterData[catalog].variants[v];
      products.push(this.createVariant(variant, product, project, catalog, base._id));
      // Import Prices
      if (product.priceMode === 'Embedded') {
        prices.push(...this.createPrices(variant, product, project, catalog));
      }
    }
  }
}

const firstProductToImport = parseInt(process.argv[2]) || 0;
const productsToImport = parseInt(process.argv[3]) || 1;
const stageSufix = process.argv[4] || 'Stage';
const currentSufix = process.argv[5] || 'Online';

const productImporter = new ProductImporter(server, stageSufix, currentSufix);

await productImporter.importProducts(firstProductToImport, productsToImport);

console.log('Done!');
process.exit(0);
