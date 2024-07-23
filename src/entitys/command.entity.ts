import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("commands")
export class Command {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  roles: string;

  @Column()
  name: string;

  @Column()
  label: string;
}
