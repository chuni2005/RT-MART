import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateOrderTable20251116030013 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 建立 ENUM 型別 (MariaDB/MySQL 支援 ENUM)
    await queryRunner.query(`
      CREATE TABLE \`Order\` (
        order_id BIGINT AUTO_INCREMENT PRIMARY KEY,
        order_number VARCHAR(50) NOT NULL UNIQUE,
        user_id BIGINT NOT NULL,
        store_id BIGINT NOT NULL,
        order_status ENUM(
          'pending_payment',
          'payment_failed',
          'paid',
          'processing',
          'shipped',
          'delivered',
          'completed',
          'cancelled'
        ) NOT NULL DEFAULT 'pending_payment',
        subtotal DECIMAL(10,2) NOT NULL,
        shipping_fee DECIMAL(10,2) NOT NULL DEFAULT 60,
        total_discount DECIMAL(10,2) DEFAULT 0,
        total_amount DECIMAL(10,2) NOT NULL,
        payment_method VARCHAR(50),
        payment_reference VARCHAR(255),
        idempotency_key VARCHAR(128) UNIQUE,
        shipping_address_snapshot JSON NOT NULL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        paid_at TIMESTAMP NULL,
        shipped_at TIMESTAMP NULL,
        delivered_at TIMESTAMP NULL,
        completed_at TIMESTAMP NULL,
        cancelled_at TIMESTAMP NULL,
        CONSTRAINT FK_order_user FOREIGN KEY (user_id) REFERENCES User(user_id) ON DELETE RESTRICT,
        CONSTRAINT FK_order_store FOREIGN KEY (store_id) REFERENCES Store(store_id) ON DELETE RESTRICT
      )
    `);

    // -- 單一欄位索引
    await queryRunner.query(
      `CREATE INDEX IDX_order_order_number ON \`Order\`(order_number)`,
    );
    await queryRunner.query(
      `CREATE INDEX IDX_order_user_id ON \`Order\`(user_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX IDX_order_store_id ON \`Order\`(store_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX IDX_order_order_status ON \`Order\`(order_status)`,
    );
    await queryRunner.query(
      `CREATE INDEX IDX_order_idempotency_key ON \`Order\`(idempotency_key)`,
    );
    await queryRunner.query(
      `CREATE INDEX IDX_order_created_at ON \`Order\`(created_at)`,
    );

    // -- 複合索引
    await queryRunner.query(
      `CREATE INDEX IDX_order_user_id_created_at ON \`Order\`(user_id, created_at)`,
    );
    await queryRunner.query(
      `CREATE INDEX IDX_order_store_id_created_at ON \`Order\`(store_id, created_at)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IDX_order_order_number ON \`Order\``);
    await queryRunner.query(`DROP INDEX IDX_order_user_id ON \`Order\``);
    await queryRunner.query(`DROP INDEX IDX_order_store_id ON \`Order\``);
    await queryRunner.query(`DROP INDEX IDX_order_order_status ON \`Order\``);
    await queryRunner.query(
      `DROP INDEX IDX_order_idempotency_key ON \`Order\``,
    );
    await queryRunner.query(`DROP INDEX IDX_order_created_at ON \`Order\``);
    await queryRunner.query(
      `DROP INDEX IDX_order_user_id_created_at ON \`Order\``,
    );
    await queryRunner.query(
      `DROP INDEX IDX_order_store_id_created_at ON \`Order\``,
    );
    await queryRunner.query(`DROP TABLE \`Order\``);
  }
}
