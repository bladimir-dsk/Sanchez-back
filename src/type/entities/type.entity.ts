import { Category } from 'src/category/entities/category.entity';
import { Empresa } from 'src/empresa/entities/empresa.entity';
import { Product } from 'src/products/entities/product.entity';
import { User } from 'src/users/entities/user.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('type')
export class Type {
  @PrimaryGeneratedColumn()
  id_type: number;

  @Column()
  name: string;

  @ManyToOne(() => Category, (category) => category.types)
  @JoinColumn({ name: 'id_category' })
  category: Category;

  @OneToMany(() => Product, (product) => product.type)
  products: Product[];

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
