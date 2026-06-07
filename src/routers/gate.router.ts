import { Router, Request, Response } from 'express';
import { GateService } from '../services/gate.service';
import { CreateGateSchema, UpdateGateSchema, GateQuerySchema } from '../schemas/gate.schema';

const router = Router();
const gateService = new GateService();

router.get('/', (req: Request, res: Response) => {
  try {
    const query = GateQuerySchema.parse(req.query);
    const { page, page_size, ...filters } = query;
    
    const gates = gateService.getAllGates(filters);
    const start = (page - 1) * page_size;
    const end = start + page_size;
    const paginatedGates = gates.slice(start, end);

    res.json({
      success: true,
      data: paginatedGates,
      pagination: {
        page,
        page_size,
        total: gates.length,
        total_pages: Math.ceil(gates.length / page_size)
      }
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/:id', (req: Request, res: Response) => {
  try {
    const gate = gateService.getGateById(req.params.id);
    if (!gate) {
      return res.status(404).json({ success: false, error: '闸机不存在' });
    }
    res.json({ success: true, data: gate });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/:id/snapshot', (req: Request, res: Response) => {
  try {
    const snapshot = gateService.getGateSnapshot(req.params.id);
    if (!snapshot) {
      return res.status(404).json({ success: false, error: '闸机不存在' });
    }
    res.json({ success: true, data: snapshot });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/', (req: Request, res: Response) => {
  try {
    const dto = CreateGateSchema.parse(req.body);
    const operator = req.body.operator || '系统管理员';
    const gate = gateService.createGate(dto, operator);
    res.status(201).json({ success: true, data: gate });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.put('/:id', (req: Request, res: Response) => {
  try {
    const dto = UpdateGateSchema.parse(req.body);
    const operator = req.body.operator || '系统管理员';
    const gate = gateService.updateGate(req.params.id, dto, operator);
    res.json({ success: true, data: gate });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.delete('/:id', (req: Request, res: Response) => {
  try {
    const operator = req.query.operator as string || '系统管理员';
    const result = gateService.deleteGate(req.params.id, operator);
    res.json({ success: result, message: result ? '删除成功' : '删除失败' });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/:id/archive', (req: Request, res: Response) => {
  try {
    const operator = req.body.operator || '系统管理员';
    const gate = gateService.archiveGate(req.params.id, operator);
    res.json({ success: true, data: gate });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/:id/heartbeat', (req: Request, res: Response) => {
  try {
    const operator = req.body.operator || '系统管理员';
    const gate = gateService.updateHeartbeat(req.params.id, operator);
    res.json({ success: true, data: gate });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

export default router;
