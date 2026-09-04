import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { NotificationsGateway } from './notifications.gateway';
import { NotificationsService } from './notifications.service';

@Module({
    imports: [
        JwtModule.registerAsync({
            imports: [ConfigModule],
            useFactory: (cfg: ConfigService) => ({
                secret: cfg.get<string>('JWT_SECRET'),
            }),
            inject: [ConfigService],
        }),
    ],
    providers: [NotificationsGateway, NotificationsService],
    exports: [NotificationsService],
})
export class NotificationsModule { }
