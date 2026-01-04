import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class RejectSellerDto {
  @IsString()
  @IsNotEmpty({ message: 'Rejection reason is required' })
  @MaxLength(500, { message: 'Rejection reason must not exceed 500 characters' })
  reason: string;
}
