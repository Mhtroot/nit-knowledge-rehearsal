import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { WorkshopRepository } from './workshop.repository';
import { CreateWorkshopDto } from '../dto/create-workshop.dto';
import { UpdateWorkshopDto } from '../dto/update-workshop.dto';

@Injectable()
export class WorkshopService {
  constructor(private readonly repo: WorkshopRepository) {}

  async create(data: CreateWorkshopDto) {
    const result = await this.repo.create(data);
    if (!result) {
      throw new InternalServerErrorException({
        code: 'ERROR_CREATING_WORKSHOP',
        message: 'error creating workshop',
      });
    }

    return result;
  }

  async getAll() {
    return await this.repo.getAll();
  }

  async getOne(id: number) {
    const result = await this.repo.getOne(id);
    if (!result) {
      throw new NotFoundException({
        code: 'WORKSHO_NOT_FOUND',
        message: 'workshop did not found',
      });
    }

    return result;
  }

  async update(id: number, data: UpdateWorkshopDto) {
    await this.getOne(id);

    return await this.repo.update(id, data);
  }

  async delete(id: number) {
    await this.getOne(id);
    return this.repo.delete(id);
  }
}
