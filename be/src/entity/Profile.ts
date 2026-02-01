import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, BaseEntity, OneToOne } from "typeorm";
import type { User as UserType } from "./User.js"; 
import { User } from "./User.js";

@Entity("profiles")
export class Profile extends BaseEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', unique: true, length: 64})
  nickname!: string;

  @Column({ type: "varchar", nullable: true })
  country!: string | null;

  @Column({ type: "int", nullable: true })
  rating!: number | null;

  @Column({ type: "int", nullable: true })
  wins!: number | null;

  @Column({ type: "int", nullable: true })
  losses!: number | null;

  @Column({ type: "int", nullable: true })
  draws!: number | null;

  @Column({ type: "int", nullable: true })
  puzzles!: number | null;

  @Column({ type: "varchar", nullable: true })
  avatar!: string | null;

  @OneToOne(() => User, (user) => user.profile)
  user!: UserType
}