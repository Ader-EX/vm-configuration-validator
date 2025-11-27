import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
  Redirect,
  Req,
} from '@nestjs/common';

export class CatClassDTO {
  name: string;
  age: number;
  breed: string;
}

@Controller('cats')
export class CatsController {
  @Get()
  @HttpCode(200)
  findAll(@Req() request: Request): string {
    return 'meow';
  }

  @Get('redirect')
  @Redirect('https://nestjs.com', 301)
  redirectTest(): null {
    return null;
  }

  @Get(':id')
  findOne(@Param('id') id: number, @Body() name: string): string {
    return `this returns a cat with id ${id} ${name}`;
  }

  @Get()
  async promiseFindAll(): Promise<any[]> {
    return [];
  }

  @Post()
  async createCats(@Body() request: CatClassDTO): Promise<any> {
    return 'This action adds a new cat';
  }
}
