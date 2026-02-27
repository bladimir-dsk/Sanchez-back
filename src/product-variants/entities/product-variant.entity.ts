import { Color } from 'src/colors/entities/color.entity';
import { StatusProduct } from 'src/common/enums/statusProduct.enum';
import { Empresa } from 'src/empresa/entities/empresa.entity';
import { Product } from 'src/products/entities/product.entity';
import { Size } from 'src/sizes/entities/size.entity';
import { User } from 'src/users/entities/user.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('product_variant')
export class ProductVariant {
  @PrimaryGeneratedColumn()
  id_product_variant: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column()
  stock: number;

  @Column({ type: 'enum', enum: StatusProduct, default: StatusProduct.ACTIVE })
  status: StatusProduct;

  @ManyToOne(() => Product, (product) => product.productVariants)
  @JoinColumn({ name: 'id_product' })
  product: Product;

  @ManyToOne(() => Color, (color) => color.productVariants)
  @JoinColumn({ name: 'id_color' })
  color: Color;

  @ManyToOne(() => Size, (size) => size.productVariants)
  @JoinColumn({ name: 'id_size' })
  size: Size;

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
