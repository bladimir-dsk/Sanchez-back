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
import { ProductVariant } from 'src/product-variants/entities/product-variant.entity';
import { Gender } from 'src/common/enums/gender.enum';
import { StatusProduct } from 'src/common/enums/statusProduct.enum';

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
    @InjectRepository(ProductVariant)
    private readonly productVariantRepository: Repository<ProductVariant>,
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

  async findAll(
    // user: UserActiveInterface,
    page?: number,
    limit?: number,
    filters?: {
      name?: string;
      priceMin?: number;
      priceMax?: number;
      gender?: Gender;
      status?: StatusProduct;
      id_type?: number;
    },
  ) {
    const query = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.type', 'type')
      .leftJoinAndSelect('product.productVariants', 'variants')
      .leftJoinAndSelect('product.empresa', 'empresa');
    // .where('empresa.id_empresa = :empresaId', {
    //   empresaId: user.id_empresa,
    // });

    // 🔎 Filtros dinámicos

    if (filters?.name) {
      query.andWhere('LOWER(product.name) LIKE LOWER(:name)', {
        name: `%${filters.name}%`,
      });
    }

    if (filters?.priceMin) {
      query.andWhere('product.price >= :priceMin', {
        priceMin: filters.priceMin,
      });
    }

    if (filters?.priceMax) {
      query.andWhere('product.price <= :priceMax', {
        priceMax: filters.priceMax,
      });
    }

    if (filters?.gender) {
      query.andWhere('product.gender = :gender', {
        gender: filters.gender,
      });
    }

    if (filters?.status) {
      query.andWhere('product.status = :status', {
        status: filters.status,
      });
    }

    if (filters?.id_type) {
      query.andWhere('type.id_type = :id_type', {
        id_type: filters.id_type,
      });
    }

    // 🔹 Paginación opcional
    if (page && limit) {
      const skip = (page - 1) * limit;
      query.skip(skip).take(limit);
    }

    const [data, total] = await query.getManyAndCount();

    const bucketProducts = data.map((product) => ({
      ...product,
      imageUrl: product.imageUrl ? this.getPublicUrl(product.imageUrl) : null,
    }));

    return {
      data: bucketProducts,
      total,
      paginacion: {
        page: page ?? 1,
        lastPage: limit ? Math.ceil(total / limit) : 1,
        nextPage: page ? page + 1 : 2,
      },
      filters,
    };
  }

  async findOne(id: number) {
    const product = await this.productRepository.findOne({
      where: { id_product: id },
      relations: ['type', 'productVariants'],
    });

    if (!product) {
      throw new BadRequestException('Producto no encontrado');
    }

    product.imageUrl = this.getPublicUrl(product.imageUrl);

    return product;
  }

  async findAllHome(
    page?: number,
    limit?: number,
    filters?: {
      name?: string;
      priceMin?: number;
      priceMax?: number;
      gender?: Gender;
      status?: StatusProduct;
      id_type?: number;
    },
  ) {
    const query = this.productRepository
      .createQueryBuilder('product')
      .leftJoin('product.type', 'type')
      .leftJoin('product.productVariants', 'variant')
      .leftJoin('variant.color', 'color')
      .select([
        'product.id_product AS id_product',
        'product.name AS name',
        'product.price AS price',
        'product.gender AS gender',
        'product.status AS status',
        'product.imageUrl AS imageUrl',
        'type.id_type AS type_id',
        'type.name AS type_name',
      ])
      .addSelect(
        `
      COALESCE(
        json_agg(
          DISTINCT jsonb_build_object(
            'id_color', color.id_color,
            'name', color.name,
            'hex_code', color.hex_code
          )
        ) FILTER (WHERE color.id_color IS NOT NULL),
        '[]'
      )
    `,
        'colors',
      )
      .groupBy('product.id_product')
      .addGroupBy('type.id_type');

    // 🔎 Filtros
    if (filters?.name) {
      query.andWhere('LOWER(product.name) LIKE LOWER(:name)', {
        name: `%${filters.name}%`,
      });
    }

    if (filters?.priceMin) {
      query.andWhere('product.price >= :priceMin', {
        priceMin: filters.priceMin,
      });
    }

    if (filters?.priceMax) {
      query.andWhere('product.price <= :priceMax', {
        priceMax: filters.priceMax,
      });
    }

    if (filters?.gender) {
      query.andWhere('product.gender = :gender', {
        gender: filters.gender,
      });
    }

    if (filters?.status) {
      query.andWhere('product.status = :status', {
        status: filters.status,
      });
    }

    if (filters?.id_type) {
      query.andWhere('type.id_type = :id_type', {
        id_type: filters.id_type,
      });
    }

    // 🔹 Paginación
    if (page && limit) {
      query.offset((page - 1) * limit).limit(limit);
    }

    const data = await query.getRawMany();

    const formatted = data.map((product) => ({
      id_product: product.id_product,
      name: product.name,
      price: product.price,
      gender: product.gender,
      status: product.status,
      imageUrl: product.imageurl ? this.getPublicUrl(product.imageurl) : null,
      type: {
        id_type: product.type_id,
        name: product.type_name,
      },
      colors: product.colors,
    }));

    return {
      data: formatted,
      pagination: {
        page: page ?? 1,
        lastPage: limit ? Math.ceil(data.length / limit) : 1,
      },
      filters,
    };
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
