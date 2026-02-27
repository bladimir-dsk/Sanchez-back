import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class VariantItemDto {
  @IsNumber()
  @IsNotEmpty()
  @ApiProperty()
  id_color: number;

  @IsNumber()
  @IsNotEmpty()
  @ApiProperty()
  id_size: number;

  @IsNumber()
  @IsNotEmpty()
  @ApiProperty()
  stock: number;

  @IsNumber()
  @IsOptional()
  @ApiProperty()
  price?: number;

  // @IsString()
  // @IsOptional()
  // @ApiProperty()
  // sku?: string;
}

export class CreateBulkProductVariantDto {
  @IsNumber()
  @IsNotEmpty()
  @ApiProperty()
  id_product: number;

  @IsString()
  @IsOptional()
  @ApiProperty()
  status?: string = 'activo';

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VariantItemDto)
  @ApiProperty({ type: [VariantItemDto] })
  variantes: VariantItemDto[];
}
