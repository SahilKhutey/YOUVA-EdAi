import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { SubjectsService } from './subjects.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('subjects')
export class SubjectsController {
  constructor(private readonly subjectsService: SubjectsService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll() {
    return this.subjectsService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.subjectsService.findOne(id);
  }
}
