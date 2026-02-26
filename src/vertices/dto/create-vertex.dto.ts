import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString } from 'class-validator';

export class CreateVertexDto {
  @IsString()
  @ApiProperty()
  latitud: string;

  @IsString()
  @ApiProperty()
  longitud: string;

  @IsInt()
  @ApiProperty()
  orden: number;
}
