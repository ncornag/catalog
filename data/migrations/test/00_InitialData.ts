
import classificationCategories from '../development/classificationCategories.json' with { type: "json" };
import classificationCategoriesShoes from '../development/classificationCategoriesShoes.json' with { type: "json" };
import productCategories from '../development/productCategories.json' with { type: "json" };
import catalogs from '../development/catalogs.json' with { type: "json" };
import catalogSyncs from '../development/catalogSyncs.json' with { type: "json" };
import productCategoriesShoes from '../development/productCategoriesShoes.json' with { type: "json" };
import productShoes from '../development/productShoes.json' with { type: "json" };
import productComposite from '../development/productComposite.json' with { type: "json" };

export async function up(params: any): Promise<void> {
    const db = params.context.server.mongo.db;
    down(params);
    await db.collection('ClassificationCategory').insertMany(classificationCategories);
    await db.collection('ClassificationCategory').insertMany(classificationCategoriesShoes);
    await db.collection('ProductCategory').insertMany(productCategories);
    await db.collection('ProductCategory').insertMany(productCategoriesShoes);
    await db.collection('Catalog').insertMany(catalogs);
    await db.collection('CatalogSync').insertMany(catalogSyncs);
    await db.collection('ProductStage').insertMany(productShoes);
    await db.collection('ProductStage').insertMany(productComposite);
};

export async function down(params: any): Promise<void> {
    const db = params.context.server.mongo.db;
    await db.dropDatabase();
};
