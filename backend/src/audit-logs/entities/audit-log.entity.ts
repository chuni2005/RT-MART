import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  BeforeInsert,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import * as crypto from 'crypto';

@Entity('AuditLog')
@Index(['eventId'])
@Index(['tableName', 'recordId'])
@Index(['userId'])
@Index(['eventTimestamp'])
@Index(['requestId'])
export class AuditLog {
  @PrimaryGeneratedColumn({ name: 'audit_id', type: 'bigint' })
  auditId: string;

  @Column({ name: 'event_id', type: 'char', length: 36, unique: true })
  eventId: string;

  @Column({
    name: 'event_timestamp',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  eventTimestamp: Date;

  @Column({ name: 'table_name', type: 'varchar', length: 100 })
  tableName: string;

  @Column({ name: 'record_id', type: 'bigint' })
  recordId: string;

  @Column({ type: 'varchar', length: 20 })
  action: string;

  @Column({ name: 'user_id', type: 'bigint', nullable: true })
  userId: string | null;

  // Request tracking
  @Column({
    name: 'request_id',
    type: 'varchar',
    length: 128,
    nullable: true,
    comment: 'API request ID',
  })
  requestId: string | null;

  @Column({
    name: 'ip_address',
    type: 'varchar',
    length: 45,
    nullable: true,
    comment: 'IP address (IPv4 or IPv6)',
  })
  ipAddress: string | null;

  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent: string | null;

  @Column({
    name: 'service_name',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  serviceName: string | null;

  // Data changes
  @Column({ name: 'old_data', type: 'json', nullable: true })
  oldData: object | null;

  @Column({ name: 'new_data', type: 'json', nullable: true })
  newData: object | null;

  @Column({
    name: 'changes',
    type: 'json',
    nullable: true,
    comment: '計算出的變更差異',
  })
  changes: object | null;

  // Tamper protection
  @Column({
    name: 'checksum',
    type: 'varchar',
    length: 64,
    nullable: true,
    comment: 'SHA-256 of concatenated fields',
  })
  checksum: string | null;

  // Relations
  @ManyToOne(() => User, (user) => user.auditLogs, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'user_id' })
  user?: User;

  // Auto-generate event_id and checksum before insert
  @BeforeInsert()
  generateEventIdAndChecksum() {
    // Generate UUID if not provided
    if (!this.eventId) {
      this.eventId = crypto.randomUUID();
    }

    // Set event timestamp if not provided
    if (!this.eventTimestamp) {
      this.eventTimestamp = new Date();
    }

    // Calculate changes if both old and new data exist
    if (this.oldData && this.newData) {
      this.changes = this.calculateChanges(
        this.oldData as Record<string, unknown>,
        this.newData as Record<string, unknown>,
      );
    }

    // Generate checksum
    this.checksum = this.generateChecksum();
  }

  private calculateChanges(
    oldData: Record<string, unknown>,
    newData: Record<string, unknown>,
  ): object {
    const changes: Record<string, { old: unknown; new: unknown }> = {};

    const allKeys = new Set([...Object.keys(oldData), ...Object.keys(newData)]);

    allKeys.forEach((key) => {
      const oldValue = oldData[key];
      const newValue = newData[key];

      if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        changes[key] = { old: oldValue, new: newValue };
      }
    });

    return changes;
  }

  private generateChecksum(): string {
    // Include ALL fields that should be protected from tampering
    const data = [
      this.eventId,
      this.eventTimestamp?.toISOString(),
      this.tableName,
      this.recordId,
      this.action,
      this.userId ?? '',
      this.requestId ?? '',
      this.ipAddress ?? '',
      this.userAgent ?? '',
      this.serviceName ?? '',
      JSON.stringify(this.oldData ?? {}),
      JSON.stringify(this.newData ?? {}),
      JSON.stringify(this.changes ?? {}),
    ].join('|');

    return crypto.createHash('sha256').update(data).digest('hex');
  }

  // Verify checksum integrity
  verifyChecksum(): boolean {
    const currentChecksum = this.checksum;
    const calculatedChecksum = this.generateChecksum();
    return currentChecksum === calculatedChecksum;
  }
}
