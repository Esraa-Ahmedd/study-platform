import { IsString, Length, Matches } from 'class-validator';

export class LinkStudentDto {
  @IsString()
  @Length(16, 16)
  @Matches(/^[a-fA-F0-9]+$/)
  code: string;
}