import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { join } from 'path';

// 載入環境變數（從 backend/.env）
config({ path: join(__dirname, '../../.env') });

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT ?? 3306),
  username: process.env.DB_USER || 'rt_mart_user',
  password:
    process.env.DB_PASSWORD ||
    'rt_mart_and_the_user_password_yeah_very_cool123*',
  database: process.env.DB_NAME || 'rt_mart_db',
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/../migration/*{.ts,.js}'],
  synchronize: false,
  logging: true,
});
