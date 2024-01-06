import { ProductType } from '@core/entities/product';
import { Value } from '@sinclair/typebox/value';
import { green, red, magenta, yellow, bold } from 'kolorist';
import { IProductService, ProductService } from '@core/services/product.svc';

export class ProductsIndexerListener {
  private server: any;
  private productService: IProductService;
  private catalogs: string[];
  private msgIn = bold(yellow('←')) + yellow('MSG:');

  constructor(server: any) {
    this.server = server;
    this.catalogs = server.config.CATALOGS_TO_INDEX.split(',');
    this.productService = ProductService.getInstance(server);
  }

  public start() {
    this.server.log.info(
      `${magenta('#')}  ${yellow('ProductIndexingService')} ${green('starting in')} ${
        this.server.config.PRODUCTS_INDEXING_ROUTE
      }/${this.server.config.PRODUCTS_INDEXING_QUEUE} for ${this.catalogs} catalogs`
    );
    this.server.messages.subscribe(
      {
        routingKey: this.server.config.PRODUCTS_INDEXING_ROUTE,
        queue: {
          exclusive: true,
          autoDelete: true,
          name: this.server.config.PRODUCTS_INDEXING_QUEUE
        },
        exchange: {
          type: 'topic',
          durable: false,
          name: this.server.config.EXCHANGE
        },
        consumerOptions: {
          noAck: true
        }
      },
      (data: any) => {
        this.handler(data);
      }
    );
  }

  private async handler(data: any) {
    if (data.metadata.entity !== 'product') return;
    if (data.source.type !== ProductType.VARIANT) return;
    if (!this.catalogs.includes(data.metadata.catalogId)) return;
    if (this.server.log.isLevelEnabled('debug'))
      this.server.log.debug(
        `${magenta('#' + data.metadata.requestId || '')} ${this.msgIn} indexing ${green(data.source.id)}`
      );
    if (data.metadata.type === 'entityUpdate') {
      const updates = Value.Patch({}, data.difference);
      updates.id = data.source.id;
      this.server.search.client.collections('products').documents().update(updates);
    } else if (data.metadata.type === 'entityInsert') {
      // TODO: filter what to index, including fields and locales
      const productResult = await this.productService.findProductById(data.metadata.catalogId, data.source.id, true);
      if (productResult.err) {
        this.server.log.error(`Error indexing product ${data.source.id}`, productResult.err);
        return;
      }
      await this.server.search.client.collections('products').documents().upsert(productResult.val);
    }
  }
}

export const productsIndexerListener = (server: any) => {
  return new ProductsIndexerListener(server).start();
};
