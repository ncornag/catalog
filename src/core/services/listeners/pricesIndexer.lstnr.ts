import { Value } from '@sinclair/typebox/value';
import { green, red, magenta, yellow, bold } from 'kolorist';
import { IProductService, ProductService } from '../product.svc';

export class PricesIndexerListener {
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
      `${magenta('#')}  ${yellow('PriceIndexingService')} ${green('starting in')} ${
        this.server.config.PRICES_INDEXING_ROUTE
      }/${this.server.config.PRICES_INDEXING_QUEUE} for ${this.catalogs} catalogs`
    );
    this.server.messages.subscribe(
      {
        routingKey: this.server.config.PRICES_INDEXING_ROUTE,
        queue: {
          exclusive: true,
          autoDelete: true,
          name: this.server.config.PRICES_INDEXING_QUEUE
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
    if (data.metadata.entity !== 'price') return;
    if (!this.catalogs.includes(data.metadata.catalogId)) return;
    if (this.server.log.isLevelEnabled('debug'))
      this.server.log.debug(
        `${magenta('#' + data.metadata.requestId || '')} ${this.msgIn} indexing ${green(data.source.id)}`
      );
    if (data.metadata.type === 'entityUpdate') {
      // TODO: update Product on Price Update
      // const updates = Value.Patch({}, data.difference);
      // updates.id = data.source.id;
      // this.server.search.client.collections('products').documents().update(updates);
    } else if (data.metadata.type === 'entityInsert') {
      const productResult = await this.productService.findProducts(
        data.metadata.catalogId,
        { sku: data.source.sku },
        { project: { _id: 1 } }
      );
      if (productResult.err || productResult.val.length === 0) {
        this.server.log.error(`Error indexing price ${data.source.id}`, productResult.err);
        return;
      }
      await this.server.search.client
        .collections('products')
        .documents(productResult.val[0].id)
        .update({ prices: data.source });
      // await this.retryWithDelay(async () => {
      //   await this.server.search.client
      //     .collections('products')
      //     .documents(productResult.val[0].id)
      //     .update({ prices: data.source });
      // });
    }
  }

  private async retryWithDelay(fn: Function, retries = 3, interval = 500, finalErr = 'Retry failed'): Promise<any> {
    try {
      await fn();
    } catch (err) {
      if (retries <= 0) {
        return Promise.reject(finalErr);
      }
      await this.wait(interval);
      return this.retryWithDelay(fn, retries - 1, interval, finalErr);
    }
  }

  private wait(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export const pricesIndexerListener = (server: any) => {
  return new PricesIndexerListener(server).start();
};
