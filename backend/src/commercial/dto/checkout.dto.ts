import { IsIn } from 'class-validator';

export class CheckoutDto {
  @IsIn([
    'FAMILY',
    'FAMILY_PLUS',
    'SCHOOL',
    'SCHOOL_ENTERPRISE',
  ])
  plan!: string;
}
