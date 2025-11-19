import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSellerTable20251116030004 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE Seller (
        seller_id BIGINT AUTO_INCREMENT PRIMARY KEY,
        user_id BIGINT NOT NULL UNIQUE,
        bank_account_reference VARCHAR(255),
        verified BOOLEAN DEFAULT FALSE,
        verified_at TIMESTAMP NULL,
        verified_by BIGINT NULL,
        CONSTRAINT FK_seller_user FOREIGN KEY (user_id) REFERENCES User(user_id) ON DELETE CASCADE,
        CONSTRAINT FK_seller_verified_by FOREIGN KEY (verified_by) REFERENCES User(user_id) ON DELETE SET NULL
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE Seller`);
  }
}
