import { Empresa } from 'src/empresa/entities/empresa.entity';
import { User } from 'src/users/entities/user.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Vertex } from 'src/vertices/entities/vertex.entity';
import { CustomerInformation } from 'src/customer-information/entities/customer-information.entity';

@Entity('zona')
export class Zona {
  @PrimaryGeneratedColumn()
  id_zona: number;

  @Column()
  name: string;

  @Column()
  color_fill: string;

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

  @OneToMany(() => Vertex, (vertex) => vertex.zona)
  zona: Zona[];

  @OneToMany(
    () => CustomerInformation,
    (customerInformation) => customerInformation.zona,
  )
  customerInformations: CustomerInformation[];
}
