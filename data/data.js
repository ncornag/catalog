// Classification Categories
// 
// machine-properties
// hardware
//   cpu
//   photography
// electricity
//   machines
//     (machine-properties)
//   software
//
// Product Categories
// 
// mana
//     (machines)
//   printers
//   laptops
//     (cpu)

use example;

db.Catalog.deleteMany({});
db.CatalogSync.deleteMany({});
db.ClassificationCategory.deleteMany({});
db.ProductCategory.deleteMany({});
db.ProductStage.deleteMany({});
db.ProductOnline.deleteMany({});

// Classification Tree A
db.ClassificationCategory.insertMany([
  {
    _id: "machine-properties",
    projectId: 'TestProject',
    name: "Machine Properties",
    key: "machine-properties",
    parent: "",
    attributes: [
      { key: "wheels", label: "Wheels", isRequired: true, type: "number", min: 1, max: 18 },
      {
        key: "color",
        label: "Color",
        isRequired: true,
        type: "enum",
        options: [
          { key: "Y", label: "Yellow" },
          { key: "O", label: "Orange" },
          { key: "G", label: "Green" }
        ]
      },
      { key: "options", label: "Options", isRequired: false, type: "list", elementType: "text" }
    ],
    ancestors: [],
    version: 0,
    createdAt: "2023-01-15T00:00:00.000+00:00"
  },
  {
    _id: "hardware",
    projectId: 'TestProject',
    name: "Hardware",
    key: "hardware",
    parent: "",
    attributes: [],
    ancestors: [],
    version: 0,
    createdAt: "2023-01-15T00:00:00.000+00:00"
  },
  {
    _id: "cpu",
    projectId: 'TestProject',
    name: "CPU",
    key: "cpu",
    parent: "hardware",
    attributes: [
      { key: "speed", label: "clockSpeed", isRequired: false, type: "number" },
      { key: "cache", label: "Cache", isRequired: true, type: "text" }
    ],
    ancestors: ["hardware"],
    version: 0,
    createdAt: "2023-01-15T00:00:00.000+00:00"
  },
  {
    _id: "photography",
    projectId: 'TestProject',
    name: "Photography",
    key: "photography",
    attributes: [
      { key: "sensor", label: "Sensor", isRequired: true, type: "text" },
      { key: "res", label: "Resolutions", isRequired: true, type: "text" }
    ],
    parent: "hardware",
    ancestors: ["hardware"],
    version: 0,
    createdAt: "2023-01-15T00:00:00.000+00:00"
  }
]);

// Classification Tree B
db.ClassificationCategory.insertMany([
  {
    _id: "electricity",
    projectId: 'TestProject',
    name: "Electricity Things",
    key: "electricity",
    parent: "",
    attributes: [{ key: "curr", label: "current", isRequired: true, type: "number" }],
    ancestors: [],
    version: 0,
    createdAt: "2023-01-15T00:00:00.000+00:00"
  },
  {
    _id: "machines",
    projectId: 'TestProject',
    name: "Machines",
    key: "machines",
    parent: "electricity",
    attributes: [
      { key: "size", label: "size", isRequired: true, type: "text" },
      { key: "weight", label: "weight", isRequired: true, type: "number" },
      {
        key: "characteristics",
        label: "Characteristics",
        isRequired: true,
        type: "object",
        ref: "machine-properties"
      }
    ],
    ancestors: ["electricity"],
    version: 0,
    createdAt: "2023-01-15T00:00:00.000+00:00"
  },
  {
    _id: "software",
    projectId: 'TestProject',
    name: "Software",
    key: "software",
    parent: "electricity",
    attributes: [
      { key: "req", label: "requirements", isRequired: true, type: "text" },
      { key: "lan", label: "language", isRequired: true, type: "text" }
    ],
    ancestors: ["electricity"],
    version: 0,
    createdAt: "2023-01-15T00:00:00.000+00:00"
  }
]);

// Product Category Tree A
db.ProductCategory.insertMany([
  {
    _id: "mana",
    projectId: 'TestProject',
    name: "Manufacturer A",
    key: "manA",
    parent: "",
    classificationCategories: ["machines"],
    ancestors: [],
    version: 0,
    createdAt: "2023-01-15T00:00:00.000+00:00"
  },
  {
    _id: "printers",
    projectId: 'TestProject',
    name: "Printers",
    key: "printers",
    parent: "mana",
    classificationCategories: [],
    ancestors: ["mana"],
    version: 0,
    createdAt: "2023-01-15T00:00:00.000+00:00"
  },
  {
    _id: "laptops",
    projectId: 'TestProject',
    name: "Laptops",
    key: "laptops",
    parent: "mana",
    classificationCategories: ["cpu"],
    ancestors: ["mana"],
    version: 0,
    createdAt: "2023-01-15T00:00:00.000+00:00"
  }
]);

////////////////////////////////////////////////////////////////////////////////////////////////////////

// Catalog
db.Catalog.insertMany([
  {
    _id: "stage",
    projectId: 'TestProject',
    name: "Stage"
  },
  {
    _id: "online",
    projectId: 'TestProject',
    name: "Online"
  }
])

// Catalog Sync
db.CatalogSync.insertMany([
  {
    _id: "stage-2-online",
    projectId: 'TestProject',
    sourceCatalog: "stage",
    targetCatalog: "online",
    removeNonExistent: false,  // Remove elements from Target if they no longer exist in Source
    createNewItems: true,      // Create new elements in Target if they do not exist
    propertiesToSync: [],      // Sync all properties
    runAt: "00 01 * * *",      // Run at a specific time, cron format
    lastSync: "2023-01-15T00:00:00.000+00:00",
    version: 0,
    createdAt: "2023-01-15T00:00:00.000+00:00"
  }
])

// Classification Tree Adidas
db.ClassificationCategory.insertMany([
  {
    _id: "shoes",
    projectId: 'TestProject',
    name: "Shoes",
    key: "shoes",
    parent: "",
    attributes: [
      { key: "color", label: "Color", isRequired: true, type: "text"},
      { key: "size", label: "Size", isRequired: true, type: "text"},
    ],
    ancestors: [],
    version: 0,
    createdAt: "2023-01-15T00:00:00.000+00:00"
  }
]);

// Product Category Tree Adidas
db.ProductCategory.insertMany([
  {
    _id: "home",
    projectId: 'TestProject',
    name: "Home",
    key: "home",
    parent: "",
    classificationCategories: [],
    ancestors: [],
    version: 0,
    createdAt: "2023-01-15T00:00:00.000+00:00"
  },
  {
    _id: "running",
    projectId: 'TestProject',
    name: "Running",
    key: "running",
    parent: "home",
    classificationCategories: [],
    ancestors: ["home"],
    version: 0,
    createdAt: "2023-01-15T00:00:00.000+00:00"
  },
  {
    _id: "shoes",
    projectId: 'TestProject',
    name: "shoes",
    key: "shoes",
    parent: "running",
    classificationCategories: ["shoes"],
    ancestors: ["running"],
    version: 0,
    createdAt: "2023-01-15T00:00:00.000+00:00"
  }
]);

// Product Adidas
db.ProductStage.insertMany([
  {
    _id: "adizeroPrimeX2-base",
    projectId: 'TestProject',
    catalog: "stage",
    name: "ADIZERO PRIME X 2 STRUNG RUNNING SHOES",
    description: "Built with innovative technology and designed without ...",
    slug: "adizero-prime-x-2-strung-running-shoes",
    searchKeywords: ["adizero", "prime", "x", "2", "strung", "running", "shoes"],
    categories: ["shoes"],
    isBase: true
  },
  {
    _id: "adizeroPrimeX2-White-001",
    projectId: 'TestProject',
    catalog: "stage",
    name: "ADIZERO PRIME X 2 STRUNG RUNNING SHOES WHITE!!!", // Overwrited name
    sku: "HP9708_570",
    searchKeywords: ["white"], // Added new keywords
    parent: "adizeroPrimeX2-base",
    attributes: {
      color: "Cloud White",
      size: "M 6/W 7"
    }
  },
  {
    _id: "adizeroPrimeX2-White-002",
    projectId: 'TestProject',
    catalog: "stage",
    sku: "HP9708_580",
    parent: "adizeroPrimeX2-base",
    attributes: {
      color: "Cloud White",
      size: "M 6.5/W 7.5"
    }
  },
  {
    _id: "adizeroPrimeX2-Black-001",
    projectId: 'TestProject',
    catalog: "stage",
    sku: "HP9709_580",
    parent: "adizeroPrimeX2-base",
    attributes: {
      color: "Core Black",
      size: "M 6.5/W 7.5"
    }
  }
])
