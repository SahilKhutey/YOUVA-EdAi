import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

/** Public sign-up accepts only these fields. Anything else in the request (for example "role") is ignored. */
export class RegisterDto {
  @IsEmail()
  @MaxLength(254)
  email: string;

  // 72 is bcrypt's limit: longer passwords are silently truncated.
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  gradeLevel?: string;
}
