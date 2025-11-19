import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateProductTable20251116030007 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE Product (
        product_id BIGINT AUTO_INCREMENT PRIMARY KEY,
        store_id BIGINT NOT NULL,
        product_type_id BIGINT NOT NULL,
        product_name VARCHAR(200) NOT NULL,
        description TEXT,
        price DECIMAL(10,2) NOT NULL,
        view_count BIGINT DEFAULT 0,
        average_rating DECIMAL(2,1) DEFAULT 0.0,
        total_reviews INT DEFAULT 0,
        deleted_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT FK_product_store FOREIGN KEY (store_id) REFERENCES Store(store_id) ON DELETE RESTRICT,
        CONSTRAINT FK_product_producttype FOREIGN KEY (product_type_id) REFERENCES ProductType(product_type_id) ON DELETE RESTRICT
      )
    `);

    // -- 單一欄位索引
    await queryRunner.query(
      `CREATE INDEX IDX_product_store_id ON Product(store_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX IDX_product_product_type_id ON Product(product_type_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX IDX_product_product_name ON Product(product_name)`,
    );

    // -- 複合索引
    await queryRunner.query(
      `CREATE INDEX IDX_product_store_id_product_type_id ON Product(store_id, product_type_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX IDX_product_price_deleted_at ON Product(price, deleted_at)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IDX_product_store_id ON Product`);
    await queryRunner.query(
      `DROP INDEX IDX_product_product_type_id ON Product`,
    );
    await queryRunner.query(`DROP INDEX IDX_product_product_name ON Product`);
    await queryRunner.query(
      `DROP INDEX IDX_product_store_id_product_type_id ON Product`,
    );
    await queryRunner.query(
      `DROP INDEX IDX_product_price_deleted_at ON Product`,
    );
    await queryRunner.query(`DROP TABLE Product`);
  }
}
