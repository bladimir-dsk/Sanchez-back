import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateColorDto {
  @IsString()
  @ApiProperty({
    description: 'Name of the color',
    example: 'Red',
  })
  name: string;

  @IsString()
  @ApiProperty({
    description: 'Hex code of the color',
    example: '#FF0000',
  })
  hex_code: string;
}
