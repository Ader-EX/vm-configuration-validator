import { ConfigurableModuleBuilder, Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CatsController } from './cats.controller';
import { SshService } from './service/ssh.service';
import { SshController } from './ssh/ssh.controller';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entity/user.entity';
import { SshList } from './entity/ssh-list.entity';
import { SshListService } from './service/ssh-list.service';
import { MulterModule } from '@nestjs/platform-express';

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
      entities: [User, SshList],
      synchronize: true,
    }),
    TypeOrmModule.forFeature([SshList]),
  ],
  controllers: [AppController, CatsController, SshController],
  providers: [AppService, SshService, SshListService],
})
export class AppModule {}
