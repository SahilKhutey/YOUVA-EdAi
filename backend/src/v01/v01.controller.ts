import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Headers,
  ForbiddenException,
} from '@nestjs/common';
import { V01Service } from './v01.service';
import {
  EnrollStudentDto,
  AttemptSubmissionDto,
  TeacherOverrideDto,
} from './v01.types';

@Controller('v01')
export class V01Controller {
  constructor(private readonly v01Service: V01Service) {}

  /**
   * Enroll a student with documented guardian consent (Step 0 & 9).
   */
  @Post('student/enroll')
  enrollStudent(@Body() dto: EnrollStudentDto) {
    return this.v01Service.enrollStudent(dto);
  }

  /**
   * Get student record.
   */
  @Get('student/:id')
  getStudent(@Param('id') id: string) {
    return this.v01Service.getStudent(id);
  }

  /**
   * Starts a learning session for the student, returning diagnostic / first question.
   */
  @Get('student/:id/session/start')
  startSession(@Param('id') id: string) {
    return this.v01Service.startSession(id);
  }

  /**
   * Submits student attempt on an item.
   */
  @Post('student/:id/attempt')
  submitAttempt(
    @Param('id') id: string,
    @Body() dto: AttemptSubmissionDto,
  ) {
    return this.v01Service.submitAttempt(id, dto.itemId, dto.answer);
  }

  /**
   * Returns attempt history for the student.
   */
  @Get('student/:id/history')
  getStudentHistory(@Param('id') id: string) {
    return this.v01Service.getAttemptsForStudent(id);
  }

  /**
   * Teacher Overview table for the concept.
   */
  @Get('teacher/overview')
  getTeacherOverview(@Headers('x-teacher-id') teacherId?: string) {
    return this.v01Service.getTeacherOverview(teacherId || 'teacher-pilot');
  }

  /**
   * Teacher Override action: flags "NEEDS_HELP" or sets next item.
   * Student cannot call this (Step 10 security requirement).
   */
  @Post('teacher/override')
  setTeacherOverride(
    @Body() dto: TeacherOverrideDto,
    @Headers('x-role') role?: string,
  ) {
    if (role === 'STUDENT') {
      throw new ForbiddenException('Students cannot override their own learning plan.');
    }
    return this.v01Service.setTeacherOverride(dto);
  }

  /**
   * Clears an active override.
   */
  @Delete('teacher/override/:studentId')
  clearTeacherOverride(
    @Param('studentId') studentId: string,
    @Headers('x-teacher-id') teacherId?: string,
    @Headers('x-role') role?: string,
  ) {
    if (role === 'STUDENT') {
      throw new ForbiddenException('Students cannot clear teacher overrides.');
    }
    return this.v01Service.clearTeacherOverride(teacherId || 'teacher-pilot', studentId);
  }
}
