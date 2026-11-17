import { Module } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { AuthController } from './auth.controller.js';
import { JwtModule } from '@nestjs/jwt';
import 'dotenv/config'
@Module({
  imports:[
    JwtModule.register({
      global:true,
      secret:process.env.SECRET,
      signOptions:{expiresIn:'7d'}
    })
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
