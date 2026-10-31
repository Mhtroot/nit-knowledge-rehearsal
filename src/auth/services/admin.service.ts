import { ConflictException, Injectable, InternalServerErrorException } from "@nestjs/common";
import { AdminRepository } from "./admin.repository";
import { Prisma } from "src/generated/prisma/client";
import { Admin } from "src/generated/prisma/browser";

@Injectable()
export class AdminService {
  constructor(private readonly repo: AdminRepository) { }

  async create(data: Prisma.AdminCreateInput): Promise<Admin> {
    const exists = await this.repo.getByUsername(data.username);
    if (exists) {
      throw new ConflictException({
        code: 'ADMIN_ALREADY_EXISTS',
        message: 'admin already exists',
      });
    }

    const newAdmin = await this.repo.create(data);
    if (!newAdmin) {
      throw new InternalServerErrorException({
        code: 'ERROR_CREATING_ADMIN',
        message: 'error creating admin',
      });
    }

    return newAdmin;
  }
}