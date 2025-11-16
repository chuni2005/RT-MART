import { IsInt, IsNotEmpty, Min } from 'class-validator';

export class UpdateInventoryDto {
  @IsInt()
  @IsNotEmpty()
  @Min(0)
  quantity: number;
}

export class ReserveInventoryDto {
  @IsInt()
  @IsNotEmpty()
  @Min(1)
  quantity: number;
}

export class ReleaseInventoryDto {
  @IsInt()
  @IsNotEmpty()
  @Min(1)
  quantity: number;
}
