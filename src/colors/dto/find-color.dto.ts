import { IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class FindColorDto {
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  @ApiProperty({ required: false, type: Number })
  page?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  @ApiProperty({ required: false, type: Number })
  limit?: number;

  @IsString()
  @IsOptional()
  @ApiProperty({ required: false, type: String })
  name?: string;
}
