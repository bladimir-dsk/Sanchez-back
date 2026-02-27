import { Module } from '@nestjs/common';
import { ProductVariantsService } from './product-variants.service';
import { ProductVariantsController } from './product-variants.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductVariant } from './entities/product-variant.entity';
import { User } from 'src/users/entities/user.entity';
import { Empresa } from 'src/empresa/entities/empresa.entity';
import { Product } from 'src/products/entities/product.entity';
import { Type } from 'src/type/entities/type.entity';
import { Category } from 'src/category/entities/category.entity';
import { Color } from 'src/colors/entities/color.entity';
import { Size } from 'src/sizes/entities/size.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProductVariant,
      User,
      Empresa,
      Product,
      Type,
      Category,
      Color,
      Size,
    ]),
  ],
  controllers: [ProductVariantsController],
  providers: [ProductVariantsService],
  exports: [ProductVariantsService],
})
export class ProductVariantsModule {}
