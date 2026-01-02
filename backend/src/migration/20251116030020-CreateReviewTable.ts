import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateReviewTable20251116030020 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE Review (
        review_id BIGINT AUTO_INCREMENT PRIMARY KEY,
        product_id BIGINT NOT NULL,
        user_id BIGINT NOT NULL,
        rating INT NOT NULL,
        comment TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT FK_review_product FOREIGN KEY (product_id) REFERENCES Product(product_id) ON DELETE CASCADE,
        CONSTRAINT FK_review_user FOREIGN KEY (user_id) REFERENCES User(user_id) ON DELETE CASCADE
      )
    `);

    await queryRunner.query(
      `CREATE INDEX IDX_review_product_id ON Review(product_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX IDX_review_user_id ON Review(user_id)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IDX_review_product_id ON Review`);
    await queryRunner.query(`DROP INDEX IDX_review_user_id ON Review`);
    await queryRunner.query(`DROP TABLE Review`);
  }
}
