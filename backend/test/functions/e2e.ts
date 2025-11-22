import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppModules } from './../module.index';

export async function createTestApp(): Promise<INestApplication> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [
      TypeOrmModule.forRoot({
        type: 'mariadb',
        host: 'mariadb',
        port: 3306,
        username: 'rt_mart_user',
        password: 'rt_mart_and_the_user_password_yeah_very_cool123*',
        database: 'rt_mart_db',
        autoLoadEntities: true,
        migrations: ['../src/migrations/*.js'],
      }),
      ...AppModules,
    ],
  }).compile();

  const app = moduleFixture.createNestApplication();
  await app.init();
  return app;
}