import { ApiProperty } from '@nestjs/swagger';

export class NewsImageEntity {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: '/assets/images/1730460000-uuid.jpg' })
  path: string;

  @ApiProperty({ example: 1 })
  newsId: number;
}

export class NewsEntity {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Important Campus Update' })
  title: string;

  @ApiProperty({ example: 'Full news description text' })
  description: string;

  @ApiProperty({ type: () => [NewsImageEntity] })
  images: NewsImageEntity[];
}
