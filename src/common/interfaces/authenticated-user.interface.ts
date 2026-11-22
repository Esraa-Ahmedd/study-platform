
import { Role } from '../../generated/prisma/client.js';

export interface AuthenticatedUser {
  id: number;
  role: Role;
}
