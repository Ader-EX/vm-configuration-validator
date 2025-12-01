import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { CreateSshListDto } from 'src/dto/create-sshlist-dto';
import { SshListService } from 'src/service/ssh-list.service';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('ssh')
export class SshController {
  constructor(private readonly sshListService: SshListService) {}

  @Get('uptime/:id')
  async getUptime(@Param() id: any) {
    return await this.sshListService.runSSHCommand(id);
  }

  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      dest: './uploads/sshkeys',
    }),
  )
  create(
    @Body() dto: CreateSshListDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.sshListService.create(dto, file);
  }

  @Get()
  findAll() {
    return this.sshListService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.sshListService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: number, @Body() dto: Partial<CreateSshListDto>) {
    return this.sshListService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.sshListService.remove(id);
  }
}
