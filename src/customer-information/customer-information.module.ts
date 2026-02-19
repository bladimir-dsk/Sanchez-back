import { Module } from '@nestjs/common';
import { CustomerInformationService } from './customer-information.service';
import { CustomerInformationController } from './customer-information.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomerInformation } from './entities/customer-information.entity';
import { Empresa } from 'src/empresa/entities/empresa.entity';
import { User } from 'src/users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CustomerInformation, Empresa, User])],
  controllers: [CustomerInformationController],
  providers: [CustomerInformationService],
  exports: [CustomerInformationService],
})
export class CustomerInformationModule {}
