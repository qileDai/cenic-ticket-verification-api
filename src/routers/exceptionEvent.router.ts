import { Router, Request, Response } from 'express';
import { ExceptionEventService } from '../services/exceptionEvent.service';
import { CreateExceptionEventSchema, UpdateExceptionEventSchema, ExceptionEventQuerySchema, ExceptionSuggestionSchema } from '../schemas/exceptionEvent.schema';

const router = Router();
const exceptionEventService = new ExceptionEventService();

router.get('/', (req: Request, res: Response) => {
  try {
    const query = ExceptionEventQuerySchema.parse(req.query);
    const { page, page_size, ...filters } = query;
    
    const events = exceptionEventService.getAllExceptionEvents(filters);
    const start = (page - 1) * page_size;
    const end = start + page_size;
    const paginatedEvents = events.slice(start, end);

    res.json({
      success: true,
      data: paginatedEvents,
      pagination: {
        page,
        page_size,
        total: events.length,
        total_pages: Math.ceil(events.length / page_size)
      }
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/:id', (req: Request, res: Response) => {
  try {
    const event = exceptionEventService.getExceptionEventById(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, error: '异常事件不存在' });
    }
    res.json({ success: true, data: event });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/', (req: Request, res: Response) => {
  try {
    const dto = CreateExceptionEventSchema.parse(req.body);
    const operator = req.body.operator || '系统管理员';
    const event = exceptionEventService.createExceptionEvent(dto, operator);
    res.status(201).json({ success: true, data: event });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.put('/:id', (req: Request, res: Response) => {
  try {
    const dto = UpdateExceptionEventSchema.parse(req.body);
    const operator = req.body.operator || '系统管理员';
    const event = exceptionEventService.updateExceptionEvent(req.params.id, dto, operator);
    res.json({ success: true, data: event });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.delete('/:id', (req: Request, res: Response) => {
  try {
    const operator = req.query.operator as string || '系统管理员';
    const result = exceptionEventService.deleteExceptionEvent(req.params.id, operator);
    res.json({ success: result, message: result ? '删除成功' : '删除失败' });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/suggestion', (req: Request, res: Response) => {
  try {
    const input = ExceptionSuggestionSchema.parse(req.body);
    const suggestion = exceptionEventService.calculateSuggestion(input);
    res.json({ success: true, data: suggestion });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/:id/handle', (req: Request, res: Response) => {
  try {
    const { handler, handle_result } = req.body;
    if (!handler || !handle_result) {
      return res.status(400).json({ 
        success: false, 
        error: 'handler 和 handle_result 参数必填' 
      });
    }
    const event = exceptionEventService.handleEvent(req.params.id, handler, handle_result);
    res.json({ success: true, data: event });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

export default router;
