import { Gender } from 'src/common/enums/gender.enum';
import { StatusProduct } from 'src/common/enums/statusProduct.enum';
import { Empresa } from 'src/empresa/entities/empresa.entity';
import { Image } from 'src/images/entities/image.entity';
import { ProductVariant } from 'src/product-variants/entities/product-variant.entity';
import { Type } from 'src/type/entities/type.entity';
import { User } from 'src/users/entities/user.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn()
  id_product: number;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column()
  price: number;

  // @Column()
  // imageUrl: string;

  @Column({ type: 'enum', enum: Gender, default: Gender.UNDEFINED })
  gender: Gender;

  @Column({ type: 'enum', enum: StatusProduct, default: StatusProduct.ACTIVE })
  status: StatusProduct;

  @ManyToOne(() => Type, (type) => type.products)
  @JoinColumn({ name: 'id_type' })
  type: Type;

  @OneToMany(() => ProductVariant, (productVariant) => productVariant.product)
  productVariants: ProductVariant[];

  @OneToMany(() => Image, (image) => image.product)
  images: Image[];

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
