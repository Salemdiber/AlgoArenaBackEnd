import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  Header,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ChallengesService } from './challenges.service';
import { CreateChallengeDto } from './dto/create-challenge.dto';
import { UpdateChallengeDto } from './dto/update-challenge.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SpeedChallengeGuard } from '../auth/speed-challenge.guard';

@Controller('challenges')
export class ChallengesController {
  constructor(private readonly service: ChallengesService) {}

  // POST /challenges - Create a new challenge
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard, SpeedChallengeGuard)
  create(@Body() dto: CreateChallengeDto) {
    return this.service.create(dto);
  }

  // GET /challenges - Retrieve all challenges
  @Get()
  @Header('Cache-Control', 'private, max-age=60')
  async findAll() {
    const challenges = await this.service.findAll();
    return { challenges };
  }

  // GET /challenges/public - Retrieve all published challenges
  @Get('public')
  @Header('Cache-Control', 'public, max-age=60')
  findPublished(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.service.findPublished({
      page: Number(page) || 1,
      limit: Number(limit) || 20,
    });
  }

  // GET /challenges/public/:id - Retrieve a specific published challenge by id
  @Get('public/:id')
  @Header('Cache-Control', 'public, max-age=60')
  findPublishedById(@Param('id') id: string) {
    return this.service.findPublishedById(id);
  }

  // GET /challenges/:id - Retrieve a specific challenge by id
  @Get(':id')
  @UseGuards(JwtAuthGuard, SpeedChallengeGuard)
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  // PATCH /challenges/:id - Update a challenge by id
  @Patch(':id')
  @UseGuards(JwtAuthGuard, SpeedChallengeGuard)
  update(@Param('id') id: string, @Body() dto: UpdateChallengeDto) {
    return this.service.update(id, dto);
  }

  // DELETE /challenges/:id - Remove a challenge by id
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard, SpeedChallengeGuard)
  async remove(@Param('id') id: string) {
    await this.service.remove(id);
  }
}
