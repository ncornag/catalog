import { green, red, magenta, yellow, bold } from 'kolorist';

const msgIn = bold(yellow('←')) + yellow('MSG:');

const handler = async (data: any, server: any) => {
  server.log.debug(`${magenta('#' + data.metadata.requestId || '')} ${msgIn} auditLog ${green(data.source.id)}`);
  const col = server.db.col.auditLog[data.source.projectId];
};

export class AuditLogService {
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
          name: this.server.config.AUDITLOG_QUEUE
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

export const auditLogService = (server: any) => {
  return new AuditLogService(server).start();
};
