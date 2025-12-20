import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateOrderDiscountTable20251116030016 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE OrderDiscount (
        order_discount_id BIGINT AUTO_INCREMENT PRIMARY KEY,
        order_id BIGINT NOT NULL,
        discount_id BIGINT NOT NULL,
        discount_type ENUM('seasonal', 'shipping', 'special') NOT NULL,
        discount_amount DECIMAL(10,2) NOT NULL,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT FK_orderdiscount_order FOREIGN KEY (order_id) REFERENCES \`Order\`(order_id) ON DELETE CASCADE,
        CONSTRAINT FK_orderdiscount_discount FOREIGN KEY (discount_id) REFERENCES Discount(discount_id) ON DELETE RESTRICT
      )
    `);

    await queryRunner.query(
      `CREATE INDEX IDX_orderdiscount_order_id ON OrderDiscount(order_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX IDX_orderdiscount_discount_id ON OrderDiscount(discount_id)`,
    );

    // -- 複合索引 (唯一約束)
    await queryRunner.query(
      `CREATE UNIQUE INDEX UQ_orderdiscount_order_id_type ON OrderDiscount(order_id, discount_type)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IDX_orderdiscount_order_id ON OrderDiscount`,
    );
    await queryRunner.query(
      `DROP INDEX IDX_orderdiscount_discount_id ON OrderDiscount`,
    );
    await queryRunner.query(
      `DROP INDEX UQ_orderdiscount_order_id_type ON OrderDiscount`,
    );
    await queryRunner.query(`DROP TABLE OrderDiscount`);
  }
}
