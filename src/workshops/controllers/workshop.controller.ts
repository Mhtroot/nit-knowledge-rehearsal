import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { WorkshopService } from '../services/workshop.service';
import { ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { AdminAuthGuard } from 'src/auth/guards/admin.guard';
import { CreateWorkshopDto } from '../dto/create-workshop.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  deleteImageFile,
  newsMulterOptions,
} from 'src/news/helpers/news-storage';
import { UpdateWorkshopDto } from '../dto/update-workshop.dto';

@Controller('workshop')
export class WorkshopController {
  constructor(private readonly service: WorkshopService) {}

  @Get()
  async getAll() {
    return await this.service.getAll();
  }

  @Get(':id')
  async getOne(@Param('id') id: number) {
    return await this.service.getOne(id);
  }

  @ApiBearerAuth()
  @UseGuards(AdminAuthGuard)
  @Post()
  @ApiConsumes('multipart/form-data', 'application/json')
  @UseInterceptors(FileInterceptor('bannerPath', newsMulterOptions))
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() data: CreateWorkshopDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (file) data.bannerPath = `/assets/images/${file.filename}`;
    return await this.service.create(data);
  }

  @ApiBearerAuth()
  @UseGuards(AdminAuthGuard)
  @Put(':id')
  @ApiConsumes('multipart/form-data', 'application/json')
  @UseInterceptors(FileInterceptor('bannerPath', newsMulterOptions))
  async update(
    @Param('id') id: number,
    @Body() data: UpdateWorkshopDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (file) {
      const old = await this.service.getOne(id);
      if (old.bannerPath && old.bannerPath !== '') {
        const parts = old.bannerPath.split('/');
        await deleteImageFile(parts[parts.length - 1]);
      }
      data.bannerPath = `/assets/images/${file.filename}`;
    }

    return await this.service.update(id, data);
  }

  @ApiBearerAuth()
  @UseGuards(AdminAuthGuard)
  @Delete(':id')
  async delete(@Param('id') id: number) {
    const workshop = await this.service.getOne(id);
    if (workshop.bannerPath && workshop.bannerPath !== '') {
      const parts = workshop.bannerPath.split('/');
      await deleteImageFile(parts[parts.length - 1]);
    }

    return await this.service.delete(id);
  }
}
