import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { ColorsService } from './colors.service';
import { CreateColorDto } from './dto/create-color.dto';
import { UpdateColorDto } from './dto/update-color.dto';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ActiveUser } from 'src/common/decorators/active-user.decorator';
import { UserActiveInterface } from 'src/common/interfaces/user-active.interface';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { Role } from 'src/common/enums/rol.enum';
import { FindColorDto } from './dto/find-color.dto';

@ApiTags('Colors')
@ApiBearerAuth('jwt')
@Controller('colors')
export class ColorsController {
  constructor(private readonly colorsService: ColorsService) {}

  @Post()
  @Auth(Role.ADMIN)
  create(
    @Body() createColorDto: CreateColorDto,
    @ActiveUser() user: UserActiveInterface,
  ) {
    return this.colorsService.create(createColorDto, user);
  }

  @Get()
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'name', required: false, type: String })
  findAll(@Query() findColorDto: FindColorDto) {
    const { page, limit, ...filters } = findColorDto;
    return this.colorsService.findAll(page, limit, filters);
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.colorsService.findOne(+id);
  }

  @Patch(':id')
  @Auth(Role.ADMIN)
  update(
    @Param('id') id: number,
    @Body() updateColorDto: UpdateColorDto,
    @ActiveUser() user: UserActiveInterface,
  ) {
    return this.colorsService.update(+id, updateColorDto, user);
  }

  @Delete(':id')
  @Auth(Role.ADMIN)
  remove(@Param('id') id: number, @ActiveUser() user: UserActiveInterface) {
    return this.colorsService.remove(+id, user);
  }
}
