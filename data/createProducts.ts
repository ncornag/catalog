import { fakerEN, fakerDE } from '@faker-js/faker';
import { MongoClient } from 'mongodb';
import { nanoid } from 'nanoid';

function randomIntFromInterval(min: number, max: number) {
  // min and max included
  return Math.floor(Math.random() * (max - min + 1) + min);
}

function searchKeywords(min: number, max: number): string[] {
  const keywords: string[] = [];
  const m = randomIntFromInterval(min, max);
  for (let i = 0; i < m; i++) {
    keywords.push(fakerEN.commerce.productAdjective());
  }
  return keywords;
}

function createRandomProduct(projectId: string, catalog: string, type: string, parent?: string): any {
  if (type === 'variant' && !parent) throw new Error('Variant must have a parent');
  if (type === 'base' && parent) throw new Error('Base cannot have a parent');
  let result: any = {
    _id: nanoid(),
    type,
    projectId,
    catalog,
    version: 0,
    createdAt: new Date().toISOString()
  };
  if (type === 'base') {
    result.name = { en: fakerEN.commerce.productName(), de: fakerDE.commerce.productName() };
    result.description = {
      en: fakerEN.lorem.paragraphs({ min: 1, max: 3 }),
      de: fakerDE.lorem.paragraphs({ min: 1, max: 3 })
    };
    result.searchKeywords = searchKeywords(1, 3);
  } else if (type === 'variant') {
    result.parent = parent;
    result.sku = fakerEN.commerce.isbn(13);
    result.attributes = {
      color: fakerEN.color.human(),
      size: fakerEN.string.numeric({ length: 1 })
    };
  }
  return result;
}

async function writeAndLog(
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

const url = 'mongodb://localhost:27017';
const client = new MongoClient(url);
const dbName = 'ct2';
const colName = 'ProductStage';
const productsToInsert = parseInt(process.argv[2]) || 1;
const variantsPerProduct = parseInt(process.argv[3]) || 1;
const logCount = 10000;

async function main() {
  await client.connect();
  console.log('Connected successfully to server');

  const db = client.db(dbName);
  const collection = db.collection(colName);
  try {
    await collection.drop();
  } catch {}

  let count = 0;
  let start = new Date().getTime();

  let products: any[] = [];
  for (let i = 0; i < productsToInsert; i++) {
    const p = createRandomProduct('TestProject', 'stage', 'base');
    products.push(p);
    count++;
    await writeAndLog(count, logCount, start, collection, products);
    for (let j = 0; j < variantsPerProduct; j++) {
      const v = createRandomProduct('TestProject', 'stage', 'variant', p._id);
      products.push(v);
      count++;
      await writeAndLog(count, logCount, start, collection, products);
    }
  }
  if (products.length > 0) {
    await writeAndLog(count, logCount, start, collection, products, true);
  }
  console.log('Database seeded! :)');
}

await main()
  .then(console.log)
  .catch(console.error)
  .finally(() => client.close());
