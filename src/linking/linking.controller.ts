
import {
  Body,
  Controller,
  Post,
} from '@nestjs/common';

import { LinkingService } from './linking.service.js';
import { LinkStudentDto } from './dto/link-student.dto.js';

import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { Roles } from '../auth/decorators/roles.decorator.js';

import { Role } from '../generated/prisma/client.js';

@Controller('linking')
export class LinkingController {
  constructor(private linkingService: LinkingService) {}

  // STUDENT: Generate linking code
  @Roles(Role.STUDENT)
  @Post('generate-code')
  generateCode(@CurrentUser() user: { id: number }) {
    return this.linkingService.generateLinkCode(user.id);
  }

  // PARENT: Link student using code
  @Roles(Role.PARENT)
  @Post('link-child')
  linkChild(
    @CurrentUser() user: { id: number },
    @Body() dto: LinkStudentDto,
  ) {
    return this.linkingService.linkStudent(user.id, dto);
  }
}
