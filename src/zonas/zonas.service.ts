import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateZonaDto } from './dto/create-zona.dto';
import { UpdateZonaDto } from './dto/update-zona.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Zona } from './entities/zona.entity';
import { Empresa } from 'src/empresa/entities/empresa.entity';
import { UserActiveInterface } from 'src/common/interfaces/user-active.interface';
import { Vertex } from 'src/vertices/entities/vertex.entity';

@Injectable()
export class ZonasService {
  constructor(
    @InjectRepository(Zona)
    private zonaRepository: Repository<Zona>,
    @InjectRepository(Empresa)
    private empresaRepository: Repository<Empresa>,
    @InjectRepository(Vertex)
    private vertexRepository: Repository<Vertex>,
  ) {}
  async create(createZonaDto: CreateZonaDto, user: UserActiveInterface) {
    const empresa = await this.empresaRepository.findOne({
      where: {
        id_empresa: user.id_empresa,
      },
    });
    if (!empresa) {
      throw new BadRequestException('Empresa no encontrada');
    }
    const existingZona = await this.zonaRepository.findOne({
      where: {
        name: createZonaDto.name,
        empresa: { id_empresa: user.id_empresa },
      },
    });
    if (existingZona) {
      throw new BadRequestException('Zona ya existe');
    }
    const zona = this.zonaRepository.create({
      ...createZonaDto,
      empresa,
      id_user: user.id,
      userEmail: user.email,
    });
    const zonaSaved = await this.zonaRepository.save(zona);

    const verticesToSave = createZonaDto.vertices.map((v) => {
      return this.vertexRepository.create({
        ...v,
        zona: zonaSaved,
        empresa,
        id_user: user.id,
        userEmail: user.email,
      });
    });
    const verticesSaved = await this.vertexRepository.save(verticesToSave);
    return {
      msg: 'Zona creada correctamente',
      zona: zonaSaved,
      vertices: verticesSaved,
    };
  }

  findAll() {
    return this.zonaRepository.find({ relations: ['vertices'] });
  }

  async findOne(id: number) {
    const zona = await this.zonaRepository.findOne({
      where: {
        id_zona: id,
      },
      relations: ['vertices'],
    });
    if (!zona) {
      throw new BadRequestException('Zona no encontrada');
    }
    return zona;
  }

  async update(
    id: number,
    updateZonaDto: UpdateZonaDto,
    user: UserActiveInterface,
  ) {
    const zona = await this.zonaRepository.findOne({
      where: { id_zona: id, empresa: { id_empresa: user.id_empresa } },
      relations: ['empresa'],
    });
    if (!zona) {
      throw new BadRequestException('Zona no encontrada');
    }
    if (updateZonaDto.name) {
      const existingZona = await this.zonaRepository.findOne({
        where: {
          name: updateZonaDto.name,
          empresa: { id_empresa: user.id_empresa },
        },
      });
      if (existingZona && existingZona.id_zona !== id) {
        throw new BadRequestException('Zona ya existe');
      }
    }
    if (updateZonaDto.vertices) {
      const vertices = await this.vertexRepository.find({
        where: { zona: { id_zona: id } },
      });
      await this.vertexRepository.remove(vertices);
      const verticesToSave = updateZonaDto.vertices.map((v) => {
        return this.vertexRepository.create({
          ...v,
          zona: { id_zona: id },
          empresa: { id_empresa: user.id_empresa },
          id_user: user.id,
          userEmail: user.email,
        });
      });
      await this.vertexRepository.save(verticesToSave);
    }
    const { vertices, ...zonaData } = updateZonaDto;
    Object.assign(zona, zonaData);
    zona.id_user = user.id;
    zona.userEmail = user.email;
    const zonaActualizada = await this.zonaRepository.save(zona);
    return {
      msg: 'Zona actualizada correctamente',
      data: zonaActualizada,
      vertices: updateZonaDto.vertices,
    };
  }

  async remove(id: number, user: UserActiveInterface) {
    const zona = await this.zonaRepository.findOne({
      where: {
        id_zona: id,
        empresa: {
          id_empresa: user.id_empresa,
        },
      },
    });
    if (!zona) {
      throw new BadRequestException('Zona no encontrada');
    }
    return this.zonaRepository.remove(zona);
  }
}
