import { ConflictException, Injectable, UnauthorizedException , ForbiddenException} from '@nestjs/common';
import { RegisterDto } from './dto/register.dto.js';
import { PrismaService } from '../prisma/prisma.service.js';
import bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto.js';
import { ConfigService } from '@nestjs/config';
import { Role } from '../generated/prisma/client.js';

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
      expiresIn: '7d',
  });

    return{
        message: 'Login successful',
      access_token:accessToken,
            user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        role: user.role,
      },
    
    }
  

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

  // Update password 
await this.prismaService.user.update({
  where: {
    id: userId,
  },
  data: {
    password: hashedPassword,
  },
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

