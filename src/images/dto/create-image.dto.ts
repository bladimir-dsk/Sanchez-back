import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt } from 'class-validator';

export class CreateImageDto {
  @IsEnum(['true', 'false'])
  @ApiProperty({
    description: 'Indica si la imagen es la principal',
    example: 'true',
  })
  is_main: boolean;

  @ApiProperty({
    description: 'ID del producto al que pertenece la imagen',
    example: 1,
  })
  @IsInt()
  id_product: number;
}
