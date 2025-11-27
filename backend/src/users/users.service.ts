import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, IsNull } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUserDto } from './dto/query-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) { }

  async create(createUserDto: CreateUserDto): Promise<User> {
    // Check if loginId or email already exists (excluding soft-deleted users)
    const existingUser = await this.userRepository.findOne({
      where: [
        { loginId: createUserDto.loginId, deletedAt: IsNull() },
        { email: createUserDto.email, deletedAt: IsNull() },
      ],
    });

    //conflict
    if (existingUser) {
      if (existingUser.loginId === createUserDto.loginId) {
        throw new ConflictException('Login ID already exists');
      }
      throw new ConflictException('Email already exists');
    }
    if (!Object.values(UserRole).includes(createUserDto.role as UserRole)) {
      throw new ConflictException('Invalid user role');
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(createUserDto.password, saltRounds);

    const user = this.userRepository.create({
      ...createUserDto,
      passwordHash,
    });

    return await this.userRepository.save(user);
  }

  async findAll(
    queryDto: QueryUserDto,
  ): Promise<{ data: User[]; total: number }> {
    const page = parseInt(queryDto.page || '1', 10);
    const limit = parseInt(queryDto.limit || '10', 10);
    const skip = (page - 1) * limit;

    const where: Record<
      string,
      string | ReturnType<typeof Like> | ReturnType<typeof IsNull>
    > = {
      deletedAt: IsNull(), // Only return non-deleted users
    };

    if (queryDto.role) {
      where.role = queryDto.role;
    }

    if (queryDto.search) {
      where.name = Like(`%${queryDto.search}%`);
    }

    const [data, total] = await this.userRepository.findAndCount({
      where,
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return { data, total };
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { userId: id, deletedAt: IsNull() },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async findByLoginId(loginId: string): Promise<User | null> {
    return await this.userRepository.findOne({
      where: { loginId, deletedAt: IsNull() },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return await this.userRepository.findOne({
      where: { email, deletedAt: IsNull() },
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);

    // Check loginId uniqueness
    if (updateUserDto.loginId && updateUserDto.loginId !== user.loginId) {
      const existingUser = await this.findByLoginId(updateUserDto.loginId);
      if (existingUser) {
        throw new ConflictException('Login ID already exists');
      }
    }

    // Check email uniqueness
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.findByEmail(updateUserDto.email);
      if (existingUser) {
        throw new ConflictException('Email already exists');
      }
    }

    // Handle password update
    if (updateUserDto.password) {
      user.passwordHash = await bcrypt.hash(updateUserDto.password, 10);
    }

    // Assign other fields (排除 password)
    const { password, ...rest } = updateUserDto;
    Object.assign(user, rest);

    return await this.userRepository.save(user);
  }

  /**
   * Internal method to update user role
   * Should only be called by internal services (e.g., SellersService)
   * Not exposed through the public API
   */
  async updateRole(id: string, role: UserRole): Promise<User> {
    const user = await this.findOne(id);
    user.role = role;
    return await this.userRepository.save(user);
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    await this.userRepository.softRemove(user);
  }

  async restore(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { userId: id },
      withDeleted: true,
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    if (!user.deletedAt) {
      throw new ConflictException('User is not deleted');
    }

    await this.userRepository.restore(id);
    return await this.findOne(id);
  }

  /**
   * Find all deleted users (for admin purposes)
   */
  async findDeleted(
    queryDto: QueryUserDto,
  ): Promise<{ data: User[]; total: number }> {
    const page = parseInt(queryDto.page || '1', 10);
    const limit = parseInt(queryDto.limit || '10', 10);
    const skip = (page - 1) * limit;

    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .where('user.deletedAt IS NOT NULL')
      .orderBy('user.deletedAt', 'DESC')
      .skip(skip)
      .take(limit)
      .withDeleted();

    if (queryDto.role) {
      queryBuilder.andWhere('user.role = :role', { role: queryDto.role });
    }

    if (queryDto.search) {
      queryBuilder.andWhere('user.name LIKE :search', {
        search: `%${queryDto.search}%`,
      });
    }

    const [data, total] = await queryBuilder.getManyAndCount();

    return { data, total };
  }

  /**
   * Permanently delete a user (hard delete)
   * Should only be used by admin with caution
   */
  async permanentlyDelete(id: string): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { userId: id },
      withDeleted: true,
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    await this.userRepository.remove(user);
  }
}
