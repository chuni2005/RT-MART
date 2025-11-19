import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSeasonalDiscountTable20251116030017
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE SeasonalDiscount (
        seasonal_discount_id BIGINT AUTO_INCREMENT PRIMARY KEY,
        discount_id BIGINT NOT NULL UNIQUE,
        discount_rate DECIMAL(5,4) NOT NULL,
        max_discount_amount DECIMAL(10,2),
        CONSTRAINT FK_seasonaldiscount_discount FOREIGN KEY (discount_id) REFERENCES Discount(discount_id) ON DELETE CASCADE
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE SeasonalDiscount`);
  }
}
