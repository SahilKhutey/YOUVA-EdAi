import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { LocalStrategy } from './local.strategy';
import { PrismaModule } from '../prisma/prisma.module';

import { ScopeAuthorizationService } from './services/scope-authorization.service';
import { ResourceScopeGuard } from './guards/resource-scope.guard';

@Module({
  imports: [
    UsersModule,
    PrismaModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '60m' },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [AuthService, LocalStrategy, JwtStrategy, ScopeAuthorizationService, ResourceScopeGuard],
  controllers: [AuthController],
  exports: [AuthService, ScopeAuthorizationService, ResourceScopeGuard],
})
export class AuthModule { }
