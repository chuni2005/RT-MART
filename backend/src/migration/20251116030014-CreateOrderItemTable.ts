import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateOrderItemTable20251116030014 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE OrderItem (
        order_item_id BIGINT AUTO_INCREMENT PRIMARY KEY,
        order_id BIGINT NOT NULL,
        product_id BIGINT NULL,
        product_snapshot JSON NOT NULL,
        quantity INT NOT NULL,
        original_price DECIMAL(10,2) NOT NULL,
        item_discount DECIMAL(10,2) DEFAULT 0,
        unit_price DECIMAL(10,2) NOT NULL,
        subtotal DECIMAL(10,2) NOT NULL,
        CONSTRAINT FK_orderitem_order FOREIGN KEY (order_id) REFERENCES \`Order\`(order_id) ON DELETE CASCADE,
        CONSTRAINT FK_orderitem_product FOREIGN KEY (product_id) REFERENCES Product(product_id) ON DELETE SET NULL
      )
    `);

    // -- 單一欄位索引
    await queryRunner.query(
      `CREATE INDEX IDX_orderitem_order_id ON OrderItem(order_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX IDX_orderitem_product_id ON OrderItem(product_id)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IDX_orderitem_order_id ON OrderItem`);
    await queryRunner.query(`DROP INDEX IDX_orderitem_product_id ON OrderItem`);
    await queryRunner.query(`DROP TABLE OrderItem`);
  }
}
