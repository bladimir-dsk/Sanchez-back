import { Empresa } from 'src/empresa/entities/empresa.entity';
import { ProductVariant } from 'src/product-variants/entities/product-variant.entity';
import { User } from 'src/users/entities/user.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
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

  @OneToMany(() => ProductVariant, (productVariant) => productVariant.color)
  productVariants: ProductVariant[];

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
