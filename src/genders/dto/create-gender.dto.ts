import { ApiBearerAuth, ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateGenderDto {
  @IsString()
  @ApiProperty()
  name: string;
}
