import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Staff } from './staff.entity';

@Entity('stores')
export class Store {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 20 })
  phone: string;

  @Column({ length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  address: string;

  @Column({ length: 255, nullable: true })
  owner_name: string;

  @Column({ type: 'text', nullable: true })
  avatar_url: string;

  @Column({ length: 20, default: 'free' })
  plan: string;

  @Column({ default: true })
  is_active: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  @OneToMany(() => Staff, (staff) => staff.store)
  staff: Staff[];
}