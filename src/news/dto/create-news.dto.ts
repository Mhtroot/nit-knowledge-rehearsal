import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateNewsDto {
  @ApiProperty({
    description: 'Title of the news article',
    example: 'Important Campus Update',
  })
  @IsString()
  @IsNotEmpty({ message: 'Title should not be empty' })
  title: string;

  @ApiProperty({
    description: 'Detailed content or description of the news article',
    example: 'Classes will be held online tomorrow due to weather conditions.',
  })
  @IsString()
  @IsNotEmpty({ message: 'Description should not be empty' })
  description: string;

  @ApiPropertyOptional({
    type: 'array',
    items: { type: 'string', format: 'binary' },
    description: 'Images to upload with this news article',
  })
  @IsOptional()
  images?: any;
}
