import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateWorkshopDto {
  @ApiProperty({ description: 'title of the workshop' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'description of the workshop' })
  @IsString()
  @MaxLength(512)
  description: string;

  @ApiPropertyOptional({
    type: 'array',
    items: { type: 'string', format: 'binary' },
    description: 'Images to upload with this news article',
  })
  @IsOptional()
  bannerPath?: any;
}
