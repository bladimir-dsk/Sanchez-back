import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateSizeDto } from './dto/create-size.dto';
import { UpdateSizeDto } from './dto/update-size.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Size } from './entities/size.entity';
import { Repository } from 'typeorm';
import { Empresa } from 'src/empresa/entities/empresa.entity';
import { UserActiveInterface } from 'src/common/interfaces/user-active.interface';

@Injectable()
export class SizesService {
  constructor(
    @InjectRepository(Size)
    private readonly sizeRepository: Repository<Size>,
    @InjectRepository(Empresa)
    private readonly empresaRepository: Repository<Empresa>,
  ) {}
  async create(createSizeDto: CreateSizeDto, user: UserActiveInterface) {
    const empresa = await this.empresaRepository.findOne({
      where: {
        id_empresa: user.id_empresa,
      },
    });
    if (!empresa) {
      throw new BadRequestException('Empresa no encontrada');
    }
    const newSize = this.sizeRepository.create({
      ...createSizeDto,
      id_user: user.id,
      userEmail: user.email,
      empresa,
    });
    return this.sizeRepository.save(newSize);
  }

  findAll() {
    return this.sizeRepository.find();
  }

  async findOne(id: number) {
    const size = await this.sizeRepository.findOne({
      where: {
        id_size: id,
      },
    });
    if (!size) {
      throw new BadRequestException('Talla no encontrada');
    }
    return size;
  }

  async update(id: number, updateSizeDto: UpdateSizeDto) {
    const size = await this.findOne(id);
    if (!size) {
      throw new BadRequestException('Talla no encontrada');
    }
    return this.sizeRepository.save({
      ...size,
      ...updateSizeDto,
    });
  }

  async remove(id: number) {
    const size = await this.findOne(id);
    if (!size) {
      throw new BadRequestException('Talla no encontrada');
    }
    return this.sizeRepository.remove(size);
  }
}
