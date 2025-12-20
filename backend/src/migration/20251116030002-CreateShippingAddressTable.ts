import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateShippingAddressTable20251116030002
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE ShippingAddress (
        address_id BIGINT AUTO_INCREMENT PRIMARY KEY,
        user_id BIGINT NOT NULL,
        recipient_name VARCHAR(100) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        city VARCHAR(50) NOT NULL,
        district VARCHAR(50),
        postal_code VARCHAR(10),
        address_line1 VARCHAR(255) NOT NULL,
        address_line2 VARCHAR(255),
        is_default BOOLEAN DEFAULT FALSE,
        CONSTRAINT FK_shippingaddress_user FOREIGN KEY (user_id) REFERENCES User(user_id) ON DELETE CASCADE
      )
    `);

    // -- 單一欄位索引
    await queryRunner.query(
      `CREATE INDEX IDX_shippingaddress_user_id ON ShippingAddress(user_id)`,
    );
    // -- 複合索引
    await queryRunner.query(
      `CREATE INDEX IDX_shippingaddress_user_id_is_default ON ShippingAddress(user_id, is_default)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IDX_shippingaddress_user_id ON ShippingAddress`,
    );
    await queryRunner.query(
      `DROP INDEX IDX_shippingaddress_user_id_is_default ON ShippingAddress`,
    );
    await queryRunner.query(`DROP TABLE ShippingAddress`);
  }
}
