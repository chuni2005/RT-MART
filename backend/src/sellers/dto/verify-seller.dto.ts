import { IsNotEmpty, IsString } from 'class-validator';

export class VerifySellerDto {
  @IsString()
  @IsNotEmpty()
  verifiedBy: string;
}
