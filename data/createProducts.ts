import { faker } from '@faker-js/faker';
import { MongoClient } from 'mongodb';
import { nanoid } from 'nanoid';

function randomIntFromInterval(min: number, max: number) {
  // min and max included
  return Math.floor(Math.random() * (max - min + 1) + min);
}

function searchKeywords(min: number, max: number): string[] {
  const keywords = [];
  const m = randomIntFromInterval(min, max);
  for (let i = 0; i < m; i++) {
    keywords.push(faker.commerce.productAdjective());
  }
  return keywords;
}

function createRandomProduct(projectId: string, catalog: string): any {
  return {
    _id: nanoid(),
    projectId,
    catalog,
    name: faker.commerce.productName(),
    description: faker.commerce.productDescription(),
    sku: faker.commerce.isbn(13),
    searchKeywords: searchKeywords(1, 3),
    attributes: {
      color: faker.color.human(),
      size: faker.string.numeric({ length: 1 })
    },
    version: 0,
    createdAt: new Date().toISOString()
  };
}
const url = 'mongodb://localhost:27017';
const client = new MongoClient(url);
const dbName = 'example';
const colName = 'ProductStage';
const productsToInsert = parseInt(process.argv[2]) || 1;
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

  let products = [];
  for (let i = 0; i < productsToInsert; i++) {
    const p = createRandomProduct('TestProject', 'stage');
    products.push(p);
    count++;
    if (count % logCount === 0) {
      await collection.insertMany(products);
      products = [];
      let end = new Date().getTime();
      console.log(`Inserted ${count} products in ${end - start} ms`);
    }
  }
  if (products.length > 0) {
    await collection.insertMany(products);
  }
  let end = new Date().getTime();
  console.log(`Inserted ${count} products in ${end - start} ms`);

  console.log('Database seeded! :)');
}

main()
  .then(console.log)
  .catch(console.error)
  .finally(() => client.close());
