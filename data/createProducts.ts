import 'dotenv/config';
import { fakerEN, fakerDE } from '@faker-js/faker';
import { Db, MongoClient } from 'mongodb';
import { CT } from '../src/core/lib/ct';
import { createPredicateExpression } from '../src/core/services/price.svc';
import { nanoid } from 'nanoid';

function randomIntFromInterval(min: number, max: number) {
  // min and max included
  return Math.floor(Math.random() * (max - min + 1) + min);
}

const server = {
  config: process.env
};

enum VersionSuffix {
  STAGE = 'Stage',
  ONLINE = 'Online'
}

class ProductCreator {
  private server: any;
  private ct: CT;
  private mongoClient: MongoClient;
  private db: Db;
  private productCollectionName = 'Product';
  private pricesCollectionName = 'Prices';
  private col: any = {};
  private logCount = 1000;
  private projectId = 'TestProject';
  private Catalog = {
    STAGE: 'stage',
    ONLINE: 'online'
  };
  private categories = Array.from({ length: 100 }, (_, i) => `category-${i}`);
  private countries = ['DE', 'ES', 'US', 'FR', 'IT', 'NL', 'PL', 'PT', 'RU', 'JP'];
  private channels = Array.from({ length: 20 }, (_, i) => `channel-${i}`);
  private customerGroups = Array.from({ length: 20 }, (_, i) => `cg-${i}`);
  private constraintsValues = {
    country: this.countries,
    channel: this.channels,
    customerGroup: this.customerGroups
  };
  private constraintsOrder = [[], ['country'], ['channel'], ['customerGroup']];

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
    if (params.productsCount % this.logCount === 0 || params.force === true) {
      await this.col.products.staged.insertMany(params.stagedProducts);
      await this.col.prices.staged.insertMany(params.stagedPrices);
      params.stagedProducts.splice(0, params.stagedProducts.length);
      params.stagedPrices.splice(0, params.stagedPrices.length);
      let end = new Date().getTime();
      console.log(
        `Inserted ${params.productsCount} products at ${(
          (params.productsCount * 1000) /
          (end - params.start)
        ).toFixed()} items/s`
      );
    }
  }

  public searchKeywords(min: number, max: number): any {
    const keywordsEN: string[] = [];
    const keywordsDE: string[] = [];
    const m = randomIntFromInterval(min, max);
    for (let i = 0; i < m; i++) {
      keywordsEN.push(fakerEN.commerce.productAdjective());
      keywordsDE.push(fakerDE.commerce.productAdjective());
    }
    return { en: keywordsEN, de: keywordsDE };
  }

  public createProduct(projectId: string, catalog: string): any {
    return {
      _id: nanoid(),
      version: 0,
      projectId,
      catalog,
      type: 'base',
      createdAt: new Date().toISOString(),
      name: { en: fakerEN.commerce.productName(), de: fakerDE.commerce.productName() },
      description: {
        en: fakerEN.lorem.paragraphs({ min: 1, max: 3 }),
        de: fakerDE.lorem.paragraphs({ min: 1, max: 3 })
      },
      searchKeywords: this.searchKeywords(1, 3),
      slug: {
        en: fakerEN.lorem.slug(),
        de: fakerDE.lorem.slug()
      },
      categories: [this.categories[randomIntFromInterval(0, this.categories.length - 1)]],
      priceMode: this.ct.PriceMode.EMBEDDED
    };
  }

  public createVariant(projectId: string, catalog: string, parent: string, pricesPerVariant: number): any {
    let sku = fakerEN.commerce.isbn(13);
    let prices = Array.from({ length: pricesPerVariant }, (_, i) => this.createPrice(projectId, catalog, sku));
    return [
      {
        _id: nanoid(),
        version: 0,
        projectId,
        catalog,
        type: 'variant',
        createdAt: new Date().toISOString(),
        parent: parent,
        sku,
        attributes: {
          color: fakerEN.color.human(),
          size: fakerEN.string.numeric({ length: 1 })
        }
      },
      prices
    ];
  }

  public createPrice(projectId: string, catalog: string, sku: string): any {
    const centAmount = randomIntFromInterval(1000, 10000);
    let constraintsAcc = {};
    return {
      _id: nanoid(),
      version: 0,
      projectId,
      catalog,
      createdAt: new Date().toISOString(),
      sku,
      active: true,
      predicates: Array.from({ length: 4 }, (_, i) => {
        let constraints = this.constraintsOrder[i].reduce((acc: any, curr: any) => {
          acc[curr] = [this.constraintsValues[curr][randomIntFromInterval(0, this.constraintsValues[curr].length - 1)]];
          constraintsAcc[curr] = acc[curr];
          return acc;
        }, Object.assign({}, constraintsAcc));
        let expression = createPredicateExpression(constraints);
        return Object.assign(
          {
            order: 4 - i,
            value: {
              type: 'centPrecision',
              currencyCode: 'EUR',
              centAmount: centAmount - i * 10,
              fractionDigits: 2
            },
            constraints
          },
          expression && { expression }
        );
      }).sort((a, b) => a.order - b.order)
    };
  }

  public async createProducts(productsToInsert: number = 1, variantsPerProduct: number = 1, pricesPerVariant = 1) {
    let productsCount = 0;
    let variantsCount = 0;
    let pricesCount = 0;
    let stagedProducts: any[] = [];
    let stagedPrices: any[] = [];

    try {
      await this.col.products.staged.drop();
    } catch (e) {}
    try {
      await this.col.prices.staged.drop();
    } catch (e) {}
    console.log('Staged collections dropped successfully');

    let start = new Date().getTime();
    for (let i = 0; i < productsToInsert; i++) {
      const base = this.createProduct(this.projectId, this.Catalog.STAGE);
      stagedProducts.push(base);
      productsCount++;
      for (let j = 0; j < variantsPerProduct; j++) {
        const [variant, prices] = this.createVariant(this.projectId, base.catalog, base._id, pricesPerVariant);
        stagedProducts.push(variant);
        pricesCount += prices.length;
        variantsCount++;
        stagedPrices.push(...prices);
      }
      await this.writeAndLog({ productsCount, start, stagedProducts, stagedPrices });
    }
    if (stagedProducts.length > 0) {
      await this.writeAndLog({ productsCount, start, stagedProducts, stagedPrices, force: true });
    }
    console.log(`Database seeded with ${productsCount} products + ${variantsCount} variants and ${pricesCount} prices`);
  }
}

const productsToInsert = parseInt(process.argv[2]) || 1;
const variantsPerProduct = parseInt(process.argv[3]) || 1;
const pricesPerVariant = parseInt(process.argv[4]) || 1;
const stageSufix = process.argv[5] || VersionSuffix.STAGE;
const currentSufix = process.argv[6] || VersionSuffix.ONLINE;

const productImporter = new ProductCreator(server, stageSufix, currentSufix);

await productImporter.createProducts(productsToInsert, variantsPerProduct, pricesPerVariant);

console.log('Done!');
process.exit(0);
