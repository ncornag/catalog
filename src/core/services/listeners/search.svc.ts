import { Value } from '@sinclair/typebox/value';
import { green, red, magenta, yellow, bold } from 'kolorist';

const msgIn = bold(yellow('←')) + yellow('MSG:');

const handler = async (data: any, server: any) => {
  if (data.metadata.catalogId !== 'online') return;
  if (data.metadata.entity !== 'product') return;
  server.log.debug(`${magenta('#' + data.metadata.requestId || '')} ${msgIn} indexing ${green(data.source.id)}`);
  if (data.metadata.type === 'entityUpdate') {
    const updates = Value.Patch({}, data.difference);
    updates.id = data.source.id;
    server.search.client.collections('products').documents().update(updates);
  } else if (data.metadata.type === 'entityInsert') {
    server.search.client.collections('products').documents().upsert(data.source);
  }
};

export class SearchService {
  private server: any;
  constructor(server: any) {
    this.server = server;
  }
  start() {
    this.server.log.info(
      `${magenta('#')}  ${yellow('AuditLogService')} ${green('starting in')} ${
        this.server.config.ENTITY_UPDATE_ROUTE
      }/${this.server.config.AUDITLOG_QUEUE}`
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
        handler(data, this.server);
      }
    );
  }
}

export const searchService = (server: any) => {
  return new SearchService(server).start();
};

// {
//     "difference": [
//         {
//             "path": "/name/es",
//             "type": "insert",
//             "value": "Test-04"
//         },
//         {
//             "path": "/name/en",
//             "type": "delete"
//         }
//     ],
//     "metadata": {
//         "entity": "product",
//         "catalogId": "stage",
//         "projectId": "TestProject",
//         "requestId": "SGfV7",
//         "type": "entityUpdate"
//     },
//     "source": {
//         "_id": "hb2I5ALV_mCAUhgjvkC2A",
//         "attributes": {},
//         "catalog": "Stage",
//         "categories": [
//             "shoes"
//         ],
//         "createdAt": "2023-11-13T10:03:55.620Z",
//         "description": "Built with innovative technology and designed without ...",
//         "name": {
//             "en": "ADIZERO PRIME X 2 STRUNG RUNNING SHOES"
//         },
//         "parent": "",
//         "projectId": "TestProject",
//         "searchKeywords": [
//             "adizero",
//             "prime",
//             "x",
//             "2",
//             "strung",
//             "running",
//             "shoes"
//         ],
//         "slug": "adizero-prime-x-2-strung-running-shoes",
//         "type": "base",
//         "version": 0
//     }
// }
