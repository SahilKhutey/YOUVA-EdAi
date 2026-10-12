import { IsNotEmpty, IsNumber, IsString, Max, MaxLength, Min } from 'class-validator';

export class OverrideDifficultyDto {
  @IsNumber()
  @Min(0.1)
  @Max(1.0)
  value: number;

  @IsNotEmpty()
  @IsString()
  @MaxLength(500)
  reason: string;
}
