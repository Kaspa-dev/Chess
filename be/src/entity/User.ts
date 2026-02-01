import { Entity, PrimaryGeneratedColumn, Column, BaseEntity, JoinColumn, OneToOne } from "typeorm";
import { Profile } from "./Profile.js";

@Entity("users")
export class User extends BaseEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({type: "varchar", unique: true, length: 254})
  email!: string;

  @Column({type: "varchar", length: 254})
  password!: string;

  @OneToOne(() => Profile, (profile) => profile.user) 
  @JoinColumn()
  profile!: Profile
}