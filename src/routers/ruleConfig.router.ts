import { Router, Request, Response } from 'express';
import { RuleConfigService } from '../services/ruleConfig.service';
import { CreateRuleConfigSchema, UpdateRuleConfigSchema, RuleConfigQuerySchema } from '../schemas/ruleConfig.schema';

const router = Router();
const ruleConfigService = new RuleConfigService();

router.get('/', (req: Request, res: Response) => {
  try {
    const query = RuleConfigQuerySchema.parse(req.query);
    const { page, page_size, ...filters } = query;
    
    const configs = ruleConfigService.getAllRuleConfigs(filters);
    const start = (page - 1) * page_size;
    const end = start + page_size;
    const paginatedConfigs = configs.slice(start, end);

    res.json({
      success: true,
      data: paginatedConfigs,
      pagination: {
        page,
        page_size,
        total: configs.length,
        total_pages: Math.ceil(configs.length / page_size)
      }
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/:id', (req: Request, res: Response) => {
  try {
    const config = ruleConfigService.getRuleConfigById(req.params.id);
    if (!config) {
      return res.status(404).json({ success: false, error: '规则配置不存在' });
    }
    res.json({ success: true, data: config });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/code/:ruleCode', (req: Request, res: Response) => {
  try {
    const config = ruleConfigService.getRuleConfigByCode(req.params.ruleCode);
    if (!config) {
      return res.status(404).json({ success: false, error: '规则配置不存在' });
    }
    res.json({ success: true, data: config });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/', (req: Request, res: Response) => {
  try {
    const dto = CreateRuleConfigSchema.parse(req.body);
    const operator = req.body.operator || '系统管理员';
    const config = ruleConfigService.createRuleConfig(dto, operator);
    res.status(201).json({ success: true, data: config });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.put('/:id', (req: Request, res: Response) => {
  try {
    const dto = UpdateRuleConfigSchema.parse(req.body);
    const operator = req.body.operator || '系统管理员';
    const config = ruleConfigService.updateRuleConfig(req.params.id, dto, operator);
    res.json({ success: true, data: config });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.delete('/:id', (req: Request, res: Response) => {
  try {
    const operator = req.query.operator as string || '系统管理员';
    const result = ruleConfigService.deleteRuleConfig(req.params.id, operator);
    res.json({ success: result, message: result ? '删除成功' : '删除失败' });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

export default router;
