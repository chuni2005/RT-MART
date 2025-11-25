import { QueryRunner } from 'typeorm';
import { AppDataSource } from '../config/data-source';
import { SeedService } from './seed.service';
import { IdMapping } from './utils/id-mapping';

async function main() {
  // 解析命令列參數
  const force = process.argv.includes('--force');

  let queryRunner: QueryRunner | null = null;
  try {
    // 初始化 DataSource
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      console.log('Database connection initialized');
    }

    // 建立 QueryRunner 並開始交易
    queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    console.log('Transaction started');

    // 建立 IdMapping 實例
    const idMapping = new IdMapping();

    // 建立 SeedService 實例
    const seedService = new SeedService();

    // 執行 seed
    await seedService.run(queryRunner.manager, idMapping, force);

    // 提交交易
    await queryRunner.commitTransaction();
    console.log('Transaction committed successfully');

    process.exit(0);
  } catch (error) {
    console.error('Seed process failed:', error);
    if (queryRunner && queryRunner.isTransactionActive) {
      await queryRunner.rollbackTransaction();
      console.log('Transaction rolled back');
    }
    process.exit(1);
  } finally {
    // 釋放 QueryRunner
    if (queryRunner) {
      await queryRunner.release();
    }

    // 關閉 DataSource
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      console.log('Database connection closed');
    }
  }
}

// 執行主函數
void main();
