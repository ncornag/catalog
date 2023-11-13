import { Err, Ok, Result } from 'ts-results';
import { AppError, ErrorCode } from '@core/lib/appError';
import { nanoid } from 'nanoid';
import { type AuditLog } from '@core/entities/auditLog';
import { AuditLogDAO } from '@infrastructure/repositories/dao/auditLog.dao.schema';
import { IAuditLogRepository } from '@core/repositories/auditLog.repo';

// SERVICE INTERFACE
export interface IAuditLogService {
  createAuditLog: (payload: any) => Promise<Result<AuditLog, AppError>>;
  findAuditLogById: (id: string) => Promise<Result<AuditLog, AppError>>;
  findAuditLogs: (catalog: string) => Promise<Result<AuditLog[], AppError>>;
}

const toEntity = ({ _id, ...remainder }: AuditLogDAO): AuditLog => ({
  id: _id,
  ...remainder
});

// SERVICE IMPLEMENTATION
export class AuditlogService implements IAuditLogService {
  private static instance: IAuditLogService;
  private repo: IAuditLogRepository;

  private constructor(server: any) {
    this.repo = server.db.repo.auditLogRepository as IAuditLogRepository;
  }

  public static getInstance(server: any): IAuditLogService {
    if (!AuditlogService.instance) {
      AuditlogService.instance = new AuditlogService(server);
    }
    return AuditlogService.instance;
  }

  // CREATE AUDITLOG
  public async createAuditLog(payload: any): Promise<Result<AuditLog, AppError>> {
    // Save the entity
    const result = await this.repo.create({
      id: nanoid(),
      ...payload
    });
    if (result.err) return result;
    return new Ok(toEntity(result.val));
  }

  // FIND AUDITLOG By ID
  public async findAuditLogById(id: string): Promise<Result<AuditLog, AppError>> {
    const result = await this.repo.findOne(id);
    if (result.err) return result;
    return new Ok(toEntity(result.val));
  }

  // FIND AUDITLOGS
  public async findAuditLogs(catalogId: string): Promise<Result<AuditLog[], AppError>> {
    const result = await this.repo.find({ catalogId }, {});
    if (result.err) return result;
    return new Ok(result.val.map((entity) => toEntity(entity)));
  }
}
