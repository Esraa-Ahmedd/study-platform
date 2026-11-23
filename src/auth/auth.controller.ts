
import { Body, Controller, Post ,Get} from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { CurrentUser } from './decorators/current-user.decorator.js';
import { Roles } from './decorators/roles.decorator.js';
import { Role } from '../generated/prisma/client.js';
import { Public } from './decorators/public.decorator.js';
import { ChangePasswordDto } from './dto/change-password.dto.js';
@Controller('auth')
export class AuthController {
  constructor(private  authService: AuthService) {}
   // PARENT REGISTER
   @Public()
    @Post('parent/register')
    register(@Body() registerDto:RegisterDto){
      return this.authService.registerParent(registerDto)
    }
      // STUDENT REGISTER

  @Public()
  @Post('student/register')
  registerStudent(@Body() dto: RegisterDto) {
    return this.authService.registerStudent(dto);
  }
  //LOGIN fot both roles
    @Public()
  @Post('login')
  login(@Body() loginDto:LoginDto){
return this.authService.login(loginDto)
  }
   // CURRENT USER

  @Get('currentUser')
  currentUser(@CurrentUser() user: { id: number }) {
    return this.authService.getCurrentuser(user.id);
  }
   // PARENT TEST ROUTE

  @Roles(Role.PARENT)
  @Get('parent-test')
  parentTest(@CurrentUser() user: { id: number }) {
    return {
      message: 'Parent access success',
      userId: user.id,
    };
  }
   @Roles(Role.STUDENT)
  @Get('student-test')
  studentTest(@CurrentUser() user: { id: number }) {
    return {
      message: 'Student access success',
      userId: user.id,
    };
  }






// CHANGE PASSWORD

@Post('change-password')
changePassword(
  @CurrentUser() user: { id: number },
  @Body() dto: ChangePasswordDto,
) {
  return this.authService.changePassword(user.id, dto);
}
}
