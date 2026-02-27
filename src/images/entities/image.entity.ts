import { Empresa } from 'src/empresa/entities/empresa.entity';
import { Product } from 'src/products/entities/product.entity';
import { User } from 'src/users/entities/user.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('images')
export class Image {
  @PrimaryGeneratedColumn()
  id_image: number;

  @Column()
  url: string;

  @Column()
  is_main: boolean;

  @ManyToOne(() => Product, (product) => product.images)
  @JoinColumn({ name: 'id_product' })
  product: Product;

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
