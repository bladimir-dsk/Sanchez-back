import { Module } from '@nestjs/common';
import { VerticesService } from './vertices.service';
import { VerticesController } from './vertices.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Vertex } from './entities/vertex.entity';
import { Zona } from 'src/zonas/entities/zona.entity';
import { Empresa } from 'src/empresa/entities/empresa.entity';
import { User } from 'src/users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Vertex, Zona, Empresa, User])],
  controllers: [VerticesController],
  providers: [VerticesService],
  exports: [VerticesService],
})
export class VerticesModule {}
