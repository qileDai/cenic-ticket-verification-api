import { StatusFlowRepository } from '../repositories/statusFlow.repository';
import { StatusFlow, CreateStatusFlowDTO } from '../models/statusFlow.model';

export class StatusFlowService {
  private statusFlowRepo: StatusFlowRepository;

  constructor() {
    this.statusFlowRepo = new StatusFlowRepository();
  }

  getStatusHistory(entityType: string, entityId: string): StatusFlow[] {
    return this.statusFlowRepo.findAll({ entity_type: entityType, entity_id: entityId });
  }

  getLatestStatus(entityType: string, entityId: string): StatusFlow | undefined {
    return this.statusFlowRepo.getLatestStatus(entityType, entityId);
  }

  canTransition(entityType: string, currentStatus: string, targetStatus: string): boolean {
    return this.statusFlowRepo.canTransition(entityType, currentStatus, targetStatus);
  }

  getTransitions(entityType: string, currentStatus: string) {
    return this.statusFlowRepo.getTransitions(entityType, currentStatus);
  }

  createStatusFlow(dto: CreateStatusFlowDTO): StatusFlow {
    return this.statusFlowRepo.create(dto);
  }
}
