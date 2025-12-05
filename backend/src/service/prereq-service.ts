// src/service/vm-prereq.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { Client } from 'ssh2';
import { SshListService } from './ssh-list.service';
import * as fs from 'fs';
import { InjectRepository } from '@nestjs/typeorm';

import { SshList } from 'src/entity/ssh-list.entity';
import { Repository } from 'typeorm';

// 1. Cek user udah ada di dba apa belom, posisi user group dan user cek wmuser ada atau tidaknya.
//    kalau belum, kita bisa klik 1 tombol utk create usernya
// 2. cek batasan resource ulimit, patokanya
//    Open files ≥ 10.240
//    Max process ≥ 2.047
//    Stack size ≥ 8.192 KB
// 3. Cek security limit, cek nprocnya aja
// 4. cek Sysctl,
//    vm.max_map_count ≥ 262144
//    fs.file-max ≥ 500000
//    net.core.somaxconn ≥ 1024
// 5. Cek JVM versinya diatas 11?? sama udah diset JAVA_HOMEnya?
// 6. Cek Thread pool di application.properties
// 7. Cek Garbage collectornya make heap apa (Xms/Xmx) sama GC modern apa belom

export interface ValidationResult {
  key: string;
  label: string;
  status: 'pass' | 'fail' | 'error';
  message: string;
  details?: any;
}

export interface PrereqCheckResult {
  serverId: number;
  serverName: string;
  timestamp: Date;
  validations: ValidationResult[];
  overallStatus: 'pass' | 'partial' | 'fail';
}

@Injectable()
export class VmPrereqService {
  constructor(
    private readonly sshListService: SshListService,
    @InjectRepository(SshList)
    private readonly repo: Repository<SshList>,
  ) {}

  private async executeSSH(serverId: number, command: string): Promise<string> {
    const server = await this.sshListService.getDecryptedCredentials(serverId);
    if (!server) {
      throw new NotFoundException(`Server with ID ${serverId} not found`);
    }

    return new Promise((resolve, reject) => {
      const conn = new Client();
      let output = '';
      let errorOutput = '';

      conn
        .on('ready', () => {
          conn.exec(command, (err, stream) => {
            if (err) {
              conn.end();
              return reject(err);
            }

            stream
              .on('close', (code, signal) => {
                conn.end();
                if (code !== 0 && !output) {
                  reject(
                    new Error(
                      errorOutput || `Command failed with code ${code}`,
                    ),
                  );
                } else {
                  resolve(output);
                }
              })
              .on('data', (data: Buffer) => {
                output += data.toString();
              })
              .stderr.on('data', (data: Buffer) => {
                errorOutput += data.toString();
              });
          });
        })
        .on('error', (err) => {
          reject(err);
        })
        .connect({
          host: server.address,
          port: Number(server.port) || 22,
          username: server.username,
          // passphrase: server.passphrase,
          password: server.password,
          // privateKey: server.ssh_key
          //   ? fs.readFileSync(server.ssh_key.toString())
          //   : undefined,
        });
    });
  }

  async setupUserGroup(
    serverId: number,
    username: string = 'wmuser',
    group: string = 'wmuser',
    password: string = 'wmuser123',
  ): Promise<string> {
    const script = `
    # Create group if it doesn't exist
    sudo groupadd -f ${group}
    
    # Create user if it doesn't exist
    sudo useradd -m -g ${group} -s /bin/bash ${username} 2>/dev/null || echo "User already exists"
    
    # Set password for the user
    echo "${username}:${password}" | sudo chpasswd
    
    # Add user to group
    sudo usermod -aG ${group} ${username}
    
    # Verify user creation
    id ${username}
    
    # Optional: Grant sudo privileges to wmuser (if needed)
    # Uncomment the line below if wmuser needs sudo access
    # echo "${username} ALL=(ALL) NOPASSWD:ALL" | sudo tee /etc/sudoers.d/${username}
  `;
    return await this.executeSSH(serverId, script);
  }

  async setupUlimit(
    serverId: number,
    username: string = 'wmuser',
  ): Promise<string> {
    const script = `
    # Backup original file
    sudo cp /etc/security/limits.conf /etc/security/limits.conf.backup
    
    # Remove old entries for this user if they exist
    sudo sed -i "/${username}/d" /etc/security/limits.conf
    
    # Add new limits
    sudo bash -c "cat >> /etc/security/limits.conf <<EOF
    # WebMethods user limits
    ${username} soft nofile 10240
    ${username} hard nofile 65536
    ${username} soft nproc 2047
    ${username} hard nproc 16384
    ${username} soft stack 10240
    ${username} hard stack 32768
    EOF"
    
    # Verify the configuration
    echo "Current limits for ${username}:"
    cat /etc/security/limits.conf | grep ${username}
  `;
    return await this.executeSSH(serverId, script);
  }

  async setupSysctl(serverId: number): Promise<string> {
    const script = `
      # Backup original file
      sudo cp /etc/sysctl.conf /etc/sysctl.conf.backup

      # Remove old WebMethods entries if they exist
      sudo sed -i "/# WebMethods kernel parameters/,+4d" /etc/sysctl.conf

      # Add new kernel parameters
      sudo bash -c "cat >> /etc/sysctl.conf <<EOF

      # WebMethods kernel parameters
      vm.max_map_count = 262144
      fs.file-max = 500000
      net.core.somaxconn = 1024
      net.ipv4.ip_local_port_range = 1024 65535
      EOF"

      # Apply the changes
      sudo sysctl -p

      # Verify the settings
      echo "Current sysctl settings:"
      sysctl vm.max_map_count fs.file-max net.core.somaxconn net.ipv4.ip_local_port_range
    `;
    return await this.executeSSH(serverId, script);
  }

  async checkUserGroup(
    serverId: number,
    username: string = 'wmuser',
    group: string = 'wmuser',
  ): Promise<ValidationResult> {
    try {
      const command = `id ${username} 2>&1 && getent group ${group} 2>&1`;
      const output = await this.executeSSH(serverId, command);

      const userExists = output.includes('uid=') && output.includes(username);
      const groupExists = output.includes(group);
      const userInGroup = output.includes('groups=') && output.includes(group);

      if (userExists && groupExists && userInGroup) {
        return {
          key: 'userGroup',
          label: 'User & Group Setup',
          status: 'pass',
          message: `User '${username}' exists and is in group '${group}'`,
          details: { output: output.trim() },
        };
      } else {
        return {
          key: 'userGroup',
          label: 'User & Group Setup',
          status: 'fail',
          message: `User or group configuration incomplete`,
          details: {
            userExists,
            groupExists,
            userInGroup,
            output: output.trim(),
          },
        };
      }
    } catch (error) {
      return {
        key: 'userGroup',
        label: 'User & Group Setup',
        status: 'error',
        message: error.message,
      };
    }
  }

  async verifyUserPassword(
    serverId: number,
    username: string = 'wmuser',
  ): Promise<boolean> {
    try {
      const command = `sudo passwd -S ${username}`;
      const output = await this.executeSSH(serverId, command);

      return output.includes(`${username} P`);
    } catch (error) {
      console.error('Error verifying password:', error);
      return false;
    }
  }

  // 2. Check Ulimit
  async checkUlimit(
    serverId: number,
    username: string = 'oracle',
  ): Promise<ValidationResult> {
    try {
      const command = `sudo -u ${username} bash -c 'ulimit -n; ulimit -u; ulimit -s'`;
      const output = await this.executeSSH(serverId, command);

      const lines = output.trim().split('\n');
      const nofile = parseInt(lines[0]);
      const nproc = parseInt(lines[1]);
      const stack = parseInt(lines[2]);

      const checks = {
        nofile: nofile >= 10240,
        nproc: nproc >= 2047,
        stack: stack >= 8192,
      };

      const allPassed = Object.values(checks).every((v) => v);

      return {
        key: 'ulimit',
        label: 'Ulimit Configuration',
        status: allPassed ? 'pass' : 'fail',
        message: allPassed
          ? 'All ulimit settings are adequate'
          : 'Some ulimit settings are below threshold',
        details: { nofile, nproc, stack, checks },
      };
    } catch (error) {
      return {
        key: 'ulimit',
        label: 'Ulimit Configuration',
        status: 'error',
        message: error.message,
      };
    }
  }

  // 3. Check Security Limits
  async checkSecurityLimits(serverId: number): Promise<ValidationResult> {
    try {
      const command = `cat /etc/security/limits.conf 2>&1; echo "---DIVIDER---"; ls -la /etc/security/limits.d/ 2>&1`;
      const output = await this.executeSSH(serverId, command);

      const hasLimitsConf =
        output.includes('nofile') || output.includes('nproc');
      const hasLimitsDir =
        output.includes('limits.d') && !output.includes('No such file');

      return {
        key: 'securityLimits',
        label: 'Security Limits',
        status: hasLimitsConf || hasLimitsDir ? 'pass' : 'fail',
        message:
          hasLimitsConf || hasLimitsDir
            ? 'Security limits configured'
            : 'Security limits not configured',
        details: { hasLimitsConf, hasLimitsDir },
      };
    } catch (error) {
      return {
        key: 'securityLimits',
        label: 'Security Limits',
        status: 'error',
        message: error.message,
      };
    }
  }

  // 4. Check Sysctl
  async checkSysctl(serverId: number): Promise<ValidationResult> {
    try {
      const command = `sysctl vm.max_map_count fs.file-max net.core.somaxconn net.ipv4.ip_local_port_range 2>&1`;
      const output = await this.executeSSH(serverId, command);

      const params = {
        'vm.max_map_count': parseInt(
          output.match(/vm\.max_map_count = (\d+)/)?.[1] || '0',
        ),
        'fs.file-max': parseInt(
          output.match(/fs\.file-max = (\d+)/)?.[1] || '0',
        ),
        'net.core.somaxconn': parseInt(
          output.match(/net\.core\.somaxconn = (\d+)/)?.[1] || '0',
        ),
      };

      const checks = {
        'vm.max_map_count': params['vm.max_map_count'] >= 262144,
        'fs.file-max': params['fs.file-max'] >= 500000,
        'net.core.somaxconn': params['net.core.somaxconn'] >= 1024,
      };

      const allPassed = Object.values(checks).every((v) => v);

      return {
        key: 'sysctl',
        label: 'Sysctl Configuration',
        status: allPassed ? 'pass' : 'fail',
        message: allPassed
          ? 'All sysctl parameters are adequate'
          : 'Some sysctl parameters need tuning',
        details: { params, checks },
      };
    } catch (error) {
      return {
        key: 'sysctl',
        label: 'Sysctl Configuration',
        status: 'error',
        message: error.message,
      };
    }
  }

  // 5. Check JVM
  async checkJvm(serverId: number): Promise<ValidationResult> {
    try {
      const command = `java -version 2>&1; echo "---"; echo $JAVA_HOME`;
      const output = await this.executeSSH(serverId, command);

      const versionMatch = output.match(/version "(\d+)\.(\d+)/);
      const majorVersion = versionMatch ? parseInt(versionMatch[1]) : 0;
      const hasJavaHome =
        output.includes('JAVA_HOME') ||
        output.split('---')[1]?.trim().length > 0;

      const isValidVersion = majorVersion >= 11;

      return {
        key: 'jvm',
        label: 'JVM Installation',
        status: isValidVersion && hasJavaHome ? 'pass' : 'fail',
        message:
          isValidVersion && hasJavaHome
            ? `Java ${majorVersion} installed`
            : 'Java installation not found or has an outdated version (<11)',
        details: { majorVersion, hasJavaHome, output: output.trim() },
      };
    } catch (error) {
      return {
        key: 'jvm',
        label: 'JVM Installation',
        status: 'error',
        message: error.message,
      };
    }
  }

  // 6. Check Thread Pool
  async checkThreadPool(
    serverId: number,
    configPath: string = '/opt/app/config/application.properties',
  ): Promise<ValidationResult> {
    try {
      const command = `cat ${configPath} 2>&1 | grep -E 'thread|pool' || echo "No thread pool config found"`;
      const output = await this.executeSSH(serverId, command);

      const hasThreadConfig =
        output.includes('thread') &&
        !output.includes('No thread pool config found');

      return {
        key: 'threadPool',
        label: 'Thread Pool Settings',
        status: hasThreadConfig ? 'pass' : 'fail',
        message: hasThreadConfig
          ? 'Thread pool configured'
          : 'Thread pool not configured',
        details: { configPath, output: output.trim() },
      };
    } catch (error) {
      return {
        key: 'threadPool',
        label: 'Thread Pool Settings',
        status: 'error',
        message: error.message,
      };
    }
  }

  // 7. Check Garbage Collector
  async checkGarbageCollector(serverId: number): Promise<ValidationResult> {
    try {
      const command = `ps aux | grep '[j]ava' | grep -E 'UseG1GC|UseZGC|UseShenandoahGC|Xms|Xmx' | head -1 | grep -q . || echo "No JVM process found"`;
      const output = await this.executeSSH(serverId, command);

      const hasGC =
        output.includes('UseG1GC') ||
        output.includes('UseZGC') ||
        output.includes('UseShenandoahGC');
      const hasHeap = output.includes('Xms') && output.includes('Xmx');

      return {
        key: 'garbageCollector',
        label: 'Garbage Collector Config',
        status: hasGC && hasHeap ? 'pass' : 'fail',
        message:
          hasGC && hasHeap
            ? 'GC properly configured'
            : 'GC configuration missing',
        details: { hasGC, hasHeap, output: output.trim() },
      };
    } catch (error) {
      return {
        key: 'garbageCollector',
        label: 'Garbage Collector Config',
        status: 'error',
        message: error.message,
      };
    }
  }

  // Main validation method
  async validateAll(
    serverId: number,
    options?: any,
  ): Promise<PrereqCheckResult> {
    const server = await this.sshListService.findOne(serverId);
    if (!server) {
      throw new NotFoundException(`Server with ID ${serverId} not found`);
    }

    const validations: ValidationResult[] = await Promise.all([
      this.checkUserGroup(serverId, options?.username, options?.group),
      this.checkUlimit(serverId, options?.username),
      this.checkSecurityLimits(serverId),
      this.checkSysctl(serverId),
      this.checkJvm(serverId),
      this.checkThreadPool(serverId, options?.configPath),
      this.checkGarbageCollector(serverId),
    ]);

    const passCount = validations.filter((v) => v.status === 'pass').length;
    const totalCount = validations.length;

    let overallStatus: 'pass' | 'partial' | 'fail';
    if (passCount === totalCount) {
      overallStatus = 'pass';
    } else if (passCount > 0) {
      overallStatus = 'partial';
    } else {
      overallStatus = 'fail';
    }

    return {
      serverId,
      serverName: server.name || server.address,
      timestamp: new Date(),
      validations,
      overallStatus,
    };
  }

  async setupAll(serverId: number, options?: any): Promise<any> {
    const results: {
      userGroup: any;
      ulimit: any;
      sysctl: any;
    } = {
      userGroup: null,
      ulimit: null,
      sysctl: null,
    };

    try {
      results.userGroup = await this.setupUserGroup(
        serverId,
        options?.username,
        options?.group,
      );
    } catch (error) {
      results.userGroup = { error: error.message };
    }

    try {
      results.ulimit = await this.setupUlimit(serverId, options?.username);
    } catch (error) {
      results.ulimit = { error: error.message };
    }

    // try {
    //   results.sysctl = await this.set(serverId);
    // } catch (error) {
    //   results.sysctl = { error: error.message };
    // }

    return results;
  }
}
