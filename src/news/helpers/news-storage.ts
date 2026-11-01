import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync, promises as fsPromises } from 'fs';
import { BadRequestException } from '@nestjs/common';
import { randomUUID } from 'crypto';

export const NEWS_IMAGES_DIR = join(process.cwd(), 'assets', 'images');

export const newsMulterOptions = {
  storage: diskStorage({
    destination: (_req, _file, cb) => {
      if (!existsSync(NEWS_IMAGES_DIR)) {
        mkdirSync(NEWS_IMAGES_DIR, { recursive: true });
      }
      cb(null, NEWS_IMAGES_DIR);
    },
    filename: (_req, file, cb) => {
      const ext = extname(file.originalname).toLowerCase() || '.jpg';
      const uniqueName = `${Date.now()}-${randomUUID()}${ext}`;
      cb(null, uniqueName);
    },
  }),
  fileFilter: (_req: any, file: Express.Multer.File, cb: any) => {
    if (!file.mimetype || !file.mimetype.startsWith('image/')) {
      return cb(
        new BadRequestException({
          code: 'INVALID_FILE_TYPE',
          message: 'Only image files are allowed',
        }),
        false,
      );
    }
    cb(null, true);
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit per image
    files: 10,
  },
};

export async function deleteImageFile(imagePath: string): Promise<void> {
  try {
    const filename = imagePath.split('/').pop()?.split('\\').pop();
    if (!filename) return;
    const fullPath = join(NEWS_IMAGES_DIR, filename);
    if (existsSync(fullPath)) {
      await fsPromises.unlink(fullPath);
    }
  } catch {
    // Ignore error if file does not exist or cannot be deleted
  }
}
