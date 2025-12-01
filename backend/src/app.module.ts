import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SshController } from './ssh/ssh.controller';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SshList } from './entity/ssh-list.entity';
import { SshListService } from './service/ssh-list.service';
import { MulterModule } from '@nestjs/platform-express';
import { VmPrereqService } from './service/prereq-service';
import { VmPrereqController } from './controller/prereq-controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MulterModule.register({
      dest: './uploads/sshkeys',
    }),
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'database.sqlite',
      entities: [SshList],
      synchronize: true,
    }),
    TypeOrmModule.forFeature([SshList]),
  ],
  controllers: [AppController, SshController, VmPrereqController],
  providers: [AppService, SshListService, VmPrereqService],
})
export class AppModule {}
