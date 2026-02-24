import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { Repository } from 'typeorm';
import { Empresa } from 'src/empresa/entities/empresa.entity';
import { Type } from 'src/type/entities/type.entity';
import { SupabaseClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';
import { UserActiveInterface } from 'src/common/interfaces/user-active.interface';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Empresa)
    private readonly empresaRepository: Repository<Empresa>,
    @InjectRepository(Type)
    private readonly typeRepository: Repository<Type>,
    @Inject('SUPABASE')
    private readonly supabase: SupabaseClient,
    private readonly configService: ConfigService,
  ) {}

  private getPublicUrl(path: string) {
    const bucket = this.configService.get<string>('SUPABASE_BUCKET');
    const { data } = this.supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  }

  async create(
    createProductDto: CreateProductDto,
    file: Express.Multer.File,
    user: UserActiveInterface,
  ) {
    const empresa = await this.empresaRepository.findOne({
      where: { id_empresa: user.id_empresa },
    });

    if (!empresa) {
      throw new BadRequestException('Empresa no encontrada');
    }

    if (!file) {
      throw new BadRequestException('Imagen requerida');
    }

    const bucket = this.configService.get<string>('SUPABASE_BUCKET');
    const filePath = `products/${Date.now()}-${file.originalname}`;

    const { error } = await this.supabase.storage
      .from(bucket)
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
      });

    if (error) {
      throw new BadRequestException(error.message);
    }

    const type = await this.typeRepository.findOne({
      where: {
        id_type: createProductDto.id_type,
        empresa: { id_empresa: user.id_empresa },
      },
    });

    if (!type) {
      throw new BadRequestException('Tipo no encontrado');
    }

    const newProduct = this.productRepository.create({
      ...createProductDto,
      imageUrl: filePath,
      type,
      empresa,
      userEmail: user.email,
      user: { id: user.id },
    });

    const saved = await this.productRepository.save(newProduct);

    // devolver con URL completa
    saved.imageUrl = this.getPublicUrl(saved.imageUrl);

    return saved;
  }

  async findAll() {
    const products = await this.productRepository.find({
      relations: ['type'],
    });

    return products.map((product) => ({
      ...product,
      imageUrl: this.getPublicUrl(product.imageUrl),
    }));
  }

  async findOne(id: number) {
    const product = await this.productRepository.findOne({
      where: { id_product: id },
      relations: ['type'],
    });

    if (!product) {
      throw new BadRequestException('Producto no encontrado');
    }

    product.imageUrl = this.getPublicUrl(product.imageUrl);

    return product;
  }

  async update(
    id: number,
    updateProductDto: UpdateProductDto,
    file: Express.Multer.File,
    user: UserActiveInterface,
  ) {
    const product = await this.productRepository.findOne({
      where: { id_product: id },
      relations: ['type'],
    });

    if (!product) {
      throw new BadRequestException('Producto no encontrado');
    }

    const bucket = this.configService.get<string>('SUPABASE_BUCKET');

    if (file) {
      if (product.imageUrl) {
        await this.supabase.storage.from(bucket).remove([product.imageUrl]);
      }

      const newFilePath = `products/${Date.now()}-${file.originalname}`;

      const { error } = await this.supabase.storage
        .from(bucket)
        .upload(newFilePath, file.buffer, {
          contentType: file.mimetype,
        });

      if (error) {
        throw new BadRequestException(error.message);
      }

      product.imageUrl = newFilePath;
    }

    if (updateProductDto.id_type) {
      const type = await this.typeRepository.findOne({
        where: {
          id_type: updateProductDto.id_type,
          empresa: { id_empresa: user.id_empresa },
        },
      });

      if (!type) {
        throw new BadRequestException('Tipo no encontrado');
      }

      product.type = type;
    }

    Object.assign(product, updateProductDto);

    product.userEmail = user.email;
    product.id_user = user.id;

    const updated = await this.productRepository.save(product);

    updated.imageUrl = this.getPublicUrl(updated.imageUrl);

    return updated;
  }

  async remove(id: number) {
    const product = await this.productRepository.findOne({
      where: { id_product: id },
    });

    if (!product) {
      throw new BadRequestException('Producto no encontrado');
    }

    const bucket = this.configService.get<string>('SUPABASE_BUCKET');

    // eliminar imagen en supabase
    if (product.imageUrl) {
      await this.supabase.storage.from(bucket).remove([product.imageUrl]);
    }

    await this.productRepository.remove(product);

    return {
      message: 'Producto eliminado correctamente',
    };
  }
}
