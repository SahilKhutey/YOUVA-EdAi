import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';

export enum TenantType {
  SCHOOL = 'SCHOOL',
  DISTRICT = 'DISTRICT',
  ACADEMY = 'ACADEMY',
  PLATFORM = 'PLATFORM',
}

export class CreateTenantDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  slug: string;

  @IsOptional()
  @IsEnum(TenantType)
  type?: TenantType;

  @IsOptional()
  settings?: Record<string, any>;
}

export class UpdateTenantDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  settings?: Record<string, any>;
}

export class AddTenantMemberDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  role: string;

  @IsOptional()
  @IsString()
  status?: string;
}

export class CreateCohortDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  academicYear: string;

  @IsOptional()
  @IsString()
  gradeLevel?: string;
}

export class EnrollCohortStudentDto {
  @IsString()
  @IsNotEmpty()
  studentId: string;
}
