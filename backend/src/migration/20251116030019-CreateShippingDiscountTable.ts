import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateShippingDiscountTable20251116030019 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE ShippingDiscount (
        shipping_discount_id BIGINT AUTO_INCREMENT PRIMARY KEY,
        discount_id BIGINT NOT NULL UNIQUE,
        discount_amount DECIMAL(10,2) NOT NULL,
        CONSTRAINT FK_shippingdiscount_discount FOREIGN KEY (discount_id) REFERENCES Discount(discount_id) ON DELETE CASCADE
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE ShippingDiscount`);
  }
}
