import { Column, Entity, PrimaryGeneratedColumn, OneToMany, Relation, JoinColumn } from "typeorm";

import { User } from "./user.entity";
import { Password } from "./password.entity";

@Entity("roles")
export class Role {
  @PrimaryGeneratedColumn()
  id: number;
  
  @Column()
  name: string;

  @OneToMany(() => User, (user) => user.role)
  @JoinColumn()
  users: Relation<User>[];

  @OneToMany(() => Password, (password) => password.role)
  @JoinColumn()
  passwords: Relation<Password>[];  
}