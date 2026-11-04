import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { UserAuthRepository } from './user-auth.repository';
import { Prisma } from 'src/generated/prisma/client';
import { User } from '../core/types';

@Injectable()
export class UserServices {
  constructor(private readonly repo: UserAuthRepository) {}

  async create(data: Prisma.UserCreateInput): Promise<User> {
    const exists = await this.repo.get(data);
    if (exists) {
      throw new ConflictException({
        code: 'USER_ALREADY_EXISTS',
        message: 'user already signed',
      });
    }

    const newUser = await this.repo.create(data);
    if (!newUser) {
      throw new InternalServerErrorException({
        code: 'FAILED_TO_CREATE_USER',
        message: 'error while creating user',
      });
    }

    return newUser;
  }

  async getAll(): Promise<User[]> {
    const users = await this.repo.getAll();
    if (!users) {
      throw new InternalServerErrorException({
        code: 'FAILED_TO_FETCH_USERS',
        message: 'failed to fetch users',
      });
    }
    if (users.length === 0) {
      throw new NotFoundException({
        code: 'EMPTY_SET_OF_USERS',
        message: 'No users found',
      });
    }

    return users;
  }
}
