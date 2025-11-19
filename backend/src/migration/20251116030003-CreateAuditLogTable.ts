import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAuditLogTable20251116030003 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE AuditLog (
        audit_id BIGINT AUTO_INCREMENT PRIMARY KEY,
        event_id CHAR(36) NOT NULL UNIQUE,
        event_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        table_name VARCHAR(100) NOT NULL,
        record_id BIGINT NOT NULL,
        action VARCHAR(20) NOT NULL,
        user_id BIGINT,
        request_id VARCHAR(128),
        ip_address VARCHAR(45), -- MariaDB/MySQL 沒有原生 inet 型別，通常用 VARCHAR(45) 儲存 IPv4/IPv6
        user_agent TEXT,
        service_name VARCHAR(50),
        old_data JSON,
        new_data JSON,
        changes JSON,
        checksum VARCHAR(64),
        CONSTRAINT FK_auditlog_user FOREIGN KEY (user_id) REFERENCES User(user_id) ON DELETE SET NULL
      )
    `);

    // -- 單一欄位索引
    await queryRunner.query(
      `CREATE INDEX IDX_auditlog_event_id ON AuditLog(event_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX IDX_auditlog_user_id ON AuditLog(user_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX IDX_auditlog_event_timestamp ON AuditLog(event_timestamp)`,
    );
    await queryRunner.query(
      `CREATE INDEX IDX_auditlog_request_id ON AuditLog(request_id)`,
    );

    // -- 複合索引
    await queryRunner.query(
      `CREATE INDEX IDX_auditlog_table_record ON AuditLog(table_name, record_id)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IDX_auditlog_event_id ON AuditLog`);
    await queryRunner.query(`DROP INDEX IDX_auditlog_user_id ON AuditLog`);
    await queryRunner.query(
      `DROP INDEX IDX_auditlog_event_timestamp ON AuditLog`,
    );
    await queryRunner.query(`DROP INDEX IDX_auditlog_request_id ON AuditLog`);
    await queryRunner.query(`DROP INDEX IDX_auditlog_table_record ON AuditLog`);
    await queryRunner.query(`DROP TABLE AuditLog`);
  }
}
