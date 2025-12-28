import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateStoreTable20251116030005 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE Store (
        store_id BIGINT AUTO_INCREMENT PRIMARY KEY,
        seller_id BIGINT NOT NULL,
        store_name VARCHAR(200) NOT NULL,
        store_description TEXT,
        store_address TEXT,
        store_email VARCHAR(100),
        store_phone VARCHAR(20),
        store_avatar VARCHAR(255),
        average_rating DECIMAL(2,1) DEFAULT 0.0,
        total_ratings INT DEFAULT 0,
        product_count INT DEFAULT 0,
        deleted_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT FK_store_seller FOREIGN KEY (seller_id) REFERENCES Seller(seller_id) ON DELETE RESTRICT
      )
    `);

    // -- 單一欄位索引
    await queryRunner.query(
      `CREATE INDEX IDX_store_seller_id ON Store(seller_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX IDX_store_store_name ON Store(store_name)`,
    );

    // -- 複合索引 (for active stores ranking)
    await queryRunner.query(
      `CREATE INDEX IDX_store_deleted_at_average_rating ON Store(deleted_at, average_rating)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IDX_store_seller_id ON Store`);
    await queryRunner.query(`DROP INDEX IDX_store_store_name ON Store`);
    await queryRunner.query(
      `DROP INDEX IDX_store_deleted_at_average_rating ON Store`,
    );
    await queryRunner.query(`DROP TABLE Store`);
  }
}
