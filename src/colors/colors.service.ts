import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateColorDto } from './dto/create-color.dto';
import { UpdateColorDto } from './dto/update-color.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Color } from './entities/color.entity';
import { Empresa } from 'src/empresa/entities/empresa.entity';
import { Repository } from 'typeorm';
import { UserActiveInterface } from 'src/common/interfaces/user-active.interface';

@Injectable()
export class ColorsService {
  constructor(
    @InjectRepository(Color)
    private readonly colorRepository: Repository<Color>,
    @InjectRepository(Empresa)
    private readonly empresaRepository: Repository<Empresa>,
  ) {}
  async create(createColorDto: CreateColorDto, user: UserActiveInterface) {
    const empresa = await this.empresaRepository.findOne({
      where: {
        id_empresa: user.id_empresa,
      },
    });
    if (!empresa) {
      throw new BadRequestException('Empresa no encontrada');
    }
    // const existingColor = await this.colorRepository.findOne({
    //   where: {
    //     name: createColorDto.name,
    //     empresa: empresa,
    //   },
    // });
    // if (existingColor) {
    //   throw new BadRequestException('Color ya existe');
    // }
    const color = this.colorRepository.create({
      ...createColorDto,
      empresa: { id_empresa: user.id_empresa },
      id_user: user.id,
      userEmail: user.email,
    });
    return this.colorRepository.save(color);
  }

  findAll() {
    return this.colorRepository.find();
  }

  findOne(id: number) {
    const color = this.colorRepository.findOne({
      where: {
        id_color: id,
      },
    });
    if (!color) {
      throw new BadRequestException('Color no encontrado');
    }
    return color;
  }

  async update(
    id: number,
    updateColorDto: UpdateColorDto,
    user: UserActiveInterface,
  ) {
    const color = await this.colorRepository.findOne({
      where: {
        id_color: id,
        empresa: {
          id_empresa: user.id_empresa,
        },
      },
    });
    if (!color) {
      throw new BadRequestException('Color no encontrado');
    }
    // const existingColor = await this.colorRepository.findOne({
    //   where: {
    //     name: updateColorDto.name,
    //     empresa: color.empresa,
    //   },
    // });
    // if (existingColor && existingColor.id_color !== id) {
    //   throw new BadRequestException('Color ya existe');
    // }
    return this.colorRepository.save({
      ...color,
      ...updateColorDto,
      id_user: user.id,
      userEmail: user.email,
    });
  }

  async remove(id: number, user: UserActiveInterface) {
    const color = await this.colorRepository.findOne({
      where: {
        id_color: id,
        empresa: {
          id_empresa: user.id_empresa,
        },
      },
    });
    if (!color) {
      throw new BadRequestException('Color no encontrado');
    }
    return this.colorRepository.remove(color);
  }
}
