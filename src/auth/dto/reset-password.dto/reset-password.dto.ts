import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class VerifyResetTokenDto {
  @IsString()
  @IsNotEmpty()
  token: string;
}

export class ResetPasswordDto {
  @IsString()
  @IsNotEmpty()
  token: string;

  @IsString()
  @IsNotEmpty()
  newPassword: string;

  @IsString()
  @IsOptional()
  oldPassword?: string;
}
