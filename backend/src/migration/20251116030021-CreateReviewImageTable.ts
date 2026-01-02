import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateReviewImageTable20251116030021 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE ReviewImage (
        review_image_id BIGINT AUTO_INCREMENT PRIMARY KEY,
        review_id BIGINT NOT NULL,
        image_url VARCHAR(500) NULL,
        public_id VARCHAR(50) NULL,
        display_order INT DEFAULT 1,
        CONSTRAINT FK_reviewimage_review FOREIGN KEY (review_id) REFERENCES Review(review_id) ON DELETE CASCADE
      )
    `);

    await queryRunner.query(
      `CREATE INDEX IDX_reviewimage_review_id ON ReviewImage(review_id)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IDX_reviewimage_review_id ON ReviewImage`,
    );
    await queryRunner.query(`DROP TABLE ReviewImage`);
  }
}
