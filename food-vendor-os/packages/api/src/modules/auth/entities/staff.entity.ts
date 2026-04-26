import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Store } from './store.entity';

@Entity('staff')
export class Staff {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // store_id is managed by @ManyToOne relation below
  // No need for separate @Column

  @Column({ length: 20 })
  phone: string;

  @Column({ length: 255 })
  name: string;

  @Column({ length: 20, default: 'staff' })
  role: string; // owner, manager, staff

  @Column({ length: 6, nullable: true })
  pin_code: string;

  @Column({ default: true })
  is_active: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @ManyToOne(() => Store, (store) => store.staff, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'store_id' })
  store: Store;

  // Virtual property to easily access store_id
  get store_id(): string {
    return (this.store as any)?.id;
  }
}