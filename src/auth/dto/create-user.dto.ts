import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, IsNumberString, IsOptional, IsPhoneNumber, IsString, Min } from "class-validator";

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

  @ApiPropertyOptional({ description: "number of children", default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  childCount?: number;

  @ApiPropertyOptional({ description: "number of teenagers", default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  teenageCount?: number;

  @ApiPropertyOptional({ description: "number of adults", default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  adultCount?: number;
}
