import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateProductTypeTable20251116030006
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE ProductType (
        product_type_id BIGINT AUTO_INCREMENT PRIMARY KEY,
        type_code VARCHAR(50) NOT NULL UNIQUE,
        type_name VARCHAR(100) NOT NULL,
        parent_type_id BIGINT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        CONSTRAINT FK_producttype_parent FOREIGN KEY (parent_type_id) REFERENCES ProductType(product_type_id) ON DELETE CASCADE
      )
    `);

    // -- 單一欄位索引
    await queryRunner.query(
      `CREATE INDEX IDX_producttype_type_code ON ProductType(type_code)`,
    );
    await queryRunner.query(
      `CREATE INDEX IDX_producttype_parent_type_id ON ProductType(parent_type_id)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IDX_producttype_type_code ON ProductType`,
    );
    await queryRunner.query(
      `DROP INDEX IDX_producttype_parent_type_id ON ProductType`,
    );
    await queryRunner.query(`DROP TABLE ProductType`);
  }
}
