import { Empresa } from 'src/empresa/entities/empresa.entity';
import { User } from 'src/users/entities/user.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('color')
export class Color {
  @PrimaryGeneratedColumn()
  id_color: number;

  @Column()
  name: string;

  @Column()
  hex_code: string;

  @ManyToOne(() => User, (user) => user.customerInformations)
  // @JoinColumn({ name: 'userEmail', referencedColumnName: 'email' })
  @JoinColumn({ name: 'id_user', referencedColumnName: 'id' })
  user: User;

  @Column()
  userEmail: string;

  @Column()
  id_user: number;

  @ManyToOne(() => Empresa, (empresa) => empresa.id_empresa)
  @JoinColumn({ name: 'id_empresa' })
  empresa: Empresa;
}
