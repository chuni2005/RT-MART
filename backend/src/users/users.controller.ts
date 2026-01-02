import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseInterceptors,
  ClassSerializerInterceptor,
  UseGuards,
  Req,
  Inject,
  forwardRef,
  Logger,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUserDto } from './dto/query-user.dto';
import { DeleteAccountDto } from './dto/delete-account.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { plainToInstance } from 'class-transformer';
import {
  JwtAccessGuard,
  JwtRefreshGuard,
} from './../auth/guards/jwt-auth.guard';
import { UserRole } from './entities/user.entity';
import { Roles } from './../auth/decorators/roles.decorator';
import { RolesGuard } from './../auth/guards/roles.guard';
import { StoresService } from '../stores/stores.service';
import { OrdersService } from '../orders/orders.service';
import { SellersService } from '../sellers/sellers.service';
import { OrderStatus } from '../orders/entities/order.entity';

@Controller('users')
@UseInterceptors(ClassSerializerInterceptor)
export class UsersController {
  private readonly logger = new Logger(UsersController.name);

  constructor(
    private readonly usersService: UsersService,
    @Inject(forwardRef(() => StoresService))
    private readonly storesService: StoresService,
    @Inject(forwardRef(() => OrdersService))
    private readonly ordersService: OrdersService,
    @Inject(forwardRef(() => SellersService))
    private readonly sellersService: SellersService,
  ) {}

  //Create user: create with loginId, name, password, email (phone, role optional)
  @Roles(UserRole.ADMIN)
  @UseGuards(JwtAccessGuard, RolesGuard)
  @Post()
  async create(@Body() createUserDto: CreateUserDto) {
    const user = await this.usersService.create(createUserDto);
    return plainToInstance(UserResponseDto, user);
  }

  //Get users: Find all users with pagination and filtering:
  //page & limit & filtering by `role` & `search` by name
  @Get()
  async findAll(@Query() queryDto: QueryUserDto) {
    const { data, total } = await this.usersService.findAll(queryDto);
    return {
      data: plainToInstance(UserResponseDto, data),
      total,
      page: parseInt(queryDto.page || '1', 10),
      limit: parseInt(queryDto.limit || '10', 10),
    };
  }

  //Get deleted users: Find all deleted users with pagination and filtering:
  //page & limit & filtering by `role` & `search` by name
  @Roles(UserRole.ADMIN)
  @UseGuards(JwtAccessGuard, RolesGuard)
  @Get('deleted')
  async findAllDeleted(@Query() queryDto: QueryUserDto) {
    const { data, total } = await this.usersService.findDeleted(queryDto);
    return {
      data: plainToInstance(UserResponseDto, data),
      total,
      page: parseInt(queryDto.page || '1', 10),
      limit: parseInt(queryDto.limit || '10', 10),
    };
  }

