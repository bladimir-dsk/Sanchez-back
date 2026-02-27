import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateProductVariantDto } from './dto/create-product-variant.dto';
import { UpdateProductVariantDto } from './dto/update-product-variant.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { ProductVariant } from './entities/product-variant.entity';
import { Repository } from 'typeorm';
import { Product } from 'src/products/entities/product.entity';
import { Empresa } from 'src/empresa/entities/empresa.entity';
import { Size } from 'src/sizes/entities/size.entity';
import { Color } from 'src/colors/entities/color.entity';
import { UserActiveInterface } from 'src/common/interfaces/user-active.interface';
import { CreateBulkProductVariantDto } from './dto/createBulkDto.dto';
import { StatusProduct } from 'src/common/enums/statusProduct.enum';

@Injectable()
export class ProductVariantsService {
  constructor(
    @InjectRepository(ProductVariant)
    private productVariantRepository: Repository<ProductVariant>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(Empresa)
    private empresaRepository: Repository<Empresa>,
    @InjectRepository(Size)
    private sizeRepository: Repository<Size>,
    @InjectRepository(Color)
    private colorRepository: Repository<Color>,
  ) {}
  async create(
    createProductVariantDto: CreateProductVariantDto,
    user: UserActiveInterface,
  ) {
    const empresa = await this.empresaRepository.findOne({
      where: { id_empresa: user.id_empresa },
    });

    if (!empresa) {
      throw new BadRequestException('Empresa no encontrada');
    }
    const product = await this.productRepository.findOne({
      where: {
        id_product: createProductVariantDto.id_product,
        empresa: {
          id_empresa: user.id_empresa,
        },
      },
    });
    if (!product) {
      throw new BadRequestException('Producto no encontrado');
    }

    const color = await this.colorRepository.findOne({
      where: {
        id_color: createProductVariantDto.id_color,
        empresa: {
          id_empresa: user.id_empresa,
        },
      },
    });
    if (!color) {
      throw new BadRequestException('Color no encontrado');
    }

    const size = await this.sizeRepository.findOne({
      where: {
        id_size: createProductVariantDto.id_size,
        empresa: {
          id_empresa: user.id_empresa,
        },
      },
    });
    if (!size) {
      throw new BadRequestException('Talla no encontrada');
    }

    const newVariant = this.productVariantRepository.create({
      ...createProductVariantDto,
      product,
      color,
      size,
      empresa,
      id_user: user.id,
      userEmail: user.email,
    });

    return this.productVariantRepository.save(newVariant);
  }

  async createBulk(
    createBulkDto: CreateBulkProductVariantDto,
    user: UserActiveInterface,
  ) {
    const empresa = await this.empresaRepository.findOne({
      where: { id_empresa: user.id_empresa },
    });
    if (!empresa) throw new BadRequestException('Empresa no encontrada');

    const product = await this.productRepository.findOne({
      where: {
        id_product: createBulkDto.id_product,
        empresa: { id_empresa: user.id_empresa },
      },
    });
    if (!product) throw new BadRequestException('Producto no encontrado');

    const colorIds = [
      ...new Set(createBulkDto.variantes.map((v) => v.id_color)),
    ];
    const sizeIds = [...new Set(createBulkDto.variantes.map((v) => v.id_size))];

    const colors = await this.colorRepository.find({
      where: colorIds.map((id) => ({
        id_color: id,
        empresa: { id_empresa: user.id_empresa },
      })),
    });

    const sizes = await this.sizeRepository.find({
      where: sizeIds.map((id) => ({
        id_size: id,
        empresa: { id_empresa: user.id_empresa },
      })),
    });

    const colorMap = new Map(colors.map((c) => [c.id_color, c]));
    const sizeMap = new Map(sizes.map((s) => [s.id_size, s]));

    const variantsToSave = createBulkDto.variantes.map((item, index) => {
      const color = colorMap.get(item.id_color);
      if (!color)
        throw new BadRequestException(
          `Color id ${item.id_color} no encontrado (variante #${index + 1})`,
        );

      const size = sizeMap.get(item.id_size);
      if (!size)
        throw new BadRequestException(
          `Talla id ${item.id_size} no encontrada (variante #${index + 1})`,
        );

      return this.productVariantRepository.create({
        stock: item.stock,
        price: item.price,
        // sku: item.sku,
        status: createBulkDto.status as StatusProduct,
        product,
        color,
        size,
        empresa,
        id_user: user.id,
        userEmail: user.email,
      });
    });
    const saved = await this.productVariantRepository.save(variantsToSave);

    return {
      message: `${saved.length} variantes creadas correctamente`,
      data: saved,
    };
  }

  async findAll(
    user: UserActiveInterface,
    page?: number,
    limit?: number,
    filters?: {
      id_product?: number;
      id_color?: number;
      id_size?: number;
      status?: StatusProduct;
    },
  ) {
    const query = this.productVariantRepository
      .createQueryBuilder('variant')
      .leftJoinAndSelect('variant.product', 'product')
      .leftJoinAndSelect('variant.color', 'color')
      .leftJoinAndSelect('variant.size', 'size')
      .leftJoinAndSelect('variant.empresa', 'empresa');
    // .where('empresa.id_empresa = :empresaId', {
    //   user: user.id_empresa,
    // });

    // 🔎 Filtros opcionales
    if (filters?.id_color) {
      query.andWhere('color.id_color = :id_color', {
        id_color: filters.id_color,
      });
    }

    if (filters?.id_size) {
      query.andWhere('size.id_size = :id_size', {
        id_size: filters.id_size,
      });
    }

    if (filters?.id_product) {
      query.andWhere('product.id_product = :id_product', {
        id_product: filters.id_product,
      });
    }

    if (filters?.status) {
      query.andWhere('variant.status = :status', {
        status: filters.status,
      });
    }

    // 🔹 Paginación (solo si la mandas)
    if (page && limit) {
      const skip = (page - 1) * limit;
      query.skip(skip).take(limit);
    }

    const [data, total] = await query.getManyAndCount();

    return {
      data,
      total,
      paginacion: {
        page: page ?? 1,
        lastPage: limit ? Math.ceil(total / limit) : 1,
        next: page ? page + 1 : 1,
        prev: page ? page - 1 : 1,
      },
    };
  }
  async findOne(id: number) {
    const variant = await this.productVariantRepository.findOne({
      where: { id_product_variant: id },
      relations: ['product', 'color', 'size', 'empresa'],
    });
    if (!variant) {
      throw new NotFoundException(`Variant with ID ${id} not found`);
    }
    return variant;
  }

  async update(
    id: number,
    updateProductVariantDto: UpdateProductVariantDto,
    user: UserActiveInterface,
  ) {
    const variant = await this.productVariantRepository.findOne({
      where: {
        id_product_variant: id,
        empresa: { id_empresa: user.id_empresa },
      },
    });
    if (!variant) {
      throw new NotFoundException('Variante no encontrada');
    }
    if (updateProductVariantDto.id_product) {
      const product = await this.productRepository.findOne({
        where: {
          id_product: updateProductVariantDto.id_product,
          empresa: { id_empresa: user.id_empresa },
        },
      });
      if (!product) {
        throw new NotFoundException('Producto no encontrado');
      }
      variant.product = product;
    }
    if (updateProductVariantDto.id_color) {
      const color = await this.colorRepository.findOne({
        where: {
          id_color: updateProductVariantDto.id_color,
          empresa: { id_empresa: user.id_empresa },
        },
      });
      if (!color) {
        throw new NotFoundException('Color no encontrado');
      }
      variant.color = color;
    }
    if (updateProductVariantDto.id_size) {
      const size = await this.sizeRepository.findOne({
        where: {
          id_size: updateProductVariantDto.id_size,
          empresa: { id_empresa: user.id_empresa },
        },
      });
      if (!size) {
        throw new NotFoundException('Talla no encontrada');
      }
      variant.size = size;
    }

    Object.assign(variant, updateProductVariantDto);
    variant.userEmail = user.email;
    variant.id_user = user.id;
    await this.productVariantRepository.save(variant);
    return variant;
  }

  remove(id: number) {
    return `This action removes a #${id} productVariant`;
  }

  async findVariantsByProduct(id_product: number) {
    const productVariants = await this.productVariantRepository.find({
      where: { product: { id_product } },
    });
    if (!productVariants) {
      throw new NotFoundException('Variante no encontrada');
    }
    return productVariants;
  }
}
