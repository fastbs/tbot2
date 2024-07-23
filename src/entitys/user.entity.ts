import { Column, Entity, PrimaryGeneratedColumn, ManyToOne, Relation } from "typeorm";

import { Role } from "./role.entity";

@Entity("users")
export class User {
  @PrimaryGeneratedColumn()
  id: number;
  
  @Column()
  uid: number;

  @Column()
  name: string;

  @Column()
  username: string;

  @ManyToOne(() => Role, (role) => role.users)
  role: Relation<Role>  
}