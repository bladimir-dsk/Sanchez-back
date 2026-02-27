import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, IsNumber } from 'class-validator';
import { StatusProduct } from 'src/common/enums/statusProduct.enum';

export class CreateProductVariantDto {
  @ApiProperty()
  @IsNumber()
  price: number;

  @ApiProperty()
  @IsNumber()
  stock: number;

  @IsEnum(StatusProduct)
  @ApiProperty({ enum: StatusProduct })
  status: StatusProduct;

  @ApiProperty()
  @IsInt()
  id_product: number;

  @ApiProperty()
  @IsInt()
  id_color: number;

  @ApiProperty()
  @IsInt()
  id_size: number;
}
