import { IsDateString, IsIn, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class RecordConsentDto {
  @IsNotEmpty() @IsString() studentId: string;
  @IsNotEmpty() @IsString() @MaxLength(200) guardianName: string;
  @IsIn(['mother', 'father', 'legal guardian']) guardianRelation: string;
  @IsNotEmpty() @IsString() @MaxLength(50) formVersion: string;
  @IsDateString() signedAt: string;
  @IsOptional() @IsString() @MaxLength(500) notes?: string;
}

export class EraseDto {
  @IsIn(['ERASE']) confirm: string;
}
