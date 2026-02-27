import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { CreateImageDto } from './dto/create-image.dto';
import { UpdateImageDto } from './dto/update-image.dto';
import { Image } from './entities/image.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Empresa } from 'src/empresa/entities/empresa.entity';
import { Product } from 'src/products/entities/product.entity';
import { Repository } from 'typeorm';
import { SupabaseClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';
import { UserActiveInterface } from 'src/common/interfaces/user-active.interface';

@Injectable()
export class ImagesService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Empresa)
    private readonly empresaRepository: Repository<Empresa>,
    @InjectRepository(Image)
    private readonly imageRepository: Repository<Image>,
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
    createImageDto: CreateImageDto,
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
    const producto = await this.productRepository.findOne({
      where: {
        id_product: createImageDto.id_product,
        empresa: {
          id_empresa: user.id_empresa,
        },
      },
    });
    if (!producto) {
      throw new BadRequestException('Producto no encontrado');
    }
    const newImage = this.imageRepository.create({
      ...createImageDto,
      url: filePath,
      product: producto,
      empresa,
      userEmail: user.email,
      user: { id: user.id },
    });

    const saved = await this.imageRepository.save(newImage);

    // devolver con URL completa
    saved.url = this.getPublicUrl(saved.url);

    return saved;
  }

  findAll() {
    return `This action returns all images`;
  }

  findOne(id: number) {
    return `This action returns a #${id} image`;
  }

  update(id: number, updateImageDto: UpdateImageDto) {
    return `This action updates a #${id} image`;
  }

  remove(id: number) {
    return `This action removes a #${id} image`;
  }
}
