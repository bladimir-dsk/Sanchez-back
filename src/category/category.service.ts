import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Category } from './entities/category.entity';
import { Empresa } from 'src/empresa/entities/empresa.entity';
import { Repository } from 'typeorm';
import { UserActiveInterface } from 'src/common/interfaces/user-active.interface';
import { SupabaseClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(Empresa)
    private readonly empresaRepository: Repository<Empresa>,
    @Inject('SUPABASE')
    private readonly supabase: SupabaseClient,
    private readonly configService: ConfigService,
  ) {}
  async create(
    createCategoryDto: CreateCategoryDto,
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

    const fileName = `categories/${Date.now()}-${file.originalname}`;

    const { error } = await this.supabase.storage
      .from(this.configService.get<string>('SUPABASE_BUCKET'))
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
      });

    if (error) {
      throw new BadRequestException(error.message);
    }

    const { data } = this.supabase.storage
      .from(this.configService.get<string>('SUPABASE_BUCKET'))
      .getPublicUrl(fileName);

    const newCategory = this.categoryRepository.create({
      name: createCategoryDto.name,
      imageUrl: data.publicUrl,
      empresa,
      userEmail: user.email,
      user: { id: user.id },
    });

    return await this.categoryRepository.save(newCategory);
  }

  async findAll() {
    return await this.categoryRepository.find();
  }

  async findOne(id: number) {
    const category = await this.categoryRepository.findOne({
      where: {
        id_category: id,
      },
    });
    if (!category) {
      throw new BadRequestException('Categoria no encontrada');
    }
    return category;
  }

  async update(
    id: number,
    updateCategoryDto: UpdateCategoryDto,
    file: Express.Multer.File,
    user: UserActiveInterface,
  ) {
    const category = await this.categoryRepository.findOne({
      where: { id_category: id },
    });

    if (!category) {
      throw new BadRequestException('Categoria no encontrada');
    }

    const bucket = this.configService.get<string>('SUPABASE_BUCKET');

    if (file) {
      if (category.imageUrl) {
        const oldPath = category.imageUrl.split(
          `/storage/v1/object/public/${bucket}/`,
        )[1];

        if (oldPath) {
          await this.supabase.storage.from(bucket).remove([oldPath]);
        }
      }

      const newFileName = `categories/${Date.now()}-${file.originalname}`;

      const { error } = await this.supabase.storage
        .from(bucket)
        .upload(newFileName, file.buffer, {
          contentType: file.mimetype,
        });

      if (error) {
        throw new BadRequestException(error.message);
      }

      const { data } = this.supabase.storage
        .from(bucket)
        .getPublicUrl(newFileName);

      category.imageUrl = data.publicUrl;
    }

    if (updateCategoryDto.name) {
      category.name = updateCategoryDto.name;
    }

    return await this.categoryRepository.save(category);
  }

  async remove(id: number, user: UserActiveInterface) {
    const category = await this.categoryRepository.findOne({
      where: { id_category: id },
    });

    if (!category) {
      throw new BadRequestException('Categoria no encontrada');
    }

    const bucket = this.configService.get<string>('SUPABASE_BUCKET');

    if (category.imageUrl) {
      const filePath = category.imageUrl.split(
        `/storage/v1/object/public/${bucket}/`,
      )[1];

      if (filePath) {
        const { error } = await this.supabase.storage
          .from(bucket)
          .remove([filePath]);

        if (error) {
          throw new BadRequestException(
            `Error eliminando imagen: ${error.message}`,
          );
        }
      }
    }

    await this.categoryRepository.remove(category);

    return {
      message: 'Categoria eliminada correctamente',
    };
  }
}
