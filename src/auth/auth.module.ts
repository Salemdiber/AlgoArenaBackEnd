import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserModule } from '../user/user.module';
import { JwtStrategy } from './jwt.strategy';
import { TwoFactorEmailService } from './twofactor-email.service';
import { TwoFactorSmsService } from './twofactor-sms.service';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'defaultJwtSecret',
      signOptions: { expiresIn: '1h' },
    }),
    UserModule,
  ],
  providers: [AuthService, JwtStrategy, TwoFactorEmailService, TwoFactorSmsService],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
