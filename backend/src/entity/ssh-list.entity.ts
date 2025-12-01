// ssh-list.entity.ts
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class SshList {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  address: string;

  @Column()
  port: string;

  @Column()
  username: string;

  // @Column()
  // ssh_key: string;
  @Column()
  password: string;

  @Column({ nullable: true })
  passphrase: string;

  @Column({ default: 0 })
  userGroup: number;

  @Column({ default: 0 })
  ulimit: number;

  @Column({ default: 0 })
  securityLimits: number;

  @Column({ default: 0 })
  sysctl: number;

  @Column({ default: 0 })
  jvm: number;

  @Column({ default: 0 })
  threadPool: number;

  @Column({ default: 0 })
  garbageCollector: number;
}
