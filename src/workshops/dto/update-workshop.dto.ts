import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateWorkshopDto {
  @ApiProperty({ description: 'title of the workshop' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({ description: 'description of the workshop' })
  @IsString()
  @IsOptional()
  @MaxLength(512)
  description?: string;

  @ApiPropertyOptional({
    type: 'array',
    items: { type: 'string', format: 'binary' },
    description: 'Images to upload with this news article',
  })
  @IsOptional()
  bannerPath?: string;
}
