import {
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CompleteOnboardingDto {
  @IsIn(['CHILD', 'TEEN', 'ADULT'])
  cognitiveLevel!: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  gradeLevel?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  acquisitionSource?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  referralCode?: string;
}
