// ssh-list.service.ts
import { HttpException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateSshListDto } from 'src/dto/create-sshlist-dto';
import { SshList } from 'src/entity/ssh-list.entity';
import { Repository } from 'typeorm';

@Injectable()
export class SshListService {
  constructor(
    @InjectRepository(SshList)
    private readonly repo: Repository<SshList>,
  ) {}

  async create(dto: CreateSshListDto, file: Express.Multer.File) {
    if (!file) {
      throw new HttpException('SSH key file is required', 400);
    }

    const fileUrl = `./uploads/sshkeys/${file.filename}`;

    const item = this.repo.create({
      ...dto,
      ssh_key: fileUrl,
    });

    return this.repo.save(item);
  }

  findAll() {
    return this.repo.find();
  }

  findOne(id: number) {
    return this.repo.findOne({ where: { id } });
  }

  update(id: number, dto: Partial<CreateSshListDto>) {
    return this.repo.update(id, dto);
  }

  remove(id: number) {
    return this.repo.delete(id);
  }
}
