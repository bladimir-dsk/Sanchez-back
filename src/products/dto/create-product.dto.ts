import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsNumber, IsOptional, IsString } from 'class-validator';
import { Gender } from 'src/common/enums/gender.enum';
import { StatusProduct } from 'src/common/enums/statusProduct.enum';

export class CreateProductDto {
  @IsString()
  @ApiProperty()
  name: string;

  @IsString()
  @IsOptional()
  @ApiProperty()
  description?: string;

  @Type(() => Number)
  @IsNumber()
  @ApiProperty()
  price: number;

  // @IsString()
  // imageUrl: string;

  @IsEnum(Gender)
  @ApiProperty()
  gender: Gender;

  @IsEnum(StatusProduct)
  @ApiProperty()
  status: StatusProduct;

  @Type(() => Number)
  @IsInt()
  @ApiProperty()
  id_type: number;
}
