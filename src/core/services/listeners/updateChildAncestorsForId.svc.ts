import { AppError } from '@core/lib/appError';
import { green, red, magenta, yellow, bold } from 'kolorist';
import { Result } from 'ts-results';

export interface IRepo<DAO> {
  find(query: any, options: any): Promise<Result<DAO[], AppError>>;
  update: (filter: any, update: any) => Promise<Result<any, AppError>>;
}

const msgIn = bold(yellow('←')) + yellow('MSG:');

const handler = async (data: any, server: any) => {
  const repo = server.db.repo.classificationCategoryRepository;
  server.log.debug(
    `${magenta('#' + data.metadata.requestId || '')} ${msgIn} updateChildAncestorsForId ${green(JSON.stringify(data))}`
  );
  //
  const entityResult = await repo.find(
    { projectId: data.metadata.projectId, _id: data.id },
    { projection: { _id: 1, ancestors: 1 } }
  );
  if (entityResult.err) {
    console.log('error: ' + entityResult.err);
    return;
  }
  // Can't do pull and push in the same update :(
  const updateResult1 = await repo.update(
    { projectId: data.metadata.projectId, ancestors: data.id },
    {
      $pull: { ancestors: { $in: data.oldAncestors } }
    }
  );
  if (updateResult1.err) {
    console.log('error: ' + updateResult1.err);
    return;
  }
  const updateResult2 = await repo.update(
    { projectId: data.metadata.projectId, ancestors: data.id },
    {
      $push: { ancestors: { $each: entityResult.val[0].ancestors, $position: 0 } }
    }
  );
  if (updateResult2.err) {
    console.log('error: ' + updateResult2.err);
    return;
  }
};

class UpdateChildAncestorsForIdService {
  private server: any;
  constructor(server: any) {
    this.server = server;
  }
  start() {
    this.server.log.info(
      `${magenta('#')}  ${yellow('UpdateChildAncestorsForIdService')} ${green('starting in')} ${
        this.server.config.CC_TREE_ROUTE
      }/${this.server.config.CC_TREE_QUEUE}`
    );
    this.server.messages.subscribe(
      {
        routingKey: this.server.config.CC_TREE_ROUTE,
        queue: {
          exclusive: true,
          autoDelete: true,
          name: this.server.config.CC_TREE_QUEUE
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
        handler(data, this.server.server);
      }
    );
  }
}

export const updateChildAncestorsForIdService = (server: any) => {
  return new UpdateChildAncestorsForIdService(server).start();
};
