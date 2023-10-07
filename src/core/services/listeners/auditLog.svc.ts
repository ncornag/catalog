import { green, red, magenta, yellow, bold } from 'kolorist';

const msgIn = bold(yellow('←')) + yellow('MSG:');

const handler = async (data: any, server: any) => {
  server.log.debug(`${magenta('#' + data.metadata.requestId || '')} ${msgIn} auditLog ${green(JSON.stringify(data))}`);
};

export class AuditLogService {
  private server: any;
  constructor(server: any) {
    this.server = server;
  }
  start() {
    this.server.log.info(
      `${magenta('#')}  ${yellow('AuditLogService')} ${green('starting in')} ${this.server.config.AUDITLOG_ROUTE}/${
        this.server.config.AUDITLOG_QUEUE
      }`
    );
    this.server.messages.subscribe(
      {
        routingKey: this.server.config.AUDITLOG_ROUTE,
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
