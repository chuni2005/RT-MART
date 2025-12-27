import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCartItemTable20251116030012 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE CartItem (
        cart_item_id BIGINT AUTO_INCREMENT PRIMARY KEY,
        user_id BIGINT NOT NULL,
        product_id BIGINT NOT NULL,
        quantity INT NOT NULL,
        selected BOOLEAN DEFAULT TRUE,
        added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT FK_cartitem_user FOREIGN KEY (user_id) REFERENCES User(user_id) ON DELETE CASCADE,
        CONSTRAINT FK_cartitem_product FOREIGN KEY (product_id) REFERENCES Product(product_id) ON DELETE RESTRICT
      )
    `);

    // --單一欄位索引
    await queryRunner.query(
      `CREATE INDEX IDX_cartitem_user_id ON CartItem(user_id)`,
    );

    // --複合索引(唯一約束：同一個 user 對同一個 product 只能有一筆)
    await queryRunner.query(
      `CREATE UNIQUE INDEX UQ_cartitem_user_id_product_id ON CartItem(user_id, product_id)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IDX_cartitem_user_id ON CartItem`);
    await queryRunner.query(
      `DROP INDEX UQ_cartitem_user_id_product_id ON CartItem`,
    );
    await queryRunner.query(`DROP TABLE CartItem`);
  }
}