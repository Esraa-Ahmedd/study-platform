import { IsEmail,IsInt,IsOptional,IsString, MaxLength, Min, MinLength,} from "class-validator";

export class RegisterDto{
    @IsString()
    @MinLength(2)
     @MaxLength(20)
    first_name:string;
       @IsString()
    @MinLength(2)
    @MaxLength(20)
    last_name:string;
@IsInt()
@Min(1)
    age:number;
  @IsEmail()
    email:string;
       @IsString()
     @MinLength(8)
      @MaxLength(30)
    password:string;
    

}