import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString } from 'class-validator';

export class CreateTypeDto {
  @IsString()
  @ApiProperty()
  name: string;

  @IsInt()
  @ApiProperty()
  id_category: number;
}
