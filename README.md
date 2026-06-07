# 景区门票团购核销异常分诊规则计算 API 服务

一个专注于景区门票团购核销异常分诊的纯后端 REST API 服务，提供完整的券码管理、核销记录处理、异常分诊、统计聚合等功能。

## 项目简介

本项目围绕景区票务运营、团购平台对接、客服专员等目标用户，针对团购券码、核销记录、入园闸机、异常原因、补录申请、游客凭证等核心业务对象，提供分诊核销异常、复核游客凭证、补录入园记录和生成对账差异等功能。

### 核心痛点解决

- 景区团购券码核销异常多
- 闸机离线或游客凭证缺失影响对账
- 重复核销异常处理流程不规范
- 统计数据难以追溯明细

## 技术栈

- **运行环境**: Node.js 18+
- **Web框架**: Express
- **开发语言**: TypeScript
- **数据库**: SQLite (better-sqlite3)
- **数据验证**: Zod
- **测试框架**: Jest

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 初始化数据库

```bash
npm run init-db
```

### 3. 导入Seed数据

```bash
npm run seed
```

### 4. 启动开发服务器

```bash
npm run dev
```

服务将在 `http://localhost:3000` 启动。

### 5. 构建生产版本

```bash
npm run build
npm start
```

## 核心功能模块

### 1. 团购券码管理
- 券码CRUD操作
- 券码状态管理（未核销、已核销、已过期、已作废、异常）
- 批次管理

### 2. 核销记录管理
- 核销记录CRUD
- 批量导入预检
- 重复核销检测
- 异常分诊

### 3. 入园闸机管理
- 闸机CRUD
- 闸机快照
- 闸机归档
- 心跳更新

### 4. 异常原因管理
- 异常原因配置
- 严重程度分级
- 解决方案配置

### 5. 补录申请管理
- 补录申请流程
- 状态流转（待复核、待补充、已确认、已归档、已驳回）
- 复核游客凭证

### 6. 游客凭证管理
- 凭证上传
- 凭证验证
- 凭证关联

### 7. 对账批次管理
- 批次创建
- 对账差异计算
- 对账流程管理

### 8. 异常事件管理
- 异常事件创建
- 处理建议计算
- 事件处理流程

### 9. 统计聚合
- 核销成功率统计
- 异常率统计
- 重复核销率统计
- 按日/批次/操作员聚合

### 10. 审计日志
- 操作记录追踪
- 实体变更历史
- 操作人行为分析

## 领域业务规则

### 规则1: 异常处理建议计算
根据券码状态、闸机记录、游客凭证和对账批次自动计算异常处理建议。

### 规则2: 重复核销异常处理
当出现券码重复核销时，自动进入异常队列，记录触发字段、阈值、处理人和处理时限。

### 规则3: 分诊核销异常校验
分诊核销异常前必须校验团购券码、核销记录和入园闸机之间的一致性，缺少关键字段时只允许保存草稿。

### 规则4: 统计聚合规则
核销成功率、异常补录率和重复核销率需要按日/批次/责任角色聚合，支持查看明细来源。

### 规则5: 状态流转限制
状态流转必须限制下一步动作：
- 草稿 → 待复核、待补充
- 待复核 → 已确认、已驳回、待补充
- 待补充 → 待复核、已驳回
- 已驳回 → 待复核
- 已确认 → 已归档
- 驳回必须填写原因

## API 接口列表

### 券码接口
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/coupons | 获取券码列表 |
| GET | /api/coupons/:id | 获取单个券码 |
| POST | /api/coupons | 创建券码 |
| PUT | /api/coupons/:id | 更新券码 |
| DELETE | /api/coupons/:id | 删除券码 |
| GET | /api/coupons/:id/transitions | 获取允许的状态流转 |

### 核销记录接口
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/verifications | 获取核销记录列表 |
| GET | /api/verifications/:id | 获取单个核销记录 |
| POST | /api/verifications | 创建核销记录 |
| PUT | /api/verifications/:id | 更新核销记录 |
| DELETE | /api/verifications/:id | 删除核销记录 |
| POST | /api/verifications/import | 批量导入核销记录 |
| POST | /api/verifications/import/preview | 批量导入预检 |
| POST | /api/verifications/check-duplicate | 重复核销检测 |
| POST | /api/verifications/triage | 分诊核销异常 |

### 闸机接口
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/gates | 获取闸机列表 |
| GET | /api/gates/:id | 获取单个闸机 |
| POST | /api/gates | 创建闸机 |
| PUT | /api/gates/:id | 更新闸机 |
| DELETE | /api/gates/:id | 删除闸机 |
| GET | /api/gates/:id/snapshot | 获取闸机快照 |
| POST | /api/gates/:id/archive | 归档闸机 |
| POST | /api/gates/:id/heartbeat | 更新心跳 |

