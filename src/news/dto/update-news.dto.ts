import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { CreateNewsDto } from './create-news.dto';

export class UpdateNewsDto extends PartialType(CreateNewsDto) {
  @ApiPropertyOptional({
    description: 'Updated title of the news article',
    example: 'Updated Campus Announcement',
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({
    description: 'Updated description of the news article',
    example: 'Updated announcement details...',
  })
  @IsOptional()
  @IsString()
  description?: string;
}
