import { DbContextService } from './db-context.service';

jest.mock('../generated/prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    $connect: jest.fn(),
    $queryRaw: jest.fn(),
    $disconnect: jest.fn(),
  })),
}));
jest.mock('@prisma/adapter-mariadb', () => ({ PrismaMariaDb: jest.fn() }));

describe('DbContextService', () => {
  const original = process.env.DATABASE_URL;
  afterEach(() => {
    process.env.DATABASE_URL = original;
  });

  it('throws when DATABASE_URL is missing', () => {
    delete process.env.DATABASE_URL;
    expect(() => new DbContextService()).toThrow('DATABASE_URL');
  });

  it('exposes the client and manages its lifecycle', async () => {
    process.env.DATABASE_URL = 'mysql://u:p%40ss@localhost:3307/mydb';
    const service = new DbContextService();
    await service.onModuleInit();
    expect(service.db.$connect).toHaveBeenCalled();
    expect(service.db.$queryRaw).toHaveBeenCalled();
    await service.onModuleDestroy();
    expect(service.db.$disconnect).toHaveBeenCalled();
  });
});
