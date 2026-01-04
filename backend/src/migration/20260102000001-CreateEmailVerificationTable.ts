import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateEmailVerificationTable20260102000001
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'EmailVerification',
        columns: [
          {
            name: 'verification_id',
            type: 'bigint',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'email',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'code_hash',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'purpose',
            type: 'enum',
            enum: ['registration', 'password_reset'],
            default: "'registration'",
            isNullable: false,
          },
          {
            name: 'metadata',
            type: 'json',
            isNullable: true,
          },
          {
            name: 'expires_at',
            type: 'timestamp',
            isNullable: false,
          },
          {
            name: 'is_used',
            type: 'boolean',
            default: false,
            isNullable: false,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
        ],
      }),
      true,
    );

    // Create indexes
    await queryRunner.createIndex(
      'EmailVerification',
      new TableIndex({
        name: 'IDX_email_verification_email',
        columnNames: ['email'],
      }),
    );

    await queryRunner.createIndex(
      'EmailVerification',
      new TableIndex({
        name: 'IDX_email_verification_expires_at',
        columnNames: ['expires_at'],
      }),
    );

    await queryRunner.createIndex(
      'EmailVerification',
      new TableIndex({
        name: 'IDX_email_verification_email_created_at',
        columnNames: ['email', 'created_at'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes first
    await queryRunner.dropIndex(
      'EmailVerification',
      'IDX_email_verification_email_created_at',
    );
    await queryRunner.dropIndex(
      'EmailVerification',
      'IDX_email_verification_expires_at',
    );
    await queryRunner.dropIndex(
      'EmailVerification',
      'IDX_email_verification_email',
    );

    // Drop table
    await queryRunner.dropTable('EmailVerification');
  }
}
