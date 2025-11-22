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
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUserDto } from './dto/query-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { plainToInstance } from 'class-transformer';
import { JwtAuthGuard } from './../auth/guards/jwt-auth.guard';
import { UserRole } from './entities/user.entity';
import { Roles } from './../auth/decorators/roles.decorator';
import { RolesGuard } from './../auth/guards/roles.guard';

@Controller('users')
@UseInterceptors(ClassSerializerInterceptor)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  //Create user (with loginId, name, password, email (phone, role optional))
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
  @UseGuards(JwtAuthGuard, RolesGuard)
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
  @UseGuards(JwtAuthGuard)
  @Patch('me')
  async updateMe(@Req() req, @Body() updateUserDto: UpdateUserDto) {
    const userId = req.user.userId;
    const user = await this.usersService.update(userId, updateUserDto);
    return plainToInstance(UserResponseDto, user);
  }

  //Update user data: Update by ID
  @Roles(UserRole.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    const user = await this.usersService.update(id, updateUserDto);
    return plainToInstance(UserResponseDto, user);
  }
  
  //Delete own account: User deletes their own account
  @UseGuards(JwtAuthGuard)
  @Delete('me')
  async removeMe(@Req() req) {
    const userId = req.user.userId;
    await this.usersService.remove(userId);
    return { message: 'Your account has been deleted successfully' };
  }

  //Delete user: Delete by ID
  @Roles(UserRole.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.usersService.remove(id);
    return { message: 'User deleted successfully' };
  }

  //Restore user: Restore a soft-deleted user by ID
  @Roles(UserRole.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post(':id/restore')
  async restore(@Param('id') id: string) {
    const user = await this.usersService.restore(id);
    return plainToInstance(UserResponseDto, user);
  }
 
  //Permanently delete user: Permanently delete by ID
  @Roles(UserRole.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
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