
import { IsString, Matches, Length } from 'class-validator';

export class LinkStudentDto {
  @IsString()
  @Length(6, 6)
  @Matches(/^\d{6}$/, {
    message: 'Code must be exactly 6 digits',
  })
  code: string;
}
