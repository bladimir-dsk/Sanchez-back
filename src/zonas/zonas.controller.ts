import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { ZonasService } from './zonas.service';
import { CreateZonaDto } from './dto/create-zona.dto';
import { UpdateZonaDto } from './dto/update-zona.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ActiveUser } from 'src/common/decorators/active-user.decorator';
import { UserActiveInterface } from 'src/common/interfaces/user-active.interface';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { Role } from 'src/common/enums/rol.enum';

@ApiTags('Zonas')
@ApiBearerAuth('jwt')
@Controller('zonas')
export class ZonasController {
  constructor(private readonly zonasService: ZonasService) {}

  @Post()
  @Auth(Role.ADMIN)
  create(
    @Body() createZonaDto: CreateZonaDto,
    @ActiveUser() user: UserActiveInterface,
  ) {
    return this.zonasService.create(createZonaDto, user);
  }

  @Get()
  findAll() {
    return this.zonasService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.zonasService.findOne(id);
  }

  @Patch(':id')
  @Auth(Role.ADMIN)
  update(
    @ActiveUser() user: UserActiveInterface,
    @Param('id') id: number,
    @Body() updateZonaDto: UpdateZonaDto,
  ) {
    return this.zonasService.update(id, updateZonaDto, user);
  }

  @Delete(':id')
  @Auth(Role.ADMIN)
  remove(@Param('id') id: number, @ActiveUser() user: UserActiveInterface) {
    return this.zonasService.remove(id, user);
  }
}