  //Get a single user: Find a user by ID
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const user = await this.usersService.findOne(id);
    return plainToInstance(UserResponseDto, user);
  }

  // Update own data: User updates their own data
  @UseGuards(JwtAccessGuard)
  @Patch('me')
  async updateMe(@Req() req, @Body() updateUserDto: UpdateUserDto) {
    const userId = (req.user as { userId: string }).userId;
    const user = await this.usersService.update(userId, updateUserDto);
    return plainToInstance(UserResponseDto, user);
  }

  //Update user data: Update by ID
  @Roles(UserRole.ADMIN)
  @UseGuards(JwtAccessGuard, RolesGuard)
  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    const user = await this.usersService.update(id, updateUserDto);
    return plainToInstance(UserResponseDto, user);
  }

  //Delete own account: User deletes their own account
  @UseGuards(JwtAccessGuard)
  @Delete('me')
  async removeMe(@Req() req, @Body() deleteAccountDto: DeleteAccountDto) {
    const userId = (req.user as { userId: string }).userId;
    await this.usersService.removeMe(userId, deleteAccountDto.password);
    return { message: 'Your account has been deleted successfully' };
  }

  //Delete user: Delete by ID
  @Roles(UserRole.ADMIN)
  @UseGuards(JwtAccessGuard, RolesGuard)
  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.usersService.remove(id);
    return { message: 'User deleted successfully' };
  }

  //Restore user: Restore a soft-deleted user by ID
  @Roles(UserRole.ADMIN)
  @UseGuards(JwtAccessGuard, RolesGuard)
  @Post(':id/restore')
  async restore(@Param('id') id: string) {
    const user = await this.usersService.restore(id);
    return plainToInstance(UserResponseDto, user);
  }

  //Suspend user: Suspend a user account (admin only)
  //When suspending a user:
  //1. Suspend the user account
  //2. If seller, suspend their store
  //3. Cancel all pending orders (as buyer)
  //4. Cancel all pending orders (from their store as seller)
  @Roles(UserRole.ADMIN)
  @UseGuards(JwtAccessGuard, RolesGuard)
  @Post(':id/suspend')
  async suspendUser(@Param('id') id: string) {
    this.logger.log(`Admin suspending user ${id}`);

    // 1. Suspend the user
    const user = await this.usersService.suspendUser(id);

    // 2. If user is a seller, suspend their store
    try {
      const seller = await this.sellersService.findByUserId(id);
      if (seller) {
        const store = await this.storesService.findBySeller(seller.sellerId);
        if (store && !store.deletedAt) {
          await this.storesService.remove(store.storeId);
          this.logger.log(
            `Suspended store ${store.storeId} for seller ${seller.sellerId}`,
          );
        }
      }
    } catch (error) {
      // User is not a seller, skip
      this.logger.debug(`User ${id} is not a seller`);
    }

    // 3. Cancel all pending orders as buyer
    const cancelableStatuses = [
      OrderStatus.PENDING_PAYMENT,
      OrderStatus.PAYMENT_FAILED,
      OrderStatus.PAID,
      OrderStatus.PROCESSING,
      OrderStatus.SHIPPED,
    ];

    try {
      const buyerOrders = await this.ordersService.findAll(id, {});
      const ordersToCancelAsBuyer = buyerOrders.data.filter((order) =>
        cancelableStatuses.includes(order.orderStatus),
      );

      for (const order of ordersToCancelAsBuyer) {
        await this.ordersService.updateStatus(order.orderId, id, {
          status: OrderStatus.CANCELLED,
        });
        this.logger.log(`Cancelled buyer order ${order.orderNumber}`);
      }
    } catch (error) {
      this.logger.error(`Failed to cancel buyer orders for user ${id}:`, error);
    }

    // TODO: Send suspension email notification

    return {
      message: 'User suspended successfully',
      user: plainToInstance(UserResponseDto, user),
    };
  }

  //Restore suspended user: Restore a suspended user account (admin only)
  @Roles(UserRole.ADMIN)
  @UseGuards(JwtAccessGuard, RolesGuard)
  @Post(':id/restore-suspended')
  async restoreSuspended(@Param('id') id: string) {
    this.logger.log(`Admin restoring suspended user ${id}`);

    // Get user info before restoration to check deletedAt timestamp
    const userBeforeRestore = await this.usersService['userRepository'].findOne(
      {
        where: { userId: id },
        withDeleted: true,
      },
    );

    if (!userBeforeRestore || !userBeforeRestore.deletedAt) {
      return {
        message: 'User is not suspended',
        user: null,
      };
    }

    const userDeletedAt = userBeforeRestore.deletedAt;

    // 1. Restore the user
    const user = await this.usersService.restoreSuspendedUser(id);

    // 2. If user is a seller, check if store should be restored
    try {
      const seller = await this.sellersService.findByUserId(id);
      if (seller) {
        const store = await this.storesService.findBySeller(
          seller.sellerId,
          true,
        );
        if (store && store.deletedAt) {
          // Check if store was deleted within 1 minute of user suspension
          const timeDiffMs = Math.abs(
            new Date(store.deletedAt).getTime() -
              new Date(userDeletedAt).getTime(),
          );
          const oneMinuteMs = 60 * 1000;

          if (timeDiffMs < oneMinuteMs) {
            await this.storesService.restore(store.storeId);
            this.logger.log(
              `Restored store ${store.storeId} for seller ${seller.sellerId} (deleted within ${timeDiffMs}ms of user suspension)`,
            );
          } else {
            this.logger.log(
              `Store ${store.storeId} not auto-restored (time diff: ${timeDiffMs}ms > ${oneMinuteMs}ms)`,
            );
          }
        }
      }
    } catch (error) {
      // User is not a seller or store doesn't exist, skip
      this.logger.debug(`User ${id} is not a seller or store doesn't exist`);
    }

    return {
      message: 'User restored successfully',
      user: plainToInstance(UserResponseDto, user),
    };
  }

  //Permanently delete user: Permanently delete by ID
  @Roles(UserRole.ADMIN)
  @UseGuards(JwtAccessGuard, RolesGuard)
  @Delete(':id/permanent')
  async hardRemove(@Param('id') id: string) {
    await this.usersService.permanentlyDelete(id);
    return { message: 'User permanently deleted successfully' };
  }

  // Health check endpoint
  @Get('test/health')
  getHealth(): object {
    return {
      status: 'ok',
      module: 'users',
      timestamp: new Date().toISOString(),
    };
  }
}
