import { IsEmail, IsString, IsNotEmpty } from 'class-validator';

export class ForgotPasswordDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  recaptchaToken: string;
}
