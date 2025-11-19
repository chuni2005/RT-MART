import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateInventoryTable20251116030009 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE Inventory (
        inventory_id BIGINT AUTO_INCREMENT PRIMARY KEY,
        product_id BIGINT NOT NULL UNIQUE,
        quantity INT NOT NULL DEFAULT 0,
        reserved INT NOT NULL DEFAULT 0,
        last_updated TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT FK_inventory_product FOREIGN KEY (product_id) REFERENCES Product(product_id) ON DELETE CASCADE
      )
    `);

    // -- 單一欄位索引
    await queryRunner.query(
      `CREATE INDEX IDX_inventory_product_id ON Inventory(product_id)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IDX_inventory_product_id ON Inventory`);
    await queryRunner.query(`DROP TABLE Inventory`);
  }
}
