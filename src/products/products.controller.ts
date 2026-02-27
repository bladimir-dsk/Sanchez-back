import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
  Query,
  UploadedFiles,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ApiBearerAuth, ApiConsumes, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { Role } from 'src/common/enums/rol.enum';
import { ActiveUser } from 'src/common/decorators/active-user.decorator';
import { UserActiveInterface } from 'src/common/interfaces/user-active.interface';
import { FindProductDto } from './dto/find-product.dto';

@ApiTags('Products')
@ApiBearerAuth('jwt')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @ApiConsumes('multipart/form-data')
  @Auth(Role.ADMIN)
  @UseInterceptors(FilesInterceptor('files', 10)) // 👈 hasta 10 imágenes
  create(
    @UploadedFiles() files: Express.Multer.File[], // 👈 array
    @Body() createProductDto: CreateProductDto,
    @ActiveUser() user: UserActiveInterface,
  ) {
    return this.productsService.create(createProductDto, files, user);
  }

  @Get()
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'name', required: false, type: String })
  @ApiQuery({ name: 'gender', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'id_type', required: false, type: Number })
  @ApiQuery({ name: 'priceMin', required: false, type: Number })
  @ApiQuery({ name: 'priceMax', required: false, type: Number })
  findAll(@Query() query: FindProductDto) {
    const { page, limit, ...filters } = query;

    return this.productsService.findAll(page, limit, filters);
  }

  @Get('home')
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'name', required: false, type: String })
  @ApiQuery({ name: 'gender', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'id_type', required: false, type: Number })
  @ApiQuery({ name: 'priceMin', required: false, type: Number })
  @ApiQuery({ name: 'priceMax', required: false, type: Number })
  findAllHome(@Query() query: FindProductDto) {
    const { page, limit, ...filters } = query;

    return this.productsService.findAllHome(page, limit, filters);
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.productsService.findOne(id);
  }

  @Patch(':id')
  @ApiConsumes('multipart/form-data')
  @Auth(Role.ADMIN)
  @UseInterceptors(FilesInterceptor('files', 10))
  update(
    @UploadedFiles() files: Express.Multer.File[],
    @Param('id') id: number,
    @Body() updateProductDto: UpdateProductDto,
    @ActiveUser() user: UserActiveInterface,
  ) {
    return this.productsService.update(+id, updateProductDto, files, user);
  }

  @Patch('data/product/:id')
  @Auth(Role.ADMIN)
  updateData(
    @Param('id') id: number,
    @Body() updateProductDto: UpdateProductDto,
    @ActiveUser() user: UserActiveInterface,
  ) {
    return this.productsService.updateProduct(+id, updateProductDto, user);
  }

  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.productsService.remove(+id);
  }
}
