import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { RegisterDto } from './dto/register.dto.js';
import { PrismaService } from '../prisma/prisma.service.js';
import bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto.js';

@Injectable()
export class AuthService {
    //SIGN UP

    constructor(private prismaService:PrismaService,private jwt:JwtService){}
   async register(registerDto:RegisterDto){
    const email=registerDto.email.trim();
const exist =await this.prismaService.user.findUnique({where:{email}}) 
 if(exist) throw new ConflictException('email already exist')
const hash=await bcrypt.hash(registerDto.password,10);
const user=await this.prismaService.user.create({

 data: {
        first_name: registerDto.first_name,
        last_name: registerDto.last_name,
        age: registerDto.age,
        email,
        password: hash,
        role: registerDto.role ?? 'STUDENT',
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

    return user;
  }




  //LOGIN 
async login(loginDto:LoginDto){
    const email=loginDto.email.trim()
  const user=  await this.prismaService.user.findUnique({where:{email}})
  if(!user||!(await bcrypt.compare(loginDto.password,user.password))){
    throw new UnauthorizedException('wrong email or password')
  }
  const token=await this.jwt.signAsync({sub:user.id});
    return{access_token:token}
  

}
}
