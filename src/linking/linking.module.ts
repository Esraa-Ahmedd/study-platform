import { Module } from '@nestjs/common';

import { LinkingController } from './linking.controller.js';
import { LinkingService } from './linking.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  controllers: [LinkingController],
  providers: [LinkingService],
})
export class LinkingModule {}