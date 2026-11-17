import { IsEmail,IsInt,IsString, Min, MinLength,} from "class-validator";

export class RegisterDto{
    @IsString()
    @MinLength(2)
    first_name:string;
       @IsString()
    @MinLength(2)
    last_name:string;
@IsInt()
@Min(1)
    age:number;
  @IsEmail()
    email:string;
       @IsString()
     @MinLength(7)
    password:string;
    role?: 'STUDENT' | 'PARENT';

}