import { PartialType } from '@nestjs/swagger';
import { CreateCustomerInformationDto } from './create-customer-information.dto';

export class UpdateCustomerInformationDto extends PartialType(CreateCustomerInformationDto) {}
