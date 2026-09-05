import { IsNotEmpty, IsString, IsArray } from 'class-validator';

export class EnrollStudentDto {
  @IsNotEmpty()
  @IsArray()
  @IsString({ each: true })
  studentIds: string[];
}
