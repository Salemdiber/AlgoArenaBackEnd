import {
  Entity,
  Column,
  ObjectIdColumn,
} from 'typeorm';

export enum Role {
  Player = 'Player',
  Admin = 'Admin',
}
@Entity()
export class User {
  @ObjectIdColumn()
  userId: string;

  @Column()
  username: string;

  @Column()
  passwordHash: string;

  @Column()
  email: string;

  @Column({
    type: 'enum',
    enum: Role,
    default: Role.Player,
  })
  role: Role;

  @Column({ nullable: true })
  avatar: string | null;

  @Column({ nullable: true })
  bio: string | null;

  @Column({ default: true })
  status: boolean;

  @Column({ default: false })
  twoFactorEnabled: boolean;

  @Column({ type: 'varchar', nullable: true })
  twoFactorMethod: 'email' | 'sms' | null;

  @Column({ nullable: true })
  twoFactorCode: string | null;

  @Column({ type: 'timestamp', nullable: true })
  twoFactorCodeExpires: Date | null;

  @Column({ nullable: true })
  phoneNumber: string | null;
}