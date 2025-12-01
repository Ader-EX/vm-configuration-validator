// src/controller/vm-prereq.controller.ts
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { VmPrereqService } from 'src/service/prereq-service';
import { SshListService } from 'src/service/ssh-list.service';

@Controller('vm-prereq')
export class VmPrereqController {
  constructor(
    private readonly vmPrereqService: VmPrereqService,
    private readonly repo: SshListService,
  ) {}

  /**
   * GET /vm-prereq/validate/:serverId
   * Query params: ?username=wmuser&group=wmuser&configPath=/opt/app/config
   */
  @Get('validate/:serverId')
  async validateAll(
    @Param('serverId') serverId: string,
    @Query('username') username?: string,
    @Query('group') group?: string,
    @Query('configPath') configPath?: string,
  ) {
    try {
      return await this.vmPrereqService.validateAll(+serverId, {
        username,
        group,
        configPath,
      });
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Validation failed',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * GET /vm-prereq/validate/:serverId/:checkType
   * checkType: userGroup, ulimit, securityLimits, sysctl, jvm, threadPool, garbageCollector
   */
  // @Get('validate/:serverId/:checkType')
  // async validateSpecific(
  //   @Param('serverId') serverId: string,
  //   @Param('checkType') checkType: string,
  //   @Query('username') username?: string,
  //   @Query('group') group?: string,
  //   @Query('configPath') configPath?: string,
  // ) {
  //   try {
  //     const validCheckTypes = [
  //       'userGroup',
  //       'ulimit',
  //       'securityLimits',
  //       'sysctl',
  //       'jvm',
  //       'threadPool',
  //       'garbageCollector',
  //     ];

  //     if (!validCheckTypes.includes(checkType)) {
  //       throw new HttpException(
  //         {
  //           success: false,
  //           message: `Invalid check type. Valid types: ${validCheckTypes.join(', ')}`,
  //         },
  //         HttpStatus.BAD_REQUEST,
  //       );
  //     }

  //     const result = await this.vmPrereqService.validateAll(+serverId, {
  //       username,
  //       group,
  //       configPath,
  //     });

  //     const specificValidation = result.validations.find(
  //       (v) => v.key === checkType,
  //     );

  //     return {
  //       serverId: result.serverId,
  //       serverName: result.serverName,
  //       timestamp: result.timestamp,
  //       validation: specificValidation,
  //     };
  //   } catch (error) {
  //     throw new HttpException(
  //       {
  //         success: false,
  //         message: 'Validation failed',
  //         error: error.message,
  //       },
  //       HttpStatus.INTERNAL_SERVER_ERROR,
  //     );
  //   }
  // }
  @Post('setup/:serverId/user-group')
  async setupUserGroup(
    @Param('serverId') serverId: string,
    @Body() body: { username?: string; group?: string; password?: string },
  ) {
    try {
      const result = await this.vmPrereqService.setupUserGroup(
        +serverId,
        body.username,
        body.group,
        body.password,
      );
      return {
        success: true,
        message: 'User and group setup completed',
        output: result,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'User and group setup failed',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('validate/:serverId/user-group')
  async validateUserGroup(
    @Param('serverId') serverId: string,
    @Query('username') username?: string,
    @Query('group') group?: string,
  ) {
    try {
      const result = await this.vmPrereqService.checkUserGroup(
        +serverId,
        username || 'wmuser',
        group || 'wmuser',
      );
      return {
        success: result.status === 'pass',
        validation: result,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'User and group validation failed',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Setup ulimit
   * POST /vm-prereq/setup/ulimit/:serverId
   * Body: { "username": "oracle" }
   */
  @Post('setup/ulimit/:serverId')
  async setupUlimit(
    @Param('serverId') serverId: string,
    @Body() body: { username?: string },
  ) {
    try {
      const result = await this.vmPrereqService.setupUlimit(
        +serverId,
        body.username,
      );
      return {
        success: true,
        message: 'Ulimit setup completed',
        output: result,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Ulimit setup failed',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Setup sysctl
   * POST /vm-prereq/setup/sysctl/:serverId
   */
  @Post('setup/sysctl/:serverId')
  async setupSysctl(@Param('serverId') serverId: string) {
    try {
      const result = await this.vmPrereqService.setupSysctl(+serverId);
      return {
        success: true,
        message: 'Sysctl setup completed',
        output: result,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Sysctl setup failed',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Setup all prerequisites
   * POST /vm-prereq/setup/all/:serverId
   * Body: { "username": "oracle", "group": "dba" }
   */
  @Post('setup/all/:serverId')
  async setupAll(
    @Param('serverId') serverId: string,
    @Body() body: { username?: string; group?: string },
  ) {
    try {
      const result = await this.vmPrereqService.setupAll(+serverId, body);
      return {
        success: true,
        message: 'All setups completed',
        results: result,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Setup all failed',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Validate and auto-fix if needed
   * POST /vm-prereq/validate-and-fix/:serverId
   * Body: { "username": "oracle", "group": "dba", "autoFix": true }
   */
  @Post('validate-and-fix/:serverId')
  async validateAndFix(
    @Param('serverId') serverId: string,
    @Body() body: { username?: string; group?: string; autoFix?: boolean },
  ) {
    try {
      const validation = await this.vmPrereqService.validateAll(
        +serverId,
        body,
      );

      if (body.autoFix && validation.overallStatus !== 'pass') {
        const failedChecks = validation.validations.filter(
          (v) => v.status === 'fail',
        );

        const setupResults: any = {};

        for (const check of failedChecks) {
          try {
            if (check.key === 'userGroup') {
              setupResults.userGroup =
                await this.vmPrereqService.setupUserGroup(
                  +serverId,
                  body.username,
                  body.group,
                );
            } else if (
              check.key === 'ulimit' ||
              check.key === 'securityLimits'
            ) {
              setupResults.ulimit = await this.vmPrereqService.setupUlimit(
                +serverId,
                body.username,
              );
            } else if (check.key === 'sysctl') {
              // setupResults.sysctl =
              //   await this.vmPrereqService.setupSysctl(+serverId);
            }
          } catch (error) {
            setupResults[check.key] = { error: error.message };
          }
        }

        // Re-validate after fixes
        const revalidation = await this.vmPrereqService.validateAll(
          +serverId,
          body,
        );

        return {
          success: true,
          initialValidation: validation,
          setupResults,
          finalValidation: revalidation,
        };
      }

      return {
        success: true,
        validation,
        message: body.autoFix
          ? 'No fixes needed, all checks passed'
          : 'Validation completed. Use autoFix:true to automatically fix issues',
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Validate and fix operation failed',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get validation summary for multiple servers
   * POST /vm-prereq/validate/batch
   * Body: { "serverIds": [1, 2, 3], "username": "oracle", "group": "dba" }
   */
  @Post('validate/batch')
  async validateBatch(
    @Body()
    body: {
      serverIds: number[];
      username?: string;
      group?: string;
      configPath?: string;
    },
  ) {
    try {
      if (!body.serverIds || !Array.isArray(body.serverIds)) {
        throw new HttpException(
          {
            success: false,
            message: 'serverIds array is required',
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      const results = await Promise.allSettled(
        body.serverIds.map((serverId) =>
          this.vmPrereqService.validateAll(serverId, {
            username: body.username,
            group: body.group,
            configPath: body.configPath,
          }),
        ),
      );

      const successful = results
        .filter((r) => r.status === 'fulfilled')
        .map((r: any) => r.value);

      const failed = results
        .filter((r) => r.status === 'rejected')
        .map((r: any, index) => ({
          serverId: body.serverIds[index],
          error: r.reason?.message || 'Unknown error',
        }));

      return {
        success: true,
        total: body.serverIds.length,
        successful: successful.length,
        failed: failed.length,
        results: successful,
        errors: failed,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Batch validation failed',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get health summary
   * GET /vm-prereq/health/:serverId
   */
  @Get('health/:serverId')
  async getHealthSummary(@Param('serverId') serverId: string) {
    try {
      const validation = await this.vmPrereqService.validateAll(+serverId, {});

      const passCount = validation.validations.filter(
        (v) => v.status === 'pass',
      ).length;
      const failCount = validation.validations.filter(
        (v) => v.status === 'fail',
      ).length;
      const errorCount = validation.validations.filter(
        (v) => v.status === 'error',
      ).length;

      const healthScore = Math.round(
        (passCount / validation.validations.length) * 100,
      );

      return {
        success: true,
        serverId: validation.serverId,
        serverName: validation.serverName,
        timestamp: validation.timestamp,
        overallStatus: validation.overallStatus,
        healthScore,
        summary: {
          total: validation.validations.length,
          passed: passCount,
          failed: failCount,
          errors: errorCount,
        },
        validations: validation.validations.map((v) => ({
          key: v.key,
          label: v.label,
          status: v.status,
          message: v.message,
        })),
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Health check failed',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
