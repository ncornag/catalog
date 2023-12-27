# e-commerce Product Catalog implementation with Fastify, Mongodb and Typebox

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
