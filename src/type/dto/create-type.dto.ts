import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateTypeDto {
  @IsString()
  @ApiProperty()
  name: string;
}
