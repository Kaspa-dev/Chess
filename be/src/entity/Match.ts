import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, BaseEntity, OneToOne, PrimaryColumn } from "typeorm";
import { User } from "./User.js";

@Entity("matches")
export class Match extends BaseEntity {
  @PrimaryColumn({type: 'varchar', length: 255})
  MatchID!: string;

  @ManyToOne(() => User)
  @JoinColumn({name: 'firstPlayer'})
  FirstPlayer!: User

  @ManyToOne(() => User)
  @JoinColumn({name: 'secondPlayer'})
  SecondPlayer!: User

  @ManyToOne(() => User, {nullable: true})
  @JoinColumn({name: 'winner'})
  Winner!: User | null

  @Column()
  StartTime!: Date
}