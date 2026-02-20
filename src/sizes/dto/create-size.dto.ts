import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateSizeDto {
  @IsString()
  @ApiProperty()
  name: string;
}
