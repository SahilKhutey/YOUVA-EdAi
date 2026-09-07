import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateSupportTicketDto {
  @IsIn([
    'ACCOUNT',
    'BILLING',
    'LEARNING',
    'TEACHER',
    'PARENT',
    'SAFETY',
    'TECHNICAL',
    'PRIVACY',
  ])
  category!: string;

  @IsOptional()
  @IsIn(['LOW', 'NORMAL', 'HIGH', 'CRITICAL'])
  priority?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  subject!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  description!: string;

  @IsOptional()
  metadata?: Record<string, any>;
}
