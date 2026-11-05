import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsInt,
  IsNumberString,
  IsOptional,
  IsPhoneNumber,
  IsString,
  Min,
} from 'class-validator';

export class CreateUserDto {
  @ApiPropertyOptional({ description: 'social security number' })
  @IsOptional()
  @Transform(({ value }) =>
    value === '' || value === null || value === undefined
      ? undefined
      : String(value).trim(),
  )
  @IsNumberString()
  ssn?: string;

  @ApiProperty({ description: "user's full name" })
  @IsString()
  fullName: string;

  @ApiProperty({ description: "user's phone number" })
  @IsPhoneNumber('IR')
  phone: string;

  @ApiPropertyOptional({ description: 'number of children', default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  childCount?: number;

  @ApiPropertyOptional({ description: 'number of teenagers', default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  teenageCount?: number;

  @ApiPropertyOptional({ description: 'number of adults', default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  adultCount?: number;
}
