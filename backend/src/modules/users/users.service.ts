import { Injectable } from '@nestjs/common';
import { UsersRepository } from './users.repository';

@Injectable()
export class UsersService {
  constructor(private readonly repository: UsersRepository) {}

  listAll() {
    return this.repository.listAll();
  }

  createUser(phone: string, name?: string) {
    return this.repository.createUser(phone, name);
  }
}
