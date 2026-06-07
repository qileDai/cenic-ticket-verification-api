export {};
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      PORT?: string;
      DB_PATH?: string;
      NODE_ENV?: string;
    }
  }
}
