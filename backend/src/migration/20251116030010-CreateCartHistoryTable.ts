import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCartHistoryTable20251116030010 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE CartHistory (
        cart_history_id BIGINT AUTO_INCREMENT PRIMARY KEY,
        user_id BIGINT NOT NULL,
        cart_snapshot JSON NOT NULL,
        item_count INT NOT NULL,
        order_ids JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT FK_carthistory_user FOREIGN KEY (user_id) REFERENCES User(user_id) ON DELETE CASCADE
      )
    `);

    // -- 單一欄位索引
    await queryRunner.query(
      `CREATE INDEX IDX_carthistory_user_id ON CartHistory(user_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX IDX_carthistory_created_at ON CartHistory(created_at)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IDX_carthistory_user_id ON CartHistory`,
    );
    await queryRunner.query(
      `DROP INDEX IDX_carthistory_created_at ON CartHistory`,
    );
    await queryRunner.query(`DROP TABLE CartHistory`);
  }
}
