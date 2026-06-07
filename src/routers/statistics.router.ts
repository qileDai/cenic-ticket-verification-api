import { Router, Request, Response } from 'express';
import { StatisticsService } from '../services/statistics.service';
import { SuccessRateQuerySchema, ExceptionRateQuerySchema, DuplicateRateQuerySchema } from '../schemas/statistics.schema';

const router = Router();
const statisticsService = new StatisticsService();

router.get('/success-rate', (req: Request, res: Response) => {
  try {
    const query = SuccessRateQuerySchema.parse(req.query);
    const { start_date, end_date, batch_no, platform, group_by } = query;
    
    const result = statisticsService.getSuccessRate(
      start_date, 
      end_date, 
      group_by,
      { batch_no, platform }
    );
    
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/exception-rate', (req: Request, res: Response) => {
  try {
    const query = ExceptionRateQuerySchema.parse(req.query);
    const { start_date, end_date, batch_no, group_by } = query;
    
    const result = statisticsService.getExceptionRate(
      start_date, 
      end_date, 
      group_by,
      { batch_no }
    );
    
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/duplicate-rate', (req: Request, res: Response) => {
  try {
    const query = DuplicateRateQuerySchema.parse(req.query);
    const { start_date, end_date, batch_no, group_by } = query;
    
    const result = statisticsService.getDuplicateRate(
      start_date, 
      end_date, 
      group_by,
      { batch_no }
    );
    
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/summary', (req: Request, res: Response) => {
  try {
    const { start_date, end_date } = req.query;
    
    if (!start_date || !end_date) {
      return res.status(400).json({ 
        success: false, 
        error: 'start_date 和 end_date 参数必填' 
      });
    }
    
    const result = statisticsService.getSummary(
      start_date as string, 
      end_date as string
    );
    
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

export default router;
