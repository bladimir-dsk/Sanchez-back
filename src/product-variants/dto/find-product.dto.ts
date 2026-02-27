import { IsEnum, IsNumber, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { StatusProduct } from 'src/common/enums/statusProduct.enum';

export class FindProductVariantDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  id_product?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  id_color?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  id_size?: number;

  @IsOptional()
  @IsEnum(StatusProduct)
  status?: StatusProduct;
}
