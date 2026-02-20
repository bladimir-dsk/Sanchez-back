import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateTypeDto } from './dto/create-type.dto';
import { UpdateTypeDto } from './dto/update-type.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Type } from './entities/type.entity';
import { Repository } from 'typeorm';
import { Empresa } from 'src/empresa/entities/empresa.entity';
import { UserActiveInterface } from 'src/common/interfaces/user-active.interface';

@Injectable()
export class TypeService {
  constructor(
    @InjectRepository(Type)
    private readonly typeRepository: Repository<Type>,
    @InjectRepository(Empresa)
    private readonly empresaRepository: Repository<Empresa>,
  ) {}
  async create(createTypeDto: CreateTypeDto, user: UserActiveInterface) {
    const empresa = await this.empresaRepository.findOne({
      where: { id_empresa: user.id_empresa },
    });
    if (!empresa) {
      throw new BadRequestException('Empresa no encontrada');
    }
    const existingType = await this.typeRepository.findOne({
      where: {
        name: createTypeDto.name,
        empresa: { id_empresa: user.id_empresa },
      },
    });
    if (existingType) {
      throw new BadRequestException('Tipo ya existe');
    }
    const type = this.typeRepository.create({
      ...createTypeDto,
      empresa,
      id_user: user.id,
      userEmail: user.email,
    });
    return this.typeRepository.save(type);
  }

  findAll() {
    return this.typeRepository.find();
  }

  findOne(id: number) {
    const type = this.typeRepository.findOne({ where: { id_type: id } });
    if (!type) {
      throw new BadRequestException('Tipo no encontrado');
    }
    return type;
  }

  async update(
    id: number,
    updateTypeDto: UpdateTypeDto,
    user: UserActiveInterface,
  ) {
    const type = this.typeRepository.findOne({
      where: {
        id_type: id,
        empresa: {
          id_empresa: user.id_empresa,
        },
      },
    });
    if (!type) {
      throw new BadRequestException('Tipo no encontrado');
    }
    const existingType = await this.typeRepository.findOne({
      where: {
        name: updateTypeDto.name,
        empresa: { id_empresa: user.id_empresa },
      },
    });
    if (existingType && existingType.id_type !== id) {
      throw new BadRequestException('Tipo ya existe');
    }
    return this.typeRepository.update(id, updateTypeDto);
  }

  async remove(id: number, user: UserActiveInterface) {
    const type = await this.typeRepository.findOne({
      where: {
        id_type: id,
        empresa: {
          id_empresa: user.id_empresa,
        },
      },
    });
    if (!type) {
      throw new BadRequestException('Tipo no encontrado');
    }
    return this.typeRepository.remove(type);
  }
}
