import { Column, Entity, PrimaryGeneratedColumn, ManyToOne, Relation } from "typeorm";

import { Role } from "./role.entity";

@Entity("passwords")
export class Password {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  password: string;

  @ManyToOne(() => Role, (role) => role.passwords)
  role: Relation<Role>  
}