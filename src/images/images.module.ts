import { Module } from '@nestjs/common';
import { ImagesService } from './images.service';
import { ImagesController } from './images.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Image } from './entities/image.entity';
import { User } from 'src/users/entities/user.entity';
import { Empresa } from 'src/empresa/entities/empresa.entity';
import { Product } from 'src/products/entities/product.entity';
import { SupabaseModule } from 'src/common/supabase/supabase.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Image, User, Empresa, Product]),
    SupabaseModule,
  ],
  controllers: [ImagesController],
  providers: [ImagesService],
  exports: [ImagesService],
})
export class ImagesModule {}
