import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSellerTimestampsAndRejection20251227000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE Seller
      ADD COLUMN rejected_at TIMESTAMP NULL,
      ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE Seller
      DROP COLUMN rejected_at,
      DROP COLUMN created_at,
      DROP COLUMN updated_at
    `);
  }
}
