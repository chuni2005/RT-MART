import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateAvatarUrlLength20250105000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE User MODIFY COLUMN avatar_url VARCHAR(500) NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE User MODIFY COLUMN avatar_url VARCHAR(255) NULL
    `);
  }
}
