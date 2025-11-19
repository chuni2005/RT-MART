import { IsOptional, IsString } from 'class-validator';

export class UpdateSellerDto {
  @IsString()
  @IsOptional()
  bankAccountReference?: string;
}
