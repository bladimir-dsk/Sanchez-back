import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { Empresa } from 'src/empresa/entities/empresa.entity';
import { User } from 'src/users/entities/user.entity';
import { Type } from 'src/type/entities/type.entity';
import { Category } from 'src/category/entities/category.entity';
import { SupabaseModule } from 'src/common/supabase/supabase.module';
import { ProductVariant } from 'src/product-variants/entities/product-variant.entity';
import { Image } from 'src/images/entities/image.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Product,
      Empresa,
      User,
      Type,
      Category,
      ProductVariant,
      Image,
    ]),
    SupabaseModule,
  ],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
