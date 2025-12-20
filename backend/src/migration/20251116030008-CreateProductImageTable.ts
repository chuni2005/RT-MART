import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateProductImageTable20251116030008
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE ProductImage (
        image_id BIGINT AUTO_INCREMENT PRIMARY KEY,
        product_id BIGINT NOT NULL,
        image_url VARCHAR(500) NOT NULL,
        public_id VARCHAR(50) NOT NULL,
        display_order INT NOT NULL DEFAULT 1,
        CONSTRAINT FK_productimage_product FOREIGN KEY (product_id) REFERENCES Product(product_id) ON DELETE CASCADE
      )
    `);

    // -- 單一欄位索引
    await queryRunner.query(
      `CREATE INDEX IDX_productimage_product_id ON ProductImage(product_id)`,
    );

    // -- 複合索引
    await queryRunner.query(
      `CREATE INDEX IDX_productimage_product_id_display_order ON ProductImage(product_id, display_order)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IDX_productimage_product_id ON ProductImage`,
    );
    await queryRunner.query(
      `DROP INDEX IDX_productimage_product_id_display_order ON ProductImage`,
    );
    await queryRunner.query(`DROP TABLE ProductImage`);
  }
}
