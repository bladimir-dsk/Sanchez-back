import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Gender } from 'src/common/enums/gender.enum';
import { StatusProduct } from 'src/common/enums/statusProduct.enum';

export class FindProductDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @ApiProperty()
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @ApiProperty()
  limit?: number;

  @IsOptional()
  @IsString()
  @ApiProperty()
  name?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @ApiProperty()
  priceMin?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @ApiProperty()
  priceMax?: number;

  @IsOptional()
  @IsEnum(Gender)
  @ApiProperty({
    enum: Gender,
    enumName: 'Gender',
  })
  gender?: Gender;

  @IsOptional()
  @IsEnum(StatusProduct)
  @ApiProperty({
    enum: StatusProduct,
    enumName: 'StatusProduct',
  })
  status?: StatusProduct;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @ApiProperty()
  id_type?: number;
}
