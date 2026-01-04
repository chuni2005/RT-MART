import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum VerificationPurpose {
  REGISTRATION = 'registration',
  PASSWORD_RESET = 'password_reset',
}

@Entity('EmailVerification')
@Index(['email'])
@Index(['expiresAt'])
@Index(['email', 'createdAt'])
export class EmailVerification {
  @PrimaryGeneratedColumn({ name: 'verification_id', type: 'bigint' })
  verificationId: string;

  @Column({ type: 'varchar', length: 100 })
  email: string;

  @Column({ name: 'code_hash', type: 'varchar', length: 255 })
  codeHash: string;

  @Column({
    type: 'enum',
    enum: VerificationPurpose,
    default: VerificationPurpose.REGISTRATION,
  })
  purpose: VerificationPurpose;

  @Column({ type: 'json', nullable: true })
  metadata: any;

  @Column({ name: 'expires_at', type: 'timestamp' })
  expiresAt: Date;

  @Column({ name: 'is_used', type: 'boolean', default: false })
  isUsed: boolean;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date;
}
