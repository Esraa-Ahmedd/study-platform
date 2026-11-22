import { ConflictException, Injectable, UnauthorizedException , ForbiddenException} from '@nestjs/common';
import { RegisterDto } from './dto/register.dto.js';
import { PrismaService } from '../prisma/prisma.service.js';
import bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto.js';
import { ConfigService } from '@nestjs/config';
import { Role } from '../generated/prisma/client.js';
import { randomBytes, createHash } from 'node:crypto';
import { ChangePasswordDto } from './dto/change-password.dto.js';
@Injectable()
export class AuthService {

    // SHARED REGISTER LOGIC

    constructor(private prismaService:PrismaService,private jwt:JwtService, private configService: ConfigService){}
   private async register(registerDto:RegisterDto,role:Role){
    const email=registerDto.email.trim();
const exist =await this.prismaService.user.findUnique({where:{email}}) 
 if(exist) throw new ConflictException('email already exist')
const hashedPassword=await bcrypt.hash(registerDto.password,10);
const user=await this.prismaService.user.create({

 data: {
        first_name: registerDto.first_name,
        last_name: registerDto.last_name,
        age: registerDto.age,
        email:registerDto.email,
        password: hashedPassword,
          role,
      },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        age: true,
          role: true,
         
      },
    });

 return {
  message: 'Account created successfully',
  user
 }
  }


// REGISTER PARENT

  async registerParent(registerDto: RegisterDto) {
    return this.register(registerDto, Role.PARENT);
  }
  // REGISTER STUDENT

  async registerStudent(registerDto: RegisterDto) {
    return this.register(registerDto, Role.STUDENT);
  }


  //LOGIN 
async login(loginDto:LoginDto){
    const email=loginDto.email.trim()
  const user=  await this.prismaService.user.findUnique({where:{email}})
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

     const isPasswordValid =await bcrypt.compare(loginDto.password,user.password)
  if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

      const payload = {
      sub: user.id,
      role: user.role,
       
    };
  const accessToken=await this.jwt.signAsync(payload,{
      secret: this.configService.getOrThrow<string>('JWT_SECRET'),
      expiresIn: '15m',
  });
   const refreshToken = this.generateRefreshToken();
   const tokenHash = this.hashRefreshToken(refreshToken);
     await this.prismaService.refreshSession.create({
    data: {
      user_id: user.id,
      token_hash: tokenHash,
      expires_at: this.getRefreshTokenExpiry(),
    },
  });
    return{
        message: 'Login successful',
      access_token:accessToken,
        refresh_token: refreshToken,
           user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        role: user.role,
      },
    
    }
  

}

  private hashRefreshToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

private generateRefreshToken(): string {
  return randomBytes(64).toString('hex');
}

private getRefreshTokenExpiry(): Date {
  return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
}
// REFRESH TOKEN

async refresh(refreshToken: string) {
  if (!refreshToken) {
    throw new UnauthorizedException('Refresh token is required');
  }

  const tokenHash = this.hashRefreshToken(refreshToken);
  const now = new Date();

  // Find refresh session
  const session = await this.prismaService.refreshSession.findUnique({
    where: {
      token_hash: tokenHash,
    },
    include: {
      user: {
        select: {
          id: true,
          role: true,
        },
      },
    },
  });

  // Check token validity
  if (
    !session ||
    session.revoked_at !== null ||
    session.expires_at <= now
  ) {
    throw new UnauthorizedException('Invalid or expired refresh token');
  }

  // Generate new Access Token
  const payload = {
    sub: session.user.id,
    role: session.user.role,
  };

  const accessToken = await this.jwt.signAsync(payload, {
    secret: this.configService.getOrThrow<string>('JWT_SECRET'),
    expiresIn: '15m',
  });

  // Generate new Refresh Token
  const newRefreshToken = this.generateRefreshToken();
  const newTokenHash = this.hashRefreshToken(newRefreshToken);

  // Revoke old token and save new one
  await this.prismaService.$transaction(async (tx) => {
    const result = await tx.refreshSession.updateMany({
      where: {
        id: session.id,
        revoked_at: null,
        expires_at: {
          gt: now,
        },
      },
      data: {
        revoked_at: now,
      },
    });

    if (result.count !== 1) {
      throw new UnauthorizedException('Refresh token is no longer valid');
    }

    await tx.refreshSession.create({
      data: {
        user_id: session.user_id,
        token_hash: newTokenHash,
        expires_at: this.getRefreshTokenExpiry(),
      },
    });
  });

  return {
    message: 'Token refreshed successfully',
    access_token: accessToken,
    refresh_token: newRefreshToken,
  };
}


// LOGOUT

async logout(refreshToken: string) {
  if (!refreshToken) {
    throw new UnauthorizedException('Refresh token is required');
  }

  const tokenHash = this.hashRefreshToken(refreshToken);

  const result = await this.prismaService.refreshSession.updateMany({
    where: {
      token_hash: tokenHash,
      revoked_at: null,
    },
    data: {
      revoked_at: new Date(),
    },
  });

  if (result.count === 0) {
    throw new UnauthorizedException('Invalid refresh token');
  }

  return {
    message: 'Logout successful',
  };
}
// CHANGE PASSWORD

async changePassword(userId: number, dto: ChangePasswordDto) {

  // Find user
  const user = await this.prismaService.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
      password: true,
    },
  });

  if (!user) {
    throw new UnauthorizedException('User not found');
  }

  // Check current password
  const isPasswordValid = await bcrypt.compare(
    dto.currentPassword,
    user.password,
  );

  if (!isPasswordValid) {
    throw new UnauthorizedException('Current password is incorrect');
  }

  // Prevent using the same password
  const isSamePassword = await bcrypt.compare(
    dto.newPassword,
    user.password,
  );

  if (isSamePassword) {
    throw new ForbiddenException(
      'New password must be different from current password',
    );
  }

  // Hash new password
  const hashedPassword = await bcrypt.hash(dto.newPassword, 10);

  // Update password and revoke all refresh sessions
  await this.prismaService.$transaction(async (tx) => {

    await tx.user.update({
      where: {
        id: userId,
      },
      data: {
        password: hashedPassword,
      },
    });

    await tx.refreshSession.updateMany({
      where: {
        user_id: userId,
        revoked_at: null,
      },
      data: {
        revoked_at: new Date(),
      },
    });

  });

  return {
    message: 'Password changed successfully. Please login again.',
  };
}
// GET CURRENT USER

  async getCurrentuser(userId: number) {
    const user = await this.prismaService.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        age: true,
        role: true,
      
      },
    });

    if (!user) {
      throw new UnauthorizedException();
    }

    return user;
  }
}

