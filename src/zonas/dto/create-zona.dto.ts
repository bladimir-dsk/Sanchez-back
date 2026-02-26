import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsString, ValidateNested } from 'class-validator';
import { CreateVertexDto } from 'src/vertices/dto/create-vertex.dto';

export class CreateZonaDto {
  @IsString()
  @ApiProperty({ example: 'Zona 1' })
  name: string;

  @IsString()
  @ApiProperty({ example: '#0ccc0c' })
  color_fill: string;

  @ApiProperty({ type: [CreateVertexDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateVertexDto)
  vertices: CreateVertexDto[];
}
