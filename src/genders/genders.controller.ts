import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { GendersService } from './genders.service';
import { CreateGenderDto } from './dto/create-gender.dto';
import { UpdateGenderDto } from './dto/update-gender.dto';
import { ApiTags } from '@nestjs/swagger';
import { ApiBearerAuth } from '@nestjs/swagger';
import { ActiveUser } from 'src/common/decorators/active-user.decorator';
import { UserActiveInterface } from 'src/common/interfaces/user-active.interface';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { Role } from 'src/common/enums/rol.enum';

@ApiTags('Genders')
@ApiBearerAuth('jwt')
@Controller('genders')
export class GendersController {
  constructor(private readonly gendersService: GendersService) {}

  @Post()
  @Auth(Role.ADMIN)
  create(
    @Body() createGenderDto: CreateGenderDto,
    @ActiveUser() user: UserActiveInterface,
  ) {
    return this.gendersService.create(createGenderDto, user);
  }

  @Get()
  findAll() {
    return this.gendersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.gendersService.findOne(id);
  }

  @Patch(':id')
  @Auth(Role.ADMIN)
  update(
    @Param('id') id: number,
    @Body() updateGenderDto: UpdateGenderDto,
    @ActiveUser() user: UserActiveInterface,
  ) {
    return this.gendersService.update(id, updateGenderDto, user);
  }

  @Delete(':id')
  @Auth(Role.ADMIN)
  remove(@Param('id') id: number, @ActiveUser() user: UserActiveInterface) {
    return this.gendersService.remove(id, user);
  }
}
