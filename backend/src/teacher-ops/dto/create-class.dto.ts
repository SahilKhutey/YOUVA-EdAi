import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class CreateClassDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  subject: string;

  @IsOptional()
  @IsString()
  gradeLevel?: string;
}
