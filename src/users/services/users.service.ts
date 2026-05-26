import { Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { User } from '../models';

const deterministicUserId = (name: string): string => {
  const hash = createHash('sha256').update(name).digest('hex');
  return [
    hash.slice(0, 8),
    hash.slice(8, 12),
    hash.slice(12, 16),
    hash.slice(16, 20),
    hash.slice(20, 32),
  ].join('-');
};

@Injectable()
export class UsersService {
  private readonly users: Record<string, User>;

  constructor() {
    this.users = {};
  }

  findOne(name: string): User {
    for (const id in this.users) {
      if (this.users[id].name === name) {
        return this.users[id];
      }
    }
    return;
  }

  createOne({ name, password }: User): User {
    const id = deterministicUserId(name);
    const newUser = { id, name, password };

    this.users[id] = newUser;

    return newUser;
  }
}
