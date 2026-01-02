import {
  Injectable,
  NotFoundException,
  ConflictException,
  UnauthorizedException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUserDto } from './dto/query-user.dto';
import { formatPhoneNumber } from '../common/utils/string.utils';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

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
      phoneNumber: formatPhoneNumber(createUserDto.phoneNumber),
      passwordHash,
    });

    return await this.userRepository.save(user);
  }

  async findAll(
    queryDto: QueryUserDto,
  ): Promise<{ data: User[]; total: number }> {
    console.log('[UsersService] findAll called with:', queryDto);

    const page = parseInt(queryDto.page || '1', 10);
    const limit = parseInt(queryDto.limit || '10', 10);
    const skip = (page - 1) * limit;

    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .skip(skip)
      .take(limit)
      .orderBy('user.createdAt', 'DESC');

    // Include suspended users if requested (admin only)
    console.log('[UsersService] includeSuspended:', queryDto.includeSuspended);
    if (queryDto.includeSuspended) {
      console.log('[UsersService] Using withDeleted()');
      queryBuilder.withDeleted();
    }

    // Apply filters - use WHERE for first condition, andWhere for subsequent
    let hasWhereCondition = false;

    if (!queryDto.includeSuspended) {
      queryBuilder.where('user.deletedAt IS NULL');
      hasWhereCondition = true;
    }

    if (queryDto.role) {
      if (hasWhereCondition) {
        queryBuilder.andWhere('user.role = :role', { role: queryDto.role });
      } else {
        queryBuilder.where('user.role = :role', { role: queryDto.role });
        hasWhereCondition = true;
      }
    }

    if (queryDto.search) {
      const searchCondition =
        'user.name LIKE :search OR user.loginId LIKE :search OR user.email LIKE :search OR user.userId LIKE :search';
      if (hasWhereCondition) {
        queryBuilder.andWhere(searchCondition, {
          search: `%${queryDto.search}%`,
        });
      } else {
        queryBuilder.where(searchCondition, {
          search: `%${queryDto.search}%`,
        });
      }
    }

    const [data, total] = await queryBuilder.getManyAndCount();

    console.log(
      '[UsersService] Query result - total:',
      total,
      'returned:',
      data.length,
    );
    console.log(
      '[UsersService] First user (if any):',
      data[0]
        ? {
            userId: data[0].userId,
            name: data[0].name,
            loginId: data[0].loginId,
            deletedAt: data[0].deletedAt,
          }
        : 'No users found',
    );

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

  async findByLoginId(
    loginId: string,
    includeSuspended: boolean = false,
  ): Promise<User | null> {
    if (includeSuspended) {
      return await this.userRepository.findOne({
        where: { loginId },
        withDeleted: true,
      });
    }
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
      // If currentPassword is provided, verify it (usually for users updating their own password)
      if (updateUserDto.currentPassword) {
        const isPasswordMatch = await bcrypt.compare(
          updateUserDto.currentPassword,
          user.passwordHash,
        );
        if (!isPasswordMatch) {
          throw new UnauthorizedException('Current password does not match');
        }
      }

      user.passwordHash = await bcrypt.hash(updateUserDto.password, 10);
    }

    // Assign other fields (排除 password, currentPassword)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, currentPassword, ...rest } = updateUserDto;
    // Normalize phone number if present
    if (rest.phoneNumber) {
      rest.phoneNumber = formatPhoneNumber(rest.phoneNumber);
    }
    Object.assign(user, rest);

    return await this.userRepository.save(user);
  }

  /**
   * Remove own account with password verification
   */
  async removeMe(userId: string, password?: string): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { userId, deletedAt: IsNull() },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Verify password if provided
    if (password) {
      const isPasswordMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isPasswordMatch) {
        throw new UnauthorizedException('Invalid password');
      }
    }

    await this.userRepository.softRemove(user);
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

  /**
   * Suspend a user account
   * When user is suspended:
   * 1. Set deletedAt to current timestamp
   * 2. Suspend their store (if seller)
   * 3. Cancel all pending orders
   * 4. Restore inventory for cancelled orders
   */
  async suspendUser(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { userId: id, deletedAt: IsNull() },
    });

    if (!user) {
      throw new NotFoundException(
        `User with ID ${id} not found or already suspended`,
      );
    }

    // Note: Actual suspension logic (store suspension, order cancellation)
    // will be implemented in controller with proper service injections
    // Here we just handle the user entity suspension
    await this.userRepository.softRemove(user);

    // TODO: Send suspension email notification

    return (await this.userRepository.findOne({
      where: { userId: id },
      withDeleted: true,
    })) as User;
  }

  /**
   * Restore a suspended user account
   * Note: The controller will automatically restore their store if it was deleted within 1 minute of user suspension
   */
  async restoreSuspendedUser(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { userId: id },
      withDeleted: true,
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    if (!user.deletedAt) {
      throw new ConflictException('User is not suspended');
    }

    await this.userRepository.restore(id);
    return await this.findOne(id);
  }
}
