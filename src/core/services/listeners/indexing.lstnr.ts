import { Value } from '@sinclair/typebox/value';
import { green, red, magenta, yellow, bold } from 'kolorist';

const msgIn = bold(yellow('←')) + yellow('MSG:');

const handler = async (data: any, server: any, catalogs: string[]) => {
  if (!catalogs.includes(data.metadata.catalogId)) return;
  //if (data.metadata.catalogId !== 'online') return;
  if (data.metadata.entity !== 'product') return;
  if (server.log.isLevelEnabled('debug'))
    server.log.debug(`${magenta('#' + data.metadata.requestId || '')} ${msgIn} indexing ${green(data.source.id)}`);
  if (data.metadata.type === 'entityUpdate') {
    const updates = Value.Patch({}, data.difference);
    updates.id = data.source.id;
    server.search.client.collections('products').documents().update(updates);
  } else if (data.metadata.type === 'entityInsert') {
    server.search.client.collections('products').documents().upsert(data.source);
  }
};

export class SearchListener {
  private server: any;
  private catalogs: string[];
  constructor(server: any) {
    this.server = server;
    this.catalogs = server.config.CATALOGS_TO_INDEX.split(',');
  }
  start() {
    this.server.log.info(
      `${magenta('#')}  ${yellow('IndexingService')} ${green('starting in')} ${
        this.server.config.ENTITY_UPDATE_ROUTE
      }/${this.server.config.SEARCH_QUEUE} for ${this.catalogs} catalogs`
    );
    this.server.messages.subscribe(
      {
        routingKey: this.server.config.ENTITY_UPDATE_ROUTE,
        queue: {
          exclusive: true,
          autoDelete: true,
          name: this.server.config.SEARCH_QUEUE
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
        handler(data, this.server, this.catalogs);
      }
    );
  }
}

export const searchListener = (server: any) => {
  return new SearchListener(server).start();
};
