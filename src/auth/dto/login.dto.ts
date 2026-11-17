import { IsEmail,IsInt,IsString, Min, MinLength,} from "class-validator";

export class LoginDto{
  @IsEmail()
    email:string;
       @IsString()
     @MinLength(7)
    password:string;

}