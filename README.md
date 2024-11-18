
# Catalog

This project is a product management system that handles catalog imports, updates, and synchronization, using MongoDB for data storage. It includes tools for managing products, categories, classifications, and catalog synchronization with an emphasis on dynamic data manipulation and validation.

## Overview

The project provides an API-driven system to manage product catalogs, classifications, and their synchronization between staged and online environments. It includes features for importing, creating, updating, and validating products and their associated data structures.

## Main Features

- **Product Importing:** Import products from external sources into a MongoDB database, supporting staged and online catalogs.
- **Product Creation:** Create products with multiple attributes, variants, and prices, including standalone pricing.
- **Product Updating:** Update product data dynamically using scripts and bulk operations.
- **Classification Management:** Create and manage classification attributes for products, with support for various data types.
- **Catalog Synchronization:** Sync product data between stage and online catalogs.
- **API Documentation:** A comprehensive Postman collection for API requests to manage products, categories, and classifications.

## Project Structure

The codebase is organized into the following directories:

- **data/**: Scripts for importing, creating, and updating product data.
- **doc/**: Documentation and Postman collection for API requests.
- **src/**: Core application code, organized into `core`, `infrastructure`, and `repositories`:
  - **core/**: Core services, entities, and business logic.
  - **infrastructure/**: MongoDB and HTTP configurations.
  - **repositories/**: Data access layers for product and category management.
- **tests/**: Test specifications for the product management system.

## Stack

- Fastify
- Mongodb
- Typebox

## Setup Instructions

### Prerequisites

- **Node.js** (v14 or higher)
- **MongoDB** (v4.4 or higher)
- **NPM** or **Yarn**
- **Environment Variables**: Copy the `.env.template` to `.env` and set the necessary values.

### Installation

1. **Clone the repository**:
   ```bash
   git clone <repository_url>
   cd <repository_directory>
   ```

2. **Install dependencies**:
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set up MongoDB**:
   Ensure MongoDB is running and configured with the necessary databases as specified in the `.env` file.

### Configuration

- Rename `.env.template` to `.env` and set the values for:
  - `MONGO_URL`: MongoDB connection string.
  - Other environment variables as needed for your setup.

### Running the Application

- **To import products**:
  ```bash
  node data/ct/importProducts.ts <firstProductToImport> <productsToImport> <stageSuffix> <currentSuffix>
  ```

- **To create products**:
  ```bash
  node data/createProducts.ts <productsToInsert> <variantsPerProduct> <pricesPerVariant> <stageSuffix> <currentSuffix>
  ```

- **To update products**:
  ```bash
  node data/updateProducts.ts <productsToModify>
  ```

- **To start the server**:
  ```bash
  npm start
  # or
  yarn start
  ```

## Usage Examples

- **Creating a New Product**:
  Example usage with the Postman collection in `doc/ct2.postman_collection.json` for creating a product with classifications and categories.

- **Synchronizing Catalogs**:
  Use the API to synchronize products between the `stage` and `online` catalogs, ensuring data consistency across environments.

## Testing

Run tests using Jest:
```bash
npm test
# or
yarn test
```

## Documentation

Refer to the [Postman Collection](doc/ct2.postman_collection.json) for detailed API documentation and usage examples for product management operations.

## Contributing

1. Fork the repository.
2. Create your feature branch (`git checkout -b feature/new-feature`).
3. Commit your changes (`git commit -am 'Add new feature'`).
4. Push to the branch (`git push origin feature/new-feature`).
5. Open a pull request.

## License

This project is UNLICENSED.

---

# Todos

- [X] Versions
- [X] Timestamps
- [X] Server wide Project field
- [X] Separate base/variants in their own documents
- [X] Separate stage/online (Catalogs)
- [X] Add Catalog sync
- [X] AuditLog
- [X] Catalog Sync
- [X] i18n Strings fields
- [X] Search
- [X] Prices
- [X] commercetools layer
  - [/] Import Products with Prices
  - [X] v1/getProduct endpoint
- [X] Create Random Products & Prices
- [X] Promotions
- [ ] Review Enum/List/Set attribute types
- [ ] Images/Assets fields
- [ ] Reference fields
- [ ] User defined Product relations (upsell, crossell..)
- [ ] Reference expansions

from https://miro.com/app/board/uXjVMFprX3M=/

- Define attributes as mandatory for a given channel/store (without forcing it in the data model)
- Publish only some variants
- Product groups (labels?)
  - Variants groups (?)
- Attribute groups
- Composite products (Pizza, cars, presentation cards)
- Storing variants and products separately will make querying products more difficult (AQ problem will be back) (AQ problem?)
- Other ways of adding data to product than attributes (?)
- Store-based category trees and categorization of products
- Dynamic variants (?)
- Product bundles..
- Extra dimensions
  - Channels
  - Stores
- Show/Query Atributes per location (per store?)
- Show/Query only a specific group of variants (i.e.: from 500, i.e.: only in stock)
- Separate staged and current
- Contextualisation management

- Search full data model
  - Faceted search and filtering
- Import/export
- Sizes conversion
- Discounts
