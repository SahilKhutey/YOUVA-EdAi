import { Module } from '@nestjs/common';
import { CognitiveTwinService } from './cognitive-twin.service';
import { PrismaModule } from '../prisma/prisma.module'; // Assume prisma module exists or create generic service

@Module({
    imports: [PrismaModule],
    providers: [CognitiveTwinService],
    exports: [CognitiveTwinService],
})
export class CognitiveTwinModule { }
