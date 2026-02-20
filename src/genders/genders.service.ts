import { Injectable, BadRequestException } from '@nestjs/common';
import { CreateGenderDto } from './dto/create-gender.dto';
import { UpdateGenderDto } from './dto/update-gender.dto';
import { Gender } from './entities/gender.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Empresa } from 'src/empresa/entities/empresa.entity';
import { UserActiveInterface } from 'src/common/interfaces/user-active.interface';

@Injectable()
export class GendersService {
  constructor(
    @InjectRepository(Gender)
    private readonly genderRepository: Repository<Gender>,
    @InjectRepository(Empresa)
    private readonly empresaRepository: Repository<Empresa>,
  ) {}
  async create(createGenderDto: CreateGenderDto, user: UserActiveInterface) {
    const empresa = await this.empresaRepository.findOne({
      where: {
        id_empresa: user.id_empresa,
      },
    });
    if (!empresa) {
      throw new BadRequestException('Empresa no encontrada');
    }
    const newGender = this.genderRepository.create({
      ...createGenderDto,
      id_user: user.id,
      userEmail: user.email,
      empresa,
    });
    return this.genderRepository.save(newGender);
  }

  findAll() {
    return this.genderRepository.find();
  }

  async findOne(id: number) {
    const gender = await this.genderRepository.findOne({
      where: {
        id_gender: id,
      },
    });
    if (!gender) {
      throw new BadRequestException('Genero no encontrado');
    }
    return gender;
  }

  async update(
    id: number,
    updateGenderDto: UpdateGenderDto,
    user: UserActiveInterface,
  ) {
    const gender = await this.findOne(id);
    if (!gender) {
      throw new BadRequestException('Genero no encontrado');
    }
    const updatedGender = this.genderRepository.create({
      ...gender,
      ...updateGenderDto,
      id_user: user.id,
      userEmail: user.email,
    });
    return this.genderRepository.save(updatedGender);
  }

  async remove(id: number, user: UserActiveInterface) {
    const gender = await this.findOne(id);
    if (!gender) {
      throw new BadRequestException('Genero no encontrado');
    }
    return this.genderRepository.remove(gender);
  }
}
