import { IsString, IsNotEmpty } from 'class-validator';

export class AdminCancelOrderDto {
  @IsString()
  @IsNotEmpty()
  reason: string;
}
