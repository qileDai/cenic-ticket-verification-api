import { RuleConfigRepository } from '../repositories/ruleConfig.repository';
import { AuditLogRepository } from '../repositories/auditLog.repository';
import { RuleConfig, CreateRuleConfigDTO, UpdateRuleConfigDTO } from '../models/ruleConfig.model';

export class RuleConfigService {
  private ruleConfigRepo: RuleConfigRepository;
  private auditLogRepo: AuditLogRepository;

  constructor() {
    this.ruleConfigRepo = new RuleConfigRepository();
    this.auditLogRepo = new AuditLogRepository();
  }

  getAllRuleConfigs(filters?: any): RuleConfig[] {
    return this.ruleConfigRepo.findAll(filters);
  }

  getRuleConfigById(id: string): RuleConfig | undefined {
    return this.ruleConfigRepo.findById(id);
  }

  getRuleConfigByCode(ruleCode: string): RuleConfig | undefined {
    return this.ruleConfigRepo.findByRuleCode(ruleCode);
  }

  createRuleConfig(dto: CreateRuleConfigDTO, operator: string): RuleConfig {
    const existing = this.ruleConfigRepo.findByRuleCode(dto.rule_code);
    if (existing) {
      throw new Error('规则编码已存在');
    }

    const config = this.ruleConfigRepo.create(dto);

    this.auditLogRepo.create({
      operator,
      operation: '创建',
      entity_type: 'rule_config',
      entity_id: config.id,
      new_value: JSON.stringify(config)
    });

    return config;
  }

  updateRuleConfig(id: string, dto: UpdateRuleConfigDTO, operator: string): RuleConfig {
    const config = this.ruleConfigRepo.findById(id);
    if (!config) {
      throw new Error('规则配置不存在');
    }

    const updated = this.ruleConfigRepo.update(id, dto);

    if (updated) {
      this.auditLogRepo.create({
        operator,
        operation: '更新',
        entity_type: 'rule_config',
        entity_id: id,
        old_value: JSON.stringify(config),
        new_value: JSON.stringify(updated)
      });
    }

    return updated!;
  }

  deleteRuleConfig(id: string, operator: string): boolean {
    const config = this.ruleConfigRepo.findById(id);
    if (!config) {
      throw new Error('规则配置不存在');
    }

    const result = this.ruleConfigRepo.delete(id);

    if (result) {
      this.auditLogRepo.create({
        operator,
        operation: '删除',
        entity_type: 'rule_config',
        entity_id: id,
        old_value: JSON.stringify(config)
      });
    }

    return result;
  }

  getRuleValue(ruleCode: string): string | undefined {
    return this.ruleConfigRepo.getValue(ruleCode);
  }

  getRuleThreshold(ruleCode: string): number | undefined {
    return this.ruleConfigRepo.getThreshold(ruleCode);
  }
}
