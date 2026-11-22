
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service.js';
import { Role, LinkStatus } from '../generated/prisma/client.js';

import { randomBytes, createHash } from 'node:crypto';
import { LinkStudentDto } from './dto/link-student.dto.js';

@Injectable()
export class LinkingService {
  constructor(private prismaService: PrismaService) {}

  // Generate SHA-256 hash for the linking code
  private hashCode(code: string): string {
    return createHash('sha256').update(code).digest('hex');
  }

  // Generate a random 16-character code
  private generateCode(): string {
    return randomBytes(8).toString('hex');
  }

  // Code expires after 15 minutes
  private getCodeExpiry(): Date {
    return new Date(Date.now() + 15 * 60 * 1000);
  }

  // STUDENT: Generate linking code
  async generateLinkCode(studentId: number) {
    const student = await this.prismaService.user.findUnique({
      where: { id: studentId },
      select: {
        id: true,
        role: true,
      },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    if (student.role !== Role.STUDENT) {
      throw new ForbiddenException('Only students can generate linking codes');
    }

    const code = this.generateCode();
    const codeHash = this.hashCode(code);
    const expiresAt = this.getCodeExpiry();
    const now = new Date();

    await this.prismaService.$transaction(async (tx) => {
      // Invalidate previous unused codes for this student
      await tx.linkingCode.updateMany({
        where: {
          student_id: studentId,
          used_at: null,
        },
        data: {
          used_at: now,
        },
      });

      // Save the new code hash
      await tx.linkingCode.create({
        data: {
          student_id: studentId,
          code_hash: codeHash,
          expires_at: expiresAt,
        },
      });
    });

    // Return the original code only once
    return {
      message: 'Linking code generated successfully',
      code,
      expires_at: expiresAt,
    };
  }

  // PARENT: Link student using code
  async linkStudent(parentId: number, dto: LinkStudentDto) {
    const code = dto.code.trim().toLowerCase();
    const codeHash = this.hashCode(code);
    const now = new Date();

    // Find the code and its owner
    const linkingCode = await this.prismaService.linkingCode.findUnique({
      where: {
        code_hash: codeHash,
      },
      include: {
        student: {
          select: {
            id: true,
            role: true,
          },
        },
      },
    });

    if (!linkingCode) {
      throw new NotFoundException('Invalid linking code');
    }

    if (linkingCode.used_at !== null) {
      throw new BadRequestException('This linking code has already been used');
    }

    if (linkingCode.expires_at <= now) {
      throw new BadRequestException('Linking code has expired');
    }

    if (linkingCode.student.role !== Role.STUDENT) {
      throw new ForbiddenException('The code does not belong to a student');
    }

    if (linkingCode.student.id === parentId) {
      throw new BadRequestException('You cannot link your account to itself');
    }

    // Make sure the requesting user is a parent
    const parent = await this.prismaService.user.findUnique({
      where: { id: parentId },
      select: {
        id: true,
        role: true,
      },
    });

    if (!parent) {
      throw new UnauthorizedException('Parent account not found');
    }

    if (parent.role !== Role.PARENT) {
      throw new ForbiddenException('Only parents can link a student');
    }

    const studentId = linkingCode.student.id;

    // Check whether this relationship already exists
    const existingLink = await this.prismaService.parentStudent.findUnique({
      where: {
        parent_id_student_id: {
          parent_id: parentId,
          student_id: studentId,
        },
      },
    });

    if (existingLink) {
      throw new ConflictException('This student is already linked to your account');
    }

    // Consume the code and create the relationship atomically
    await this.prismaService.$transaction(async (tx) => {
      const result = await tx.linkingCode.updateMany({
        where: {
          id: linkingCode.id,
          used_at: null,
          expires_at: {
            gt: now,
          },
        },
        data: {
          used_at: now,
        },
      });

      // Prevent using the same code more than once
      if (result.count !== 1) {
        throw new BadRequestException('Linking code is no longer valid');
      }

      await tx.parentStudent.create({
        data: {
          parent_id: parentId,
          student_id: studentId,
          status: LinkStatus.ACCEPTED,
        },
      });
    });

    return {
      message: 'Student linked successfully',
      parent_id: parentId,
      student_id: studentId,
    };
  }
}
