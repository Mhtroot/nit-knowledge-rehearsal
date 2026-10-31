import { ApiProperty } from "@nestjs/swagger";
import { IsNumberString, IsPhoneNumber, IsString } from "class-validator";
export class CreateUserDto {
  @ApiProperty({ description: "social security number" })
  @IsNumberString()
  ssn: string;

  @ApiProperty({ description: "user's full name" })
  @IsString()
  fullName: string;

  @ApiProperty({ description: "user's phone number" })
  @IsPhoneNumber('IR')
  phone: string;
}