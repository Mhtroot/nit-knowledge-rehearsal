import { ApiProperty } from "@nestjs/swagger";
import { IsString, MinLength } from "class-validator";

export class CreateAdminDto {
  @ApiProperty({ description: "admin's username"})
  @IsString()
  username: string;

  @ApiProperty({ description: "admin's password" })
  @IsString()
  @MinLength(8)
  password: string;
}