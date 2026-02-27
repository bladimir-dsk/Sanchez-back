import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { DataSource, Repository } from 'typeorm';
import { Empresa } from 'src/empresa/entities/empresa.entity';
import { Type } from 'src/type/entities/type.entity';
import { SupabaseClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';
import { UserActiveInterface } from 'src/common/interfaces/user-active.interface';
import { ProductVariant } from 'src/product-variants/entities/product-variant.entity';
import { Gender } from 'src/common/enums/gender.enum';
import { StatusProduct } from 'src/common/enums/statusProduct.enum';
import { Image } from 'src/images/entities/image.entity';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Empresa)
    private readonly empresaRepository: Repository<Empresa>,
    @InjectRepository(Type)
    private readonly typeRepository: Repository<Type>,
    @InjectRepository(Image)
    private readonly imageRepository: Repository<Image>, // 👈 agregar
    @Inject('SUPABASE')
    private readonly supabase: SupabaseClient,
    private readonly configService: ConfigService,
    @InjectRepository(ProductVariant)
    private readonly productVariantRepository: Repository<ProductVariant>,
    private readonly dataSource: DataSource, // 👈 para transacciones
  ) {}
  private getPublicUrl(path: string) {
    const bucket = this.configService.get<string>('SUPABASE_BUCKET');
    const { data } = this.supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  }

  // Sube UN archivo a Supabase y retorna el path
  private async uploadFile(file: Express.Multer.File): Promise<string> {
    const bucket = this.configService.get<string>('SUPABASE_BUCKET');
    const filePath = `products/${Date.now()}-${file.originalname}`;

    const { error } = await this.supabase.storage
      .from(bucket)
      .upload(filePath, file.buffer, { contentType: file.mimetype });

    if (error) throw new BadRequestException(error.message);

    return filePath;
  }

  // Elimina archivos de Supabase
  private async deleteFiles(paths: string[]) {
    const bucket = this.configService.get<string>('SUPABASE_BUCKET');
    await this.supabase.storage.from(bucket).remove(paths);
  }

  async create(
    createProductDto: CreateProductDto,
    files: Express.Multer.File[],
    user: UserActiveInterface,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('Se requiere al menos una imagen');
    }

    const empresa = await this.empresaRepository.findOne({
      where: { id_empresa: user.id_empresa },
    });
    if (!empresa) throw new BadRequestException('Empresa no encontrada');

    const type = await this.typeRepository.findOne({
      where: {
        id_type: createProductDto.id_type,
        empresa: { id_empresa: user.id_empresa },
      },
    });
    if (!type) throw new BadRequestException('Tipo no encontrado');

    // 1. Subir imágenes a Supabase ANTES de la transacción
    const uploadedPaths: string[] = [];
    try {
      for (const file of files) {
        const path = await this.uploadFile(file);
        uploadedPaths.push(path);
      }
    } catch (err) {
      // Si falla alguna subida, limpiar las que sí subieron
      if (uploadedPaths.length > 0) await this.deleteFiles(uploadedPaths);
      throw err;
    }

    // 2. Transacción: guardar producto + imágenes atómicamente
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Guardar producto
      const newProduct = queryRunner.manager.create(Product, {
        ...createProductDto,
        type,
        empresa,
        userEmail: user.email,
        user: { id: user.id },
      });
      const savedProduct = await queryRunner.manager.save(newProduct);

      // Guardar imágenes vinculadas al producto
      const imageEntities = uploadedPaths.map((path, index) =>
        queryRunner.manager.create(Image, {
          url: path,
          is_main: index === 0, // la primera es la principal
          product: savedProduct,
          empresa,
          userEmail: user.email,
          user: { id: user.id },
        }),
      );
      const savedImages = await queryRunner.manager.save(imageEntities);

      await queryRunner.commitTransaction();

      // Retornar con URLs públicas
      return {
        ...savedProduct,
        images: savedImages.map((img) => ({
          ...img,
          url: this.getPublicUrl(img.url),
        })),
      };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      // Si falló la BD, limpiar imágenes subidas a Supabase
      await this.deleteFiles(uploadedPaths);
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async update(
    id: number,
    updateProductDto: UpdateProductDto,
    files: Express.Multer.File[],
    user: UserActiveInterface,
  ) {
    const product = await this.productRepository.findOne({
      where: { id_product: id },
      relations: ['type', 'images'],
    });
    if (!product) throw new BadRequestException('Producto no encontrado');

    const uploadedPaths: string[] = [];

    if (files && files.length > 0) {
      try {
        for (const file of files) {
          const path = await this.uploadFile(file);
          uploadedPaths.push(path);
        }
      } catch (err) {
        if (uploadedPaths.length > 0) await this.deleteFiles(uploadedPaths);
        throw err;
      }
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      if (updateProductDto.id_type) {
        const type = await this.typeRepository.findOne({
          where: {
            id_type: updateProductDto.id_type,
            empresa: { id_empresa: user.id_empresa },
          },
        });
        if (!type) throw new BadRequestException('Tipo no encontrado');
        product.type = type;
      }

      Object.assign(product, updateProductDto);
      product.userEmail = user.email;
      product.id_user = user.id;

      const updatedProduct = await queryRunner.manager.save(product);

      let finalImages: Image[] = [];

      if (uploadedPaths.length > 0) {
        // 1️⃣ Guardar paths viejos para eliminar de Supabase DESPUÉS del commit
        const oldPaths = product.images.map((img) => img.url).filter(Boolean);

        // 2️⃣ Eliminar registros viejos de la BD
        if (product.images.length > 0) {
          await queryRunner.manager.delete(Image, {
            product: { id_product: id },
          });
        }

        // 3️⃣ Crear nuevos registros
        const empresa = await this.empresaRepository.findOne({
          where: { id_empresa: user.id_empresa },
        });

        const imageEntities = uploadedPaths.map((path, index) =>
          queryRunner.manager.create(Image, {
            url: path,
            is_main: index === 0,
            product: updatedProduct,
            empresa,
            userEmail: user.email,
            user: { id: user.id },
          }),
        );
        finalImages = await queryRunner.manager.save(imageEntities);

        await queryRunner.commitTransaction();

        // 4️⃣ Eliminar imágenes viejas de Supabase SOLO si el commit fue exitoso
        if (oldPaths.length > 0) await this.deleteFiles(oldPaths);
      } else {
        // Sin nuevas imágenes, solo actualizar datos del producto
        await queryRunner.commitTransaction();
        finalImages = product.images;
      }

      return {
        ...updatedProduct,
        images: finalImages.map((img) => ({
          ...img,
          url: this.getPublicUrl(img.url),
        })),
      };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      // Si falló la BD, limpiar las nuevas imágenes subidas a Supabase
      if (uploadedPaths.length > 0) await this.deleteFiles(uploadedPaths);
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async updateProduct(
    id: number,
    updateProductDto: UpdateProductDto,
    user: UserActiveInterface,
  ) {
    const product = await this.productRepository.findOne({
      where: { id_product: id },
      relations: ['type', 'images'],
    });
    if (!product) throw new BadRequestException('Producto no encontrado');

    if (updateProductDto.id_type) {
      const type = await this.typeRepository.findOne({
        where: {
          id_type: updateProductDto.id_type,
          empresa: { id_empresa: user.id_empresa },
        },
      });
      if (!type) throw new BadRequestException('Tipo no encontrado');
      product.type = type;
    }

    Object.assign(product, updateProductDto);
    product.userEmail = user.email;
    product.id_user = user.id;

    const updatedProduct = await this.productRepository.save(product);

    return updatedProduct;
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
      .leftJoinAndSelect('product.images', 'images')
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

    const result = data.map((product) => ({
      ...product,
      images: product.images.map((img) => ({
        ...img,
        url: this.getPublicUrl(img.url),
      })),
    }));

    return {
      data: result,
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
      relations: ['type', 'productVariants', 'images'], // 👈 incluir images
    });

    if (!product) throw new BadRequestException('Producto no encontrado');

    // Mapear URLs de imágenes
    product.images = product.images.map((img) => ({
      ...img,
      url: this.getPublicUrl(img.url),
    }));

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
      .leftJoin('product.images', 'images')
      .leftJoin('variant.color', 'color')
      .select([
        'product.id_product AS id_product',
        'product.name AS name',
        'product.price AS price',
        'product.gender AS gender',
        'product.status AS status',
        'type.id_type AS type_id',
        'type.name AS type_name',
      ])
      // 👇 Imágenes como agregado
      .addSelect(
        `COALESCE(
        json_agg(
          DISTINCT jsonb_build_object(
            'id_image', images.id_image,
            'url', images.url,
            'is_main', images.is_main
          )
        ) FILTER (WHERE images.id_image IS NOT NULL),
        '[]'
      )`,
        'images',
      )
      .addSelect(
        `COALESCE(
        json_agg(
          DISTINCT jsonb_build_object(
            'id_color', color.id_color,
            'name', color.name,
            'hex_code', color.hex_code
          )
        ) FILTER (WHERE color.id_color IS NOT NULL),
        '[]'
      )`,
        'colors',
      )
      .addSelect(
        `COALESCE(
    json_agg(
      DISTINCT jsonb_build_object(
        'id_image', images.id_image,
        'url', images.url,
        'is_main', images.is_main
      )
    ) FILTER (WHERE images.id_image IS NOT NULL AND images.is_main = true),
    '[]'
  )`,
        'images',
      )
      .groupBy('product.id_product')
      .addGroupBy('type.id_type');

    // filtros igual que antes...

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
      // 👇 Mapear URLs públicas de todas las imágenes
      images: (
        product.images as { id_image: number; url: string; is_main: boolean }[]
      ).map((img) => ({
        ...img,
        url: this.getPublicUrl(img.url),
      })),
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

  async remove(id: number) {
    const product = await this.productRepository.findOne({
      where: { id_product: id },
      relations: ['images'], // 👈 cargar imágenes para borrarlas
    });

    if (!product) throw new BadRequestException('Producto no encontrado');

    // Eliminar imágenes de Supabase
    const paths = product.images.map((img) => img.url).filter(Boolean);
    if (paths.length > 0) await this.deleteFiles(paths);

    await this.productRepository.remove(product);

    return { message: 'Producto eliminado correctamente' };
  }
}
