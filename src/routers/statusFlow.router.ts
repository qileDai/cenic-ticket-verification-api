import { Router, Request, Response } from 'express';
import { StatusFlowService } from '../services/statusFlow.service';

const router = Router();
const statusFlowService = new StatusFlowService();

router.get('/', (req: Request, res: Response) => {
  try {
    const { entity_type, entity_id, operator } = req.query;
    
    const flows = statusFlowService.getStatusHistory(
      entity_type as string,
      entity_id as string
    );

    res.json({ success: true, data: flows });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/transitions', (req: Request, res: Response) => {
  try {
    const { entity_type, current_status } = req.query;
    
    if (!entity_type || !current_status) {
      return res.status(400).json({ 
        success: false, 
        error: 'entity_type 和 current_status 参数必填' 
      });
    }

    const transitions = statusFlowService.getTransitions(
      entity_type as string,
      current_status as string
    );

    res.json({ success: true, data: transitions });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/:id', (req: Request, res: Response) => {
  try {
    const flow = statusFlowService.getStatusHistory(
      req.params.entity_type || '',
      req.params.id
    );
    res.json({ success: true, data: flow });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

export default router;
