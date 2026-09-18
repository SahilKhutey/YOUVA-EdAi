import { Injectable, ForbiddenException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { ParentTeacherNote, SharedDeviceSession, DeviceMode } from './early-childhood-types';
import * as crypto from 'crypto';

@Injectable()
export class ParentTeacherCoordinationService {
  private notes: Map<string, ParentTeacherNote> = new Map();
  private sharedDeviceSessions: Map<string, SharedDeviceSession> = new Map();
  private deviceHashedPins: Map<string, string> = new Map(); // deviceId -> hashedPin
  private learnerDeviceCaches: Map<string, Set<string>> = new Map(); // learnerId -> cached keys

  constructor() {
    // Seed standard test pin for shared devices (e.g., '1234')
    const defaultSalt = 'youva-child-safety-salt';
    const hashedDefault = crypto.pbkdf2Sync('1234', defaultSalt, 1000, 32, 'sha256').toString('hex');
    this.deviceHashedPins.set('default-device', hashedDefault);
    this.deviceHashedPins.set('tablet-family-01', hashedDefault);
  }

  // --- Parent-Teacher Communication Bridge ---

  public createNote(
    learnerId: string,
    teacherId: string,
    parentId: string,
    subject: string,
    message: string,
    tags: string[] = ['PROGRESS_UPDATE']
  ): ParentTeacherNote {
    if (!learnerId || !teacherId || !parentId || !subject || !message) {
      throw new BadRequestException('All fields required for ParentTeacherNote');
    }

    const noteId = `note-${crypto.randomUUID()}`;
    const note: ParentTeacherNote = {
      noteId,
      learnerId,
      teacherId,
      parentId,
      subject,
      message,
      createdAt: new Date().toISOString(),
      readByParent: false,
      readByTeacher: true,
      tags,
    };

    this.notes.set(noteId, note);
    return note;
  }

  public getNotesForLearner(learnerId: string): ParentTeacherNote[] {
    return Array.from(this.notes.values()).filter((n) => n.learnerId === learnerId);
  }

  public getNotesForParent(parentId: string): ParentTeacherNote[] {
    return Array.from(this.notes.values()).filter((n) => n.parentId === parentId);
  }

  public getNotesForTeacher(teacherId: string): ParentTeacherNote[] {
    return Array.from(this.notes.values()).filter((n) => n.teacherId === teacherId);
  }

  public markNoteRead(noteId: string, readerRole: 'PARENT' | 'TEACHER'): ParentTeacherNote {
    const note = this.notes.get(noteId);
    if (!note) {
      throw new BadRequestException(`Note ${noteId} not found`);
    }

    if (readerRole === 'PARENT') {
      note.readByParent = true;
    } else {
      note.readByTeacher = true;
    }

    this.notes.set(noteId, note);
    return note;
  }

  // --- Shared-Device Mode & Sibling Isolation ---

  public registerDevicePin(deviceId: string, pin: string): void {
    if (!pin || pin.length < 4) {
      throw new BadRequestException('Adult PIN must be at least 4 digits');
    }
    const salt = 'youva-child-safety-salt';
    const hash = crypto.pbkdf2Sync(pin, salt, 1000, 32, 'sha256').toString('hex');
    this.deviceHashedPins.set(deviceId, hash);
  }

  public startDeviceSession(deviceId: string, initialMode: DeviceMode = 'CHILD', learnerId?: string): SharedDeviceSession {
    const session: SharedDeviceSession = {
      deviceId,
      activeLearnerId: learnerId,
      currentMode: initialMode,
      pinVerified: initialMode === 'CHILD', // Child mode does not require adult pin
      sessionStartedAt: new Date().toISOString(),
      sessionExpiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    };

    this.sharedDeviceSessions.set(deviceId, session);
    return session;
  }

  public switchMode(deviceId: string, targetMode: DeviceMode, pin?: string): SharedDeviceSession {
    let session = this.sharedDeviceSessions.get(deviceId);
    if (!session) {
      session = this.startDeviceSession(deviceId, 'CHILD');
    }

    // Transitioning from CHILD to PARENT or TEACHER requires Adult PIN verification
    if (targetMode === 'PARENT' || targetMode === 'TEACHER') {
      if (!pin) {
        throw new UnauthorizedException('Adult PIN required to enter Parent or Teacher mode');
      }
      const salt = 'youva-child-safety-salt';
      const providedHash = crypto.pbkdf2Sync(pin, salt, 1000, 32, 'sha256').toString('hex');
      const storedHash = this.deviceHashedPins.get(deviceId) || this.deviceHashedPins.get('default-device');

      if (!storedHash || providedHash !== storedHash) {
        throw new UnauthorizedException('Invalid Adult PIN for device mode transition');
      }

      session.pinVerified = true;
      session.currentMode = targetMode;
    } else {
      // Returning to CHILD mode
      session.currentMode = 'CHILD';
      session.pinVerified = false;
    }

    this.sharedDeviceSessions.set(deviceId, session);
    return session;
  }

  public switchLearnerOnSharedDevice(
    deviceId: string,
    fromLearnerId: string,
    toLearnerId: string
  ): { purged: boolean; fromLearnerId: string; toLearnerId: string; activeLearnerId: string } {
    // Sibling Isolation Protocol:
    // 1. Purge memory cache of fromLearnerId
    this.purgeLearnerDeviceData(fromLearnerId);

    // 2. Update device session
    let session = this.sharedDeviceSessions.get(deviceId);
    if (!session) {
      session = this.startDeviceSession(deviceId, 'CHILD', toLearnerId);
    } else {
      session.activeLearnerId = toLearnerId;
      session.currentMode = 'CHILD'; // Always reset to child mode on learner switch
      session.pinVerified = false;
    }
    this.sharedDeviceSessions.set(deviceId, session);

    return {
      purged: true,
      fromLearnerId,
      toLearnerId,
      activeLearnerId: toLearnerId,
    };
  }

  public assertSiblingIsolation(deviceId: string, activeLearnerId: string, targetDataLearnerId: string): void {
    if (activeLearnerId !== targetDataLearnerId) {
      throw new ForbiddenException(
        `CHILD-SEC-004: Sibling data isolation breach detected. Active learner ${activeLearnerId} cannot access data for learner ${targetDataLearnerId}`
      );
    }
  }

  public cacheLearnerSessionData(learnerId: string, dataKey: string): void {
    if (!this.learnerDeviceCaches.has(learnerId)) {
      this.learnerDeviceCaches.set(learnerId, new Set());
    }
    this.learnerDeviceCaches.get(learnerId)!.add(dataKey);
  }

  public purgeLearnerDeviceData(learnerId: string): { purgedKeysCount: number } {
    const cached = this.learnerDeviceCaches.get(learnerId);
    const count = cached ? cached.size : 0;
    this.learnerDeviceCaches.delete(learnerId);
    return { purgedKeysCount: count };
  }

  public getDeviceSession(deviceId: string): SharedDeviceSession | undefined {
    return this.sharedDeviceSessions.get(deviceId);
  }
}
