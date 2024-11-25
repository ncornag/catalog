
import classificationCategories from './classificationCategories.json' with { type: "json" };
import classificationCategoriesShoes from './classificationCategoriesShoes.json' with { type: "json" };
import productCategories from './productCategories.json' with { type: "json" };
import catalogs from './catalogs.json' with { type: "json" };
import catalogSyncs from './catalogSyncs.json' with { type: "json" };
import productCategoriesShoes from './productCategoriesShoes.json' with { type: "json" };
import productShoes from './productShoes.json' with { type: "json" };
import productComposite from './productComposite.json' with { type: "json" };

/*
Classification Categories

    machine-properties
    hardware
        cpu
        photography
    electricity
        machines
            (machine-properties)
    software

    Product Categories

    mana
        (machines)
        printers
        laptops
            (cpu)
*/

export async function up(params: any): Promise<void> {
    const db = params.context.server.mongo.db;
    await db.collection('ClassificationCategory').insertMany(classificationCategories);
    await db.collection('ClassificationCategory').insertMany(classificationCategoriesShoes);
    await db.collection('ProductCategory').insertMany(productCategories);
    await db.collection('ProductCategory').insertMany(productCategoriesShoes);
    await db.collection('Catalog').insertMany(catalogs);
    await db.collection('CatalogSync').insertMany(catalogSyncs);
    await db.collection('ProductStage').insertMany(productShoes);
    await db.collection('ProductStage').insertMany(productComposite);
};

export async function down(context: any): Promise<void> {

};
