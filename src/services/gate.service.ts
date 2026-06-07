import { GateRepository } from '../repositories/gate.repository';
import { AuditLogRepository } from '../repositories/auditLog.repository';
import { Gate, CreateGateDTO, UpdateGateDTO, GateSnapshot } from '../models/gate.model';

export class GateService {
  private gateRepo: GateRepository;
  private auditLogRepo: AuditLogRepository;

  constructor() {
    this.gateRepo = new GateRepository();
    this.auditLogRepo = new AuditLogRepository();
  }

  getAllGates(filters?: any): Gate[] {
    return this.gateRepo.findAll(filters);
  }

  getGateById(id: string): Gate | undefined {
    return this.gateRepo.findById(id);
  }

  createGate(dto: CreateGateDTO, operator: string): Gate {
    const existing = this.gateRepo.findByGateNo(dto.gate_no);
    if (existing) {
      throw new Error('闸机编号已存在');
    }

    const gate = this.gateRepo.create(dto);

    this.auditLogRepo.create({
      operator,
      operation: '创建',
      entity_type: 'gate',
      entity_id: gate.id,
      new_value: JSON.stringify(gate)
    });

    return gate;
  }

  updateGate(id: string, dto: UpdateGateDTO, operator: string): Gate {
    const gate = this.gateRepo.findById(id);
    if (!gate) {
      throw new Error('闸机不存在');
    }

    const updated = this.gateRepo.update(id, dto);

    if (updated) {
      this.auditLogRepo.create({
        operator,
        operation: '更新',
        entity_type: 'gate',
        entity_id: id,
        old_value: JSON.stringify(gate),
        new_value: JSON.stringify(updated)
      });
    }

    return updated!;
  }

  deleteGate(id: string, operator: string): boolean {
    const gate = this.gateRepo.findById(id);
    if (!gate) {
      throw new Error('闸机不存在');
    }

    const result = this.gateRepo.delete(id);

    if (result) {
      this.auditLogRepo.create({
        operator,
        operation: '删除',
        entity_type: 'gate',
        entity_id: id,
        old_value: JSON.stringify(gate)
      });
    }

    return result;
  }

  getGateSnapshot(id: string): GateSnapshot | undefined {
    return this.gateRepo.getSnapshot(id);
  }

  archiveGate(id: string, operator: string): Gate | undefined {
    const gate = this.gateRepo.findById(id);
    if (!gate) {
      throw new Error('闸机不存在');
    }

    const archived = this.gateRepo.archive(id);

    if (archived) {
      this.auditLogRepo.create({
        operator,
        operation: '归档',
        entity_type: 'gate',
        entity_id: id,
        old_value: JSON.stringify(gate),
        new_value: JSON.stringify(archived)
      });
    }

    return archived;
  }

  updateHeartbeat(id: string, operator: string): Gate | undefined {
    const gate = this.gateRepo.findById(id);
    if (!gate) {
      throw new Error('闸机不存在');
    }

    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

    return this.gateRepo.update(id, {
      last_heartbeat: now,
      status: '在线'
    });
  }
}
