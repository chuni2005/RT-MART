import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateSellerDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsOptional()
  bankAccountReference?: string;
}
