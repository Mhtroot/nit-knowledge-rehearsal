import { DbContextService } from 'src/db-context/db-context.service';
import { hashPassword } from '../helper/password.helper';

export const initAdmin = async (
  username: string,
  password: string,
): Promise<boolean> => {
  const db = new DbContextService();
  if (await db.db.admin.findFirst({ where: { username } })) return true;

  const hashed = await hashPassword(password);
  await db.db.admin.create({
    data: {
      username,
      password: hashed,
    },
  });

  return true;
};