### 异常原因接口
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/exception-reasons | 获取异常原因列表 |
| GET | /api/exception-reasons/:id | 获取单个异常原因 |
| POST | /api/exception-reasons | 创建异常原因 |
| PUT | /api/exception-reasons/:id | 更新异常原因 |
| DELETE | /api/exception-reasons/:id | 删除异常原因 |

### 补录申请接口
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/supplementary | 获取补录申请列表 |
| GET | /api/supplementary/:id | 获取单个补录申请 |
| POST | /api/supplementary | 创建补录申请 |
| PUT | /api/supplementary/:id | 更新补录申请 |
| DELETE | /api/supplementary/:id | 删除补录申请 |
| POST | /api/supplementary/:id/review | 复核补录申请 |
| POST | /api/supplementary/review | 复核游客凭证 |

### 游客凭证接口
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/visitor-vouchers | 获取游客凭证列表 |
| GET | /api/visitor-vouchers/:id | 获取单个游客凭证 |
| POST | /api/visitor-vouchers | 创建游客凭证 |
| PUT | /api/visitor-vouchers/:id | 更新游客凭证 |
| DELETE | /api/visitor-vouchers/:id | 删除游客凭证 |
| POST | /api/visitor-vouchers/:id/verify | 验证游客凭证 |

### 对账批次接口
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/reconciliation-batches | 获取对账批次列表 |
| GET | /api/reconciliation-batches/:id | 获取单个对账批次 |
| POST | /api/reconciliation-batches | 创建对账批次 |
| PUT | /api/reconciliation-batches/:id | 更新对账批次 |
| DELETE | /api/reconciliation-batches/:id | 删除对账批次 |
| GET | /api/reconciliation-batches/:id/difference | 计算对账差异 |
| POST | /api/reconciliation-batches/:id/start | 开始对账 |
| POST | /api/reconciliation-batches/:id/complete | 完成对账 |

### 异常事件接口
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/exception-events | 获取异常事件列表 |
| GET | /api/exception-events/:id | 获取单个异常事件 |
| POST | /api/exception-events | 创建异常事件 |
| PUT | /api/exception-events/:id | 更新异常事件 |
| DELETE | /api/exception-events/:id | 删除异常事件 |
| POST | /api/exception-events/suggestion | 计算异常处理建议 |
| POST | /api/exception-events/:id/handle | 处理异常事件 |

### 统计接口
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/statistics/success-rate | 核销成功率统计 |
| GET | /api/statistics/exception-rate | 异常率统计 |
| GET | /api/statistics/duplicate-rate | 重复核销率统计 |
| GET | /api/statistics/summary | 统计汇总 |

### 审计日志接口
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/audit-logs | 获取审计日志列表 |
| GET | /api/audit-logs/:id | 获取单个审计日志 |
| GET | /api/audit-logs/entity/:entityType/:entityId | 获取实体审计日志 |
| GET | /api/audit-logs/operator/:operator | 获取操作人审计日志 |

### 状态流转接口
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/status-flows | 获取状态流转历史 |
| GET | /api/status-flows/transitions | 获取允许的状态流转 |

## 测试

### 运行测试

```bash
npm test
```

### 运行测试（监视模式）

```bash
npm run test:watch
```

### 生成测试覆盖率报告

```bash
npm test -- --coverage
```

## HTTP 接口测试

项目提供了完整的 HTTP 接口样本文件，位于 `http-examples/api.http`。

使用 VS Code 的 REST Client 插件或 JetBrains HTTP Client 可以直接测试接口。

## 数据库说明

### 数据库文件位置
- 可通过环境变量 `DB_PATH` 配置

### 数据库初始化
```bash
npm run init-db
```

### Seed数据
Seed数据包含超过60条贴近业务的测试数据，覆盖：
- 闸机数据（5条）
- 券码数据（15条）
- 核销记录（10条）
- 异常原因（5条）
- 补录申请（5条）
- 游客凭证（5条）
- 对账批次（5条）
- 异常事件（5条）
- 规则配置（5条）
- 状态流转（5条）
- 审计日志（5条）

## 环境变量

| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| PORT | 3000 | 服务端口 |

## 开发命令

| 命令 | 说明 |
|------|------|
| npm run dev | 启动开发服务器（热重载） |
| npm run build | 构建生产版本 |
| npm start | 启动生产服务器 |
| npm run init-db | 初始化数据库 |
| npm run seed | 导入Seed数据 |
| npm test | 运行测试 |
| npm run lint | 代码检查 |

## 贡献指南

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request
