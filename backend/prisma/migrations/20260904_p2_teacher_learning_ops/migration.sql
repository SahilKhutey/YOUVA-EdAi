-- CreateTable: TeacherClass
CREATE TABLE "TeacherClass" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "gradeLevel" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeacherClass_pkey" PRIMARY KEY ("id")
);

-- CreateTable: TeacherClassEnrollment
CREATE TABLE "TeacherClassEnrollment" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeacherClassEnrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable: TeacherStudentAssignment
CREATE TABLE "TeacherStudentAssignment" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "academicYear" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeacherStudentAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable: ContentVersion
CREATE TABLE "ContentVersion" (
    "id" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "data" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContentVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable: ContentAssignment
CREATE TABLE "ContentAssignment" (
    "id" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "studentId" TEXT,
    "classId" TEXT,
    "teacherId" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'ASSIGNED',
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContentAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndexes
CREATE INDEX "TeacherClass_teacherId_idx" ON "TeacherClass"("teacherId");

CREATE UNIQUE INDEX "TeacherClassEnrollment_classId_studentId_key" ON "TeacherClassEnrollment"("classId", "studentId");
CREATE INDEX "TeacherClassEnrollment_studentId_idx" ON "TeacherClassEnrollment"("studentId");

CREATE UNIQUE INDEX "TeacherStudentAssignment_teacherId_studentId_key" ON "TeacherStudentAssignment"("teacherId", "studentId");
CREATE INDEX "TeacherStudentAssignment_teacherId_isActive_idx" ON "TeacherStudentAssignment"("teacherId", "isActive");
CREATE INDEX "TeacherStudentAssignment_studentId_idx" ON "TeacherStudentAssignment"("studentId");

CREATE UNIQUE INDEX "ContentVersion_contentId_versionNumber_key" ON "ContentVersion"("contentId", "versionNumber");
CREATE INDEX "ContentVersion_contentId_idx" ON "ContentVersion"("contentId");

CREATE INDEX "ContentAssignment_studentId_status_idx" ON "ContentAssignment"("studentId", "status");
CREATE INDEX "ContentAssignment_classId_idx" ON "ContentAssignment"("classId");
CREATE INDEX "ContentAssignment_teacherId_idx" ON "ContentAssignment"("teacherId");

-- AddForeignKeys
ALTER TABLE "TeacherClass" ADD CONSTRAINT "TeacherClass_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TeacherClassEnrollment" ADD CONSTRAINT "TeacherClassEnrollment_classId_fkey" FOREIGN KEY ("classId") REFERENCES "TeacherClass"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TeacherClassEnrollment" ADD CONSTRAINT "TeacherClassEnrollment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TeacherStudentAssignment" ADD CONSTRAINT "TeacherStudentAssignment_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TeacherStudentAssignment" ADD CONSTRAINT "TeacherStudentAssignment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ContentVersion" ADD CONSTRAINT "ContentVersion_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "GeneratedContent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ContentVersion" ADD CONSTRAINT "ContentVersion_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ContentAssignment" ADD CONSTRAINT "ContentAssignment_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "GeneratedContent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ContentAssignment" ADD CONSTRAINT "ContentAssignment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ContentAssignment" ADD CONSTRAINT "ContentAssignment_classId_fkey" FOREIGN KEY ("classId") REFERENCES "TeacherClass"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ContentAssignment" ADD CONSTRAINT "ContentAssignment_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
