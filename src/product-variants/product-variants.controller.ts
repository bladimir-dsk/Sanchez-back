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
import { ProductVariantsService } from './product-variants.service';
import { CreateProductVariantDto } from './dto/create-product-variant.dto';
import { UpdateProductVariantDto } from './dto/update-product-variant.dto';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { Role } from 'src/common/enums/rol.enum';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ActiveUser } from 'src/common/decorators/active-user.decorator';
import { UserActiveInterface } from 'src/common/interfaces/user-active.interface';
import { CreateBulkProductVariantDto } from './dto/createBulkDto.dto';
import { FindProductVariantDto } from './dto/find-product.dto';

@ApiTags('Product Variants')
@ApiBearerAuth('jwt')
@Controller('product-variants')
export class ProductVariantsController {
  constructor(
    private readonly productVariantsService: ProductVariantsService,
  ) {}

  @Get('product/:id')
  findVariantsByProduct(@Param('id') id: number) {
    return this.productVariantsService.findVariantsByProduct(+id);
  }

  @Post()
  @Auth(Role.ADMIN)
  create(
    @Body() createProductVariantDto: CreateProductVariantDto,
    @ActiveUser() user: UserActiveInterface,
  ) {
    return this.productVariantsService.create(createProductVariantDto, user);
  }

  @Post('bulk-create')
  @Auth(Role.ADMIN)
  createBulk(
    @Body() createBulkDto: CreateBulkProductVariantDto,
    @ActiveUser() user: UserActiveInterface,
  ) {
    return this.productVariantsService.createBulk(createBulkDto, user);
  }

  @Get()
  findAll(
    @ActiveUser() user: UserActiveInterface,
    @Query() query: FindProductVariantDto,
  ) {
    const { page, limit, ...filters } = query;

    return this.productVariantsService.findAll(user, page, limit, filters);
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.productVariantsService.findOne(+id);
  }

  @Patch(':id')
  @Auth(Role.ADMIN)
  update(
    @Param('id') id: number,
    @Body() updateProductVariantDto: UpdateProductVariantDto,
    @ActiveUser() user: UserActiveInterface,
  ) {
    return this.productVariantsService.update(
      +id,
      updateProductVariantDto,
      user,
    );
  }

  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.productVariantsService.remove(+id);
  }
}
