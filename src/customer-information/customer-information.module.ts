import { Module } from '@nestjs/common';
import { CustomerInformationService } from './customer-information.service';
import { CustomerInformationController } from './customer-information.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomerInformation } from './entities/customer-information.entity';
import { Empresa } from 'src/empresa/entities/empresa.entity';
import { User } from 'src/users/entities/user.entity';
import { Zona } from 'src/zonas/entities/zona.entity';
import { Vertex } from 'src/vertices/entities/vertex.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CustomerInformation,
      Empresa,
      User,
      Zona,
      Vertex,
    ]),
  ],
  controllers: [CustomerInformationController],
  providers: [CustomerInformationService],
  exports: [CustomerInformationService],
})
export class CustomerInformationModule {}
