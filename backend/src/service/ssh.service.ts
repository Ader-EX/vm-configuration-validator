import { Injectable } from '@nestjs/common';
import { Client } from 'ssh2';
import { readFileSync } from 'fs';
import { SshListService } from './ssh-list.service';
import { InjectRepository } from '@nestjs/typeorm';
import { SshList } from 'src/entity/ssh-list.entity';
import { Repository } from 'typeorm';

@Injectable()
export class SshService {
  constructor(
    @InjectRepository(SshList)
    private readonly repo: Repository<SshList>,
  ) {}

  playgroundSSHCommand(): Promise<string> {
    return new Promise((resolve, reject) => {
      const pass = process.env.PASSWORD;
      console.log(
        'Password:',
        pass ? `**** (length: ${pass.length})` : 'undefined ❌',
      );

      const conn = new Client();
      conn
        .on('ready', () => {
          console.log('Client :: ready');
          conn.shell((err, stream) => {
            if (err) throw err;
            stream
              .on('close', () => {
                console.log('Stream :: close');
                conn.end();
              })
              .on('data', (data) => {
                console.log('OUTPUT: ' + data);
              });
            stream.end('ls -l\nexit\n');
          });
        })
        .connect({
          host: '43.157.250.132',
          port: 22,
          username: 'ubuntu',
          password: process.env.PASSWORD,
          privateKey: readFileSync('id_rsa'),
        });
    });
  }

  async runSSHCommand(sshList_id: any): Promise<string> {
    console.log('ID -> ', sshList_id);
    const sshConfig = await this.repo.findOne({ where: { id: sshList_id.id } });

    if (!sshConfig) {
      throw new Error(`SSH config with id ${sshList_id} not found`);
    }

    console.log('\n===== SSH CONNECTION DEBUG =====');
    console.log('Host:', sshConfig.address);
    console.log('Port:', sshConfig.port);
    console.log('Username:', sshConfig.username);

    const key = sshConfig.ssh_key ? readFileSync(sshConfig.ssh_key) : undefined;
    console.log(key?.toString());

    return new Promise((resolve, reject) => {
      const conn = new Client();

      conn
        .on('ready', () => {
          console.log('Client :: ready');

          conn.exec('uptime', (err, stream) => {
            if (err) {
              conn.end();
              return reject(err);
            }

            let output = '';

            stream
              .on('data', (data) => {
                output += data.toString();
              })
              .on('close', () => {
                conn.end();
                resolve(output);
              })
              .stderr.on('data', (data) => {
                reject(data.toString());
              });
          });
        })
        .on('error', (err) => {
          console.error('SSH Connection Error:', err);
          reject(err);
        })
        .connect({
          host: sshConfig.address,
          port: Number(sshConfig.port),
          username: sshConfig.username,
          password: process.env.PASSWORD,
        });
    });
  }
}
