export const config = {
  port: process.env.PORT || 3000,
  database: {
    path: process.env.DB_PATH || './data/scenic_ticket.db'
  },
  app: {
    name: '景区门票团购核销异常分诊规则计算 API 服务',
    version: '1.0.0'
  }
};
