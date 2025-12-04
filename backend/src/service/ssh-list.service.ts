// ssh-list.service.ts
import { BadRequestException, HttpException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateSshListDto } from 'src/dto/create-sshlist-dto';
import { SshList } from 'src/entity/ssh-list.entity';
import { Repository } from 'typeorm';

import * as crypto from 'crypto';
import { Client } from 'ssh2';

@Injectable()
export class SshListService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly encryptionKey = '12345678901234567890123456789012';
  constructor(
    @InjectRepository(SshList)
    private readonly repo: Repository<SshList>,
  ) {}

  async runSSHCommand(sshList_id: any): Promise<string> {
    const sshConfig = await this.repo.findOne({ where: { id: sshList_id.id } });
    const decPass = await this.getDecryptedCredentials(sshList_id.id);

    if (!sshConfig) {
      throw new HttpException(
        `SSH config with id ${sshList_id.id} not found`,
        400,
      );
    }

    try {
      return await new Promise((resolve, reject) => {
        const conn = new Client();

        conn
          .on('ready', () => {
            conn.exec('uptime', (err, stream) => {
              if (err) {
                conn.end();
                return reject(err);
              }

              let output = '';

              stream
                .on('data', (data) => (output += data.toString()))
                .on('close', () => {
                  conn.end();
                  resolve(output);
                })
                .stderr.on('data', (data) => reject(data.toString()));
            });
          })
          .on('error', (err) => reject(err))
          .connect({
            host: sshConfig.address,
            port: Number(sshConfig.port),
            username: sshConfig.username,
            password: decPass.password,
            // passphrase: sshConfig.passphrase,
            // privateKey: cleanKey,
            // debug: (info) => console.log('SSH Debug:', info),
            algorithms: {
              serverHostKey: ['ssh-rsa', 'rsa-sha2-512', 'rsa-sha2-256'],
            },
          });
      });
    } catch (err) {
      console.error('SSH Error:', err);
      throw new BadRequestException(`Connection failed: ${err.message}`);
    }
  }

  private encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(
      this.algorithm,
      this.encryptionKey,
      iv,
    );

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }

  private decrypt(text: string): string {
    const parts = text.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];

    const decipher = crypto.createDecipheriv(
      this.algorithm,
      this.encryptionKey,
      iv,
    );
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  async create(dto: CreateSshListDto, file: any) {
    // if (!file) {
    //   throw new HttpException('SSH key file is required', 400);
    // }

    // const fileUrl = `./uploads/sshkeys/${file.filename}`;

    const encryptedPassword = dto.password ? this.encrypt(dto.password) : '';
    const encryptedPassphrase = dto.passphrase
      ? this.encrypt(dto.passphrase)
      : '';

    const item = this.repo.create({
      ...dto,
      // ssh_key: fileUrl,
      password: encryptedPassword,
      passphrase: encryptedPassphrase,
    });

    return this.repo.save(item);
  }

  async getDecryptedCredentials(id: number) {
    const item = await this.repo.findOne({ where: { id } });

    if (!item) {
      throw new HttpException('SSH configuration not found', 404);
    }

    return {
      ...item,
      password: item.password ? this.decrypt(item.password) : '',
      passphrase: item.passphrase ? this.decrypt(item.passphrase) : '',
    };
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
