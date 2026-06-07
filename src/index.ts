import app from './app';
import { config } from './config';
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

const dbDir = path.dirname(config.database.path);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(config.database.path);
db.pragma('journal_mode = WAL');

process.on('SIGINT', () => {
  db.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  db.close();
  process.exit(0);
});

const server = app.listen(config.port, () => {
  console.log(`🚀 ${config.app.name} 已启动`);
  console.log(`📍 服务地址: http://localhost:${config.port}`);
  console.log(`📊 API文档: http://localhost:${config.port}/`);
  console.log(`💾 数据库: ${config.database.path}`);
});

export { db, server };
