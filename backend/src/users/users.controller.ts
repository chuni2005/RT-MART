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

  //Post
  //Create a new user (with loginId, name, password, email (phone, role optional))
  @Post()
  async create(@Body() createUserDto: CreateUserDto) {
    const user = await this.usersService.create(createUserDto);
    return plainToInstance(UserResponseDto, user);
  }

  //Get
  //Find all users with pagination and filtering:
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

  //Find all of deleted users
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

  //Find a single user by ID
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const user = await this.usersService.findOne(id);
    return plainToInstance(UserResponseDto, user);
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

  //patch
  //Update a user by ID
  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    const user = await this.usersService.update(id, updateUserDto);
    return plainToInstance(UserResponseDto, user);
  }

  //delete
  //Delete a user by ID
  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.usersService.remove(id);
    return { message: 'User deleted successfully' };
  }
 
  //Permanently delete user by id
  @Roles(UserRole.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Delete(':id/permanent')
  async hardRemove(@Param('id') id: string) {
    await this.usersService.permanentlyDelete(id);
    return { message: 'User permanently deleted successfully' };
  }

  //post
  //Restore a soft-deleted user by ID
  @Post(':id/restore')
  async restore(@Param('id') id: string) {
    const user = await this.usersService.restore(id);
    return plainToInstance(UserResponseDto, user);
  }
}