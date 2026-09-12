-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'STUDENT',
    "name" TEXT,
    "avatarUrl" TEXT,
    "cognitiveLevel" TEXT NOT NULL DEFAULT 'TEEN',
    "gradeLevel" TEXT,
    "onboardingComplete" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subject" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "metadata" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiscussionPost" (
    "id" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "upvotes" INTEGER NOT NULL DEFAULT 0,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiscussionPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiscussionReply" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "upvotes" INTEGER NOT NULL DEFAULT 0,
    "isAccepted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiscussionReply_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PostVote" (
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "value" INTEGER NOT NULL,

    CONSTRAINT "PostVote_pkey" PRIMARY KEY ("postId","userId")
);

-- CreateTable
CREATE TABLE "Topic" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "subjectId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Topic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TopicPrerequisite" (
    "topicId" TEXT NOT NULL,
    "prerequisiteId" TEXT NOT NULL,

    CONSTRAINT "TopicPrerequisite_pkey" PRIMARY KEY ("topicId","prerequisiteId")
);

-- CreateTable
CREATE TABLE "LearningSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endTime" TIMESTAMP(3),
    "logs" TEXT,

    CONSTRAINT "LearningSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PracticeSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "score" DOUBLE PRECISION,
    "startTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endTime" TIMESTAMP(3),
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "durationSeconds" INTEGER,
    "xpEarned" INTEGER,

    CONSTRAINT "PracticeSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Question" (
    "id" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "difficulty" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "type" TEXT NOT NULL,
    "correctAnswer" TEXT NOT NULL,
    "options" TEXT,
    "explanation" TEXT,
    "hints" TEXT,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserAnswer" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserTopicMastery" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "masteryProbability" DOUBLE PRECISION NOT NULL DEFAULT 0.1,
    "difficultyState" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "lastReviewed" TIMESTAMP(3),

    CONSTRAINT "UserTopicMastery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "plan" TEXT NOT NULL DEFAULT 'FREE',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "currentPeriodEnd" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Resource" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "url" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "likeCount" INTEGER NOT NULL DEFAULT 0,
    "durationSeconds" INTEGER NOT NULL DEFAULT 0,
    "publishedAt" TIMESTAMP(3),
    "tags" TEXT,
    "score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Resource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserStats" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "totalXp" INTEGER NOT NULL DEFAULT 0,
    "currentLevel" INTEGER NOT NULL DEFAULT 1,
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "bestStreak" INTEGER NOT NULL DEFAULT 0,
    "lastActivityDate" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserStats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Badge" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "requirementType" TEXT NOT NULL,
    "requirementValue" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Badge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserBadge" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "badgeId" TEXT NOT NULL,
    "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserBadge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MistakeLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "MistakeLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endTime" TIMESTAMP(3),
    "integrityScore" DOUBLE PRECISION NOT NULL DEFAULT 100.0,
    "status" TEXT NOT NULL DEFAULT 'ONGOING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssessmentSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntegrityLog" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "anomalyType" TEXT NOT NULL,
    "severity" DOUBLE PRECISION NOT NULL,
    "metadata" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IntegrityLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EngagementLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "activityRate" DOUBLE PRECISION NOT NULL,
    "accuracyScore" DOUBLE PRECISION NOT NULL,
    "timeConsistency" DOUBLE PRECISION NOT NULL,
    "fatigueIndex" DOUBLE PRECISION NOT NULL,
    "finalEngagementScore" DOUBLE PRECISION NOT NULL,
    "interventionTriggered" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EngagementLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudyGoal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "weeklyXpTarget" INTEGER NOT NULL DEFAULT 500,
    "weeklyStudyMinutes" INTEGER NOT NULL DEFAULT 120,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudyGoal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Announcement" (
    "id" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Announcement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudySession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "topicId" TEXT,
    "title" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "notes" TEXT,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudySession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GeneratedContent" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "topicId" TEXT,
    "type" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "learningObjective" TEXT NOT NULL,
    "bloomsTaxonomyLevel" TEXT NOT NULL,
    "targetDuration" INTEGER,
    "content" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GeneratedContent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CognitiveProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "learningVelocityIndex" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "skillGenome" TEXT,
    "attentionSpan" INTEGER NOT NULL DEFAULT 15,
    "memoryRetentionRate" DOUBLE PRECISION NOT NULL DEFAULT 0.8,
    "ethicalAlignmentScore" DOUBLE PRECISION NOT NULL DEFAULT 100.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CognitiveProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SkillNode" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "domain" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SkillNode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SkillEdge" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "relationType" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1.0,

    CONSTRAINT "SkillEdge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SkillCredential" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "skillNodeId" TEXT NOT NULL,
    "issuerId" TEXT NOT NULL DEFAULT 'SYSTEM',
    "blockchainHash" TEXT,
    "validationScore" DOUBLE PRECISION NOT NULL,
    "aiSignature" TEXT,
    "institutionSignature" TEXT,
    "cognitiveDepthRating" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "SkillCredential_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentProject" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "submissionUrl" TEXT,
    "gradingRubric" TEXT NOT NULL,
    "logicScore" DOUBLE PRECISION,
    "originalityScore" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'ASSIGNED',
    "evaluatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssessmentProject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSkillNode" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "skillNodeId" TEXT NOT NULL,
    "masteryProbability" DOUBLE PRECISION NOT NULL DEFAULT 0.1,
    "confidenceWeight" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "memoryDecayFactor" DOUBLE PRECISION NOT NULL DEFAULT 0.05,
    "applicationFlexibilityScore" DOUBLE PRECISION NOT NULL DEFAULT 0.2,
    "lastActivatedAt" TIMESTAMP(3),

    CONSTRAINT "UserSkillNode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSkillEdge" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "connectionWeight" DOUBLE PRECISION NOT NULL DEFAULT 0.1,
    "transferSuccesses" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "UserSkillEdge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CognitiveStateLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "cognitiveLoad" DOUBLE PRECISION NOT NULL,
    "stepComplexity" DOUBLE PRECISION NOT NULL,
    "retrievalStrength" DOUBLE PRECISION NOT NULL,
    "attentionSwitching" DOUBLE PRECISION NOT NULL,
    "impulseControl" DOUBLE PRECISION NOT NULL,
    "errorClusterScore" DOUBLE PRECISION NOT NULL,
    "inferredState" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CognitiveStateLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LessonPlan" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "topicId" TEXT,
    "subject" TEXT NOT NULL,
    "topicName" TEXT NOT NULL,
    "studentLevel" TEXT NOT NULL,
    "learningObjective" TEXT NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "preferredMethod" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LessonPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LessonPlanStep" (
    "id" TEXT NOT NULL,
    "lessonPlanId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "durationMinutes" INTEGER,

    CONSTRAINT "LessonPlanStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Worksheet" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "lessonPlanId" TEXT,
    "topicId" TEXT,
    "title" TEXT NOT NULL,
    "generationMethod" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Worksheet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorksheetQuestion" (
    "id" TEXT NOT NULL,
    "worksheetId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "options" TEXT,
    "correctAnswer" TEXT,
    "explanation" TEXT,
    "points" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "WorksheetQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DigitalClassroomSession" (
    "id" TEXT NOT NULL,
    "lessonPlanId" TEXT,
    "teacherId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "scheduledAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "currentStep" INTEGER NOT NULL DEFAULT 1,
    "whiteboardData" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DigitalClassroomSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorksheetSubmission" (
    "id" TEXT NOT NULL,
    "worksheetId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "score" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'SUBMITTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorksheetSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorksheetSubmissionAnswer" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "studentAnswer" TEXT NOT NULL,
    "isCorrect" BOOLEAN,
    "pointsAwarded" INTEGER,
    "feedback" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorksheetSubmissionAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Feedback" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sessionId" TEXT,
    "rating" INTEGER NOT NULL,
    "comments" TEXT,
    "context" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningEvidenceLog" (
    "id" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "accuracy" DOUBLE PRECISION NOT NULL,
    "attemptNumber" INTEGER NOT NULL DEFAULT 1,
    "hintCount" INTEGER NOT NULL DEFAULT 0,
    "misconception" TEXT,
    "engagementScore" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LearningEvidenceLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PersonalizationDecision" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "activityType" TEXT NOT NULL,
    "difficulty" DOUBLE PRECISION NOT NULL,
    "modality" TEXT NOT NULL,
    "pacing" TEXT NOT NULL,
    "recommendationRationale" TEXT NOT NULL,
    "isCertifiedMastery" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'PROPOSED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PersonalizationDecision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PolicyGateDecision" (
    "id" TEXT NOT NULL,
    "decisionId" TEXT,
    "userId" TEXT NOT NULL,
    "gateState" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "triggeredRules" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PolicyGateDecision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeacherIntervention" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "decisionId" TEXT,
    "action" TEXT NOT NULL,
    "overrideDetails" TEXT,
    "feedback" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeacherIntervention_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EscalationEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "resolvedById" TEXT,
    "resolutionNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EscalationEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningLoopAuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "actorType" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "stateBefore" TEXT,
    "stateAfter" TEXT NOT NULL,
    "metadata" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LearningLoopAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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

-- CreateTable
CREATE TABLE "TeacherClassEnrollment" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeacherClassEnrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeacherStudentAssignment" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "academicYear" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeacherStudentAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentVersion" (
    "id" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "data" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContentVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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

-- CreateTable
CREATE TABLE "ParentStudent" (
    "id" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ParentStudent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsentRecord" (
    "id" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "consentType" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "grantedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "evidence" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConsentRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SafetyEscalation" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "source" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "metadata" TEXT,
    "assignedToId" TEXT,
    "resolvedById" TEXT,
    "resolution" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "SafetyEscalation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditEvent" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "actorRole" TEXT,
    "action" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "resourceId" TEXT,
    "outcome" TEXT NOT NULL,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationDelivery" (
    "id" TEXT NOT NULL,
    "notificationId" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastAttemptAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotificationDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IdempotencyRecord" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "userId" TEXT,
    "requestHash" TEXT NOT NULL,
    "statusCode" INTEGER,
    "responseBody" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IdempotencyRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemAuditEvent" (
    "id" TEXT NOT NULL,
    "requestId" TEXT,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT,
    "outcome" TEXT NOT NULL,
    "reason" TEXT,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SystemAuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIExecutionRecord" (
    "id" TEXT NOT NULL,
    "requestId" TEXT,
    "userId" TEXT,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "modelVersion" TEXT,
    "operation" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "latencyMs" INTEGER,
    "inputHash" TEXT,
    "outputHash" TEXT,
    "safetyStatus" TEXT NOT NULL,
    "errorCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIExecutionRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tenant" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'SCHOOL',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "settings" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TenantMembership" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'STUDENT',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TenantMembership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cohort" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "academicYear" TEXT NOT NULL,
    "gradeLevel" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cohort_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CohortMembership" (
    "id" TEXT NOT NULL,
    "cohortId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CohortMembership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutboxEvent" (
    "id" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "aggregateType" TEXT NOT NULL,
    "aggregateId" TEXT NOT NULL,
    "tenantId" TEXT,
    "payload" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 5,
    "availableAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OutboxEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeatureFlag" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isEnabled" BOOLEAN NOT NULL DEFAULT false,
    "rolloutPercentage" INTEGER NOT NULL DEFAULT 0,
    "tenantWhitelist" TEXT,
    "userWhitelist" TEXT,
    "targetRoles" TEXT,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeatureFlag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIModelEvaluationRecord" (
    "id" TEXT NOT NULL,
    "modelName" TEXT NOT NULL,
    "modelVersion" TEXT NOT NULL,
    "promptKey" TEXT NOT NULL,
    "teacherAgreed" BOOLEAN,
    "teacherOverridden" BOOLEAN,
    "accuracyScore" DOUBLE PRECISION,
    "safetyPassed" BOOLEAN NOT NULL DEFAULT true,
    "latencyMs" INTEGER,
    "feedback" TEXT,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIModelEvaluationRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommercialProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "onboardingVersion" TEXT NOT NULL DEFAULT 'v1',
    "onboardingStatus" TEXT NOT NULL DEFAULT 'NOT_STARTED',
    "acquisitionSource" TEXT,
    "referralCode" TEXT,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommercialProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BillingAccount" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "provider" TEXT NOT NULL DEFAULT 'STRIPE',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BillingAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BillingEvent" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerEventId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "userId" TEXT,
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "payload" TEXT NOT NULL,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "processedAt" TIMESTAMP(3),
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BillingEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "tenantId" TEXT,
    "sessionId" TEXT,
    "eventName" TEXT NOT NULL,
    "properties" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportTicket" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "SupportTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductFeedback" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "rating" INTEGER,
    "message" TEXT NOT NULL,
    "contextJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningConcept" (
    "id" TEXT NOT NULL,
    "canonicalKey" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "subject" TEXT NOT NULL,
    "domain" TEXT,
    "ageMin" INTEGER,
    "ageMax" INTEGER,
    "metadataJson" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LearningConcept_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningConceptRelation" (
    "id" TEXT NOT NULL,
    "fromConceptId" TEXT NOT NULL,
    "toConceptId" TEXT NOT NULL,
    "relationType" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "metadataJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LearningConceptRelation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CurriculumAlignment" (
    "id" TEXT NOT NULL,
    "conceptId" TEXT NOT NULL,
    "curriculum" TEXT NOT NULL,
    "region" TEXT,
    "grade" TEXT,
    "code" TEXT,
    "source" TEXT,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "metadataJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CurriculumAlignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningExperiment" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "allocationJson" TEXT NOT NULL,
    "metricsJson" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LearningExperiment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExperimentAssignment" (
    "id" TEXT NOT NULL,
    "experimentId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "variant" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExperimentAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExperimentObservation" (
    "id" TEXT NOT NULL,
    "experimentId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "metric" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExperimentObservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIInteractionEvaluation" (
    "id" TEXT NOT NULL,
    "interactionId" TEXT NOT NULL,
    "evaluatorType" TEXT NOT NULL,
    "evaluatorId" TEXT,
    "correctness" DOUBLE PRECISION,
    "helpfulness" DOUBLE PRECISION,
    "safety" DOUBLE PRECISION,
    "ageAppropriate" DOUBLE PRECISION,
    "teacherAlignment" DOUBLE PRECISION,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIInteractionEvaluation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIAgent" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "version" TEXT NOT NULL DEFAULT '1.0.0',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "autonomyLevel" TEXT NOT NULL DEFAULT 'SUPERVISED',
    "policyVersion" TEXT NOT NULL DEFAULT '1.0.0',
    "configJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AIAgent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIAgentExecution" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "tenantId" TEXT,
    "learnerId" TEXT,
    "requestId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "autonomyLevel" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "inputHash" TEXT NOT NULL,
    "outputHash" TEXT,
    "policyVersion" TEXT NOT NULL,
    "humanApprovedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "errorCode" TEXT,
    "errorDetails" TEXT,
    "metadataJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "AIAgentExecution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningWorkflow" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "version" TEXT NOT NULL DEFAULT '1.0.0',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "definition" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LearningWorkflow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowExecution" (
    "id" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "tenantId" TEXT,
    "learnerId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "state" TEXT NOT NULL,
    "contextJson" JSONB,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "WorkflowExecution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIUsageRecord" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "learnerId" TEXT,
    "agentId" TEXT,
    "modelVersionId" TEXT,
    "requestCount" INTEGER NOT NULL DEFAULT 1,
    "inputTokens" INTEGER NOT NULL DEFAULT 0,
    "outputTokens" INTEGER NOT NULL DEFAULT 0,
    "estimatedCost" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "latencyMs" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'SUCCESS',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIUsageRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Integration" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "provider" TEXT NOT NULL,
    "integrationKey" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "configJson" JSONB,
    "lastSyncAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Integration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningSystemSnapshot" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "snapshotType" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "stateJson" TEXT NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LearningSystemSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImprovementProposal" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "source" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "hypothesis" TEXT NOT NULL,
    "expectedOutcome" TEXT NOT NULL,
    "riskLevel" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DETECTED',
    "affectedSystems" TEXT NOT NULL,
    "rollbackPlan" TEXT NOT NULL,
    "proposedBy" TEXT,
    "approvedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "ImprovementProposal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningOutcome" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "learnerId" TEXT NOT NULL,
    "conceptId" TEXT NOT NULL,
    "interventionId" TEXT,
    "experimentId" TEXT,
    "baselineMastery" DOUBLE PRECISION NOT NULL,
    "finalMastery" DOUBLE PRECISION NOT NULL,
    "retentionScore" DOUBLE PRECISION,
    "transferScore" DOUBLE PRECISION,
    "independence" DOUBLE PRECISION,
    "measuredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LearningOutcome_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExperimentGovernance" (
    "id" TEXT NOT NULL,
    "experimentId" TEXT NOT NULL,
    "riskLevel" TEXT NOT NULL,
    "safetyReviewed" BOOLEAN NOT NULL DEFAULT false,
    "teacherReviewed" BOOLEAN NOT NULL DEFAULT false,
    "privacyReviewed" BOOLEAN NOT NULL DEFAULT false,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "decision" TEXT,
    "decisionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExperimentGovernance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReleaseArtifact" (
    "id" TEXT NOT NULL,
    "artifactType" TEXT NOT NULL,
    "artifactKey" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "riskLevel" TEXT NOT NULL,
    "checksum" TEXT NOT NULL,
    "validationJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" TIMESTAMP(3),
    "activatedAt" TIMESTAMP(3),

    CONSTRAINT "ReleaseArtifact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResearchDataset" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "sourceScope" TEXT NOT NULL,
    "privacyMethod" TEXT NOT NULL,
    "schemaVersion" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResearchDataset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningPattern" (
    "id" TEXT NOT NULL,
    "patternKey" TEXT NOT NULL,
    "conceptScope" TEXT NOT NULL,
    "evidenceCount" INTEGER NOT NULL,
    "effectiveness" DOUBLE PRECISION,
    "confidence" DOUBLE PRECISION,
    "sourceVersion" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'CANDIDATE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LearningPattern_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PolicyVersion" (
    "id" TEXT NOT NULL,
    "policyKey" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "definition" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PolicyVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvidenceProvenance" (
    "id" TEXT NOT NULL,
    "evidenceId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "learnerId" TEXT NOT NULL,
    "conceptId" TEXT,
    "contentId" TEXT,
    "curriculumId" TEXT,
    "modelVersion" TEXT,
    "agentVersion" TEXT,
    "policyVersion" TEXT,
    "teacherId" TEXT,
    "interventionId" TEXT,
    "experimentId" TEXT,
    "source" TEXT NOT NULL,
    "integrityHash" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EvidenceProvenance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvidenceCorrection" (
    "id" TEXT NOT NULL,
    "evidenceId" TEXT NOT NULL,
    "requestedBy" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "replacementId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "EvidenceCorrection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningClaim" (
    "id" TEXT NOT NULL,
    "claimType" TEXT NOT NULL,
    "statement" TEXT NOT NULL,
    "scopeJson" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'CANDIDATE',
    "evidenceCount" INTEGER NOT NULL DEFAULT 0,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),

    CONSTRAINT "LearningClaim_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClaimEvidence" (
    "id" TEXT NOT NULL,
    "claimId" TEXT NOT NULL,
    "evidenceId" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClaimEvidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerifiedLearningKnowledge" (
    "id" TEXT NOT NULL,
    "claimId" TEXT NOT NULL,
    "knowledgeType" TEXT NOT NULL,
    "statement" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "evidenceCount" INTEGER NOT NULL,
    "replicationCount" INTEGER NOT NULL,
    "scopeJson" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VerifiedLearningKnowledge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CausalStudy" (
    "id" TEXT NOT NULL,
    "hypothesis" TEXT NOT NULL,
    "treatment" TEXT NOT NULL,
    "control" TEXT,
    "outcome" TEXT NOT NULL,
    "populationJson" TEXT NOT NULL,
    "confoundersJson" TEXT NOT NULL,
    "design" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "CausalStudy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InterventionEffectiveness" (
    "id" TEXT NOT NULL,
    "interventionType" TEXT NOT NULL,
    "conceptId" TEXT,
    "sampleSize" INTEGER NOT NULL,
    "baselineMastery" DOUBLE PRECISION NOT NULL,
    "postMastery" DOUBLE PRECISION NOT NULL,
    "retention" DOUBLE PRECISION,
    "transfer" DOUBLE PRECISION,
    "effectSize" DOUBLE PRECISION,
    "confidence" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InterventionEffectiveness_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIDecisionTrace" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "learnerId" TEXT,
    "modelVersion" TEXT NOT NULL,
    "promptVersion" TEXT NOT NULL,
    "policyVersion" TEXT NOT NULL,
    "inputHash" TEXT NOT NULL,
    "outputHash" TEXT NOT NULL,
    "contextRefsJson" TEXT NOT NULL,
    "toolCallsJson" TEXT,
    "action" TEXT NOT NULL,
    "decision" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIDecisionTrace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIPromptVersion" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "templateHash" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIPromptVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeContribution" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "claimId" TEXT NOT NULL,
    "contributionType" TEXT NOT NULL,
    "evidenceCount" INTEGER NOT NULL,
    "privacyMethod" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" TIMESTAMP(3),

    CONSTRAINT "KnowledgeContribution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerifiedContent" (
    "id" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "curriculumScore" DOUBLE PRECISION NOT NULL,
    "safetyScore" DOUBLE PRECISION NOT NULL,
    "accessibilityScore" DOUBLE PRECISION NOT NULL,
    "teacherScore" DOUBLE PRECISION NOT NULL,
    "effectivenessScore" DOUBLE PRECISION NOT NULL,
    "provenanceScore" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'CANDIDATE',
    "verifiedAt" TIMESTAMP(3),

    CONSTRAINT "VerifiedContent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResearchStudyVersion" (
    "id" TEXT NOT NULL,
    "studyId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "protocolHash" TEXT NOT NULL,
    "datasetId" TEXT NOT NULL,
    "analysisHash" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResearchStudyVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResearchResult" (
    "id" TEXT NOT NULL,
    "studyId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "metric" TEXT NOT NULL,
    "estimate" DOUBLE PRECISION NOT NULL,
    "lowerBound" DOUBLE PRECISION,
    "upperBound" DOUBLE PRECISION,
    "sampleSize" INTEGER NOT NULL,
    "interpretation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResearchResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GovernanceDecision" (
    "id" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "decision" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "policyVersion" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GovernanceDecision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UnifiedLearnerSnapshot" (
    "id" TEXT NOT NULL,
    "learnerId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "snapshotJson" TEXT NOT NULL,
    "sourceEventId" TEXT,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UnifiedLearnerSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningPassport" (
    "id" TEXT NOT NULL,
    "learnerId" TEXT NOT NULL,
    "issuer" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "metadataJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LearningPassport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PassportAchievement" (
    "id" TEXT NOT NULL,
    "passportId" TEXT NOT NULL,
    "achievementType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "conceptId" TEXT,
    "competencyId" TEXT,
    "verificationStatus" TEXT NOT NULL DEFAULT 'UNVERIFIED',
    "evidenceRefJson" TEXT,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PassportAchievement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningCompetency" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "level" TEXT NOT NULL,
    "metadataJson" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LearningCompetency_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearnerCompetency" (
    "id" TEXT NOT NULL,
    "learnerId" TEXT NOT NULL,
    "competencyId" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "evidenceCount" INTEGER NOT NULL DEFAULT 0,
    "lastEvaluatedAt" TIMESTAMP(3),

    CONSTRAINT "LearnerCompetency_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExternalLearningEvent" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "externalEventId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "learnerReference" TEXT NOT NULL,
    "payloadJson" TEXT NOT NULL,
    "signatureValid" BOOLEAN NOT NULL DEFAULT false,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "ExternalLearningEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningDataShare" (
    "id" TEXT NOT NULL,
    "learnerId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "recipientType" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "scopeJson" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "LearningDataShare_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningSignal" (
    "id" TEXT NOT NULL,
    "learnerId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "conceptId" TEXT,
    "evidenceIdsJson" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LearningSignal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningIntervention" (
    "id" TEXT NOT NULL,
    "learnerId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "signalId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "targetConceptId" TEXT,
    "priority" DOUBLE PRECISION NOT NULL,
    "rationale" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PROPOSED',
    "requiresTeacherApproval" BOOLEAN NOT NULL DEFAULT true,
    "plannedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "outcomeJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LearningIntervention_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InterventionEvaluation" (
    "id" TEXT NOT NULL,
    "interventionId" TEXT NOT NULL,
    "baselineValue" DOUBLE PRECISION,
    "outcomeValue" DOUBLE PRECISION,
    "effectSize" DOUBLE PRECISION,
    "confidence" DOUBLE PRECISION,
    "methodology" TEXT NOT NULL,
    "evaluatorType" TEXT NOT NULL,
    "notes" TEXT,
    "evaluatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InterventionEvaluation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PolicyRecommendation" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "scope" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "recommendation" TEXT NOT NULL,
    "evidenceIdsJson" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PROPOSED',
    "requiresHumanApproval" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),

    CONSTRAINT "PolicyRecommendation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OperationsEventProcessing" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "processedAt" TIMESTAMP(3),
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OperationsEventProcessing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningAction" (
    "id" TEXT NOT NULL,
    "learnerId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "parametersJson" TEXT NOT NULL,
    "rationale" TEXT NOT NULL,
    "evidenceIdsJson" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "autonomyLevel" TEXT NOT NULL,
    "reversible" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'PROPOSED',
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LearningAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PolicyDecision" (
    "id" TEXT NOT NULL,
    "actionId" TEXT NOT NULL,
    "decision" TEXT NOT NULL,
    "autonomyLevel" TEXT NOT NULL,
    "policyVersion" TEXT NOT NULL,
    "reasonsJson" TEXT NOT NULL,
    "decidedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PolicyDecision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActionExecution" (
    "id" TEXT NOT NULL,
    "actionId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "attempt" INTEGER NOT NULL DEFAULT 1,
    "resultJson" TEXT,
    "error" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActionExecution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HumanApproval" (
    "id" TEXT NOT NULL,
    "actionId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "requestedBy" TEXT NOT NULL,
    "reviewerId" TEXT,
    "decision" TEXT NOT NULL DEFAULT 'PENDING',
    "rationale" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),

    CONSTRAINT "HumanApproval_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningTwinSnapshot" (
    "id" TEXT NOT NULL,
    "learnerId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "stateJson" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LearningTwinSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DecisionProvenance" (
    "id" TEXT NOT NULL,
    "decisionId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "actorType" TEXT NOT NULL,
    "actorId" TEXT,
    "modelVersion" TEXT,
    "policyVersion" TEXT NOT NULL,
    "inputHash" TEXT NOT NULL,
    "decisionJson" TEXT NOT NULL,
    "evidenceIdsJson" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DecisionProvenance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningCredential" (
    "id" TEXT NOT NULL,
    "learnerId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "credentialType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "verificationLevel" TEXT NOT NULL,
    "issuerId" TEXT,
    "issuerName" TEXT,
    "evidenceIdsJson" TEXT NOT NULL,
    "skillIdsJson" TEXT NOT NULL,
    "curriculumJson" TEXT,
    "criteriaJson" TEXT NOT NULL,
    "metadataJson" TEXT,
    "issuedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "revocationReason" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LearningCredential_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CredentialVerification" (
    "id" TEXT NOT NULL,
    "credentialId" TEXT NOT NULL,
    "verificationLevel" TEXT NOT NULL,
    "verifierType" TEXT NOT NULL,
    "verifierId" TEXT,
    "decision" TEXT NOT NULL,
    "evidenceJson" TEXT,
    "notes" TEXT,
    "verifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CredentialVerification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CredentialEvent" (
    "id" TEXT NOT NULL,
    "credentialId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "actorId" TEXT,
    "actorType" TEXT NOT NULL,
    "metadataJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CredentialEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CredentialShare" (
    "id" TEXT NOT NULL,
    "credentialId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "revoked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CredentialShare_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CredentialVersion" (
    "id" TEXT NOT NULL,
    "credentialId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "criteriaJson" TEXT NOT NULL,
    "metadataJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CredentialVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CredentialTemplate" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "key" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "credentialType" TEXT NOT NULL,
    "criteriaJson" TEXT NOT NULL,
    "skillIdsJson" TEXT NOT NULL,
    "curriculumJson" TEXT,
    "minimumMastery" DOUBLE PRECISION,
    "minimumEvidence" INTEGER,
    "requiresTeacher" BOOLEAN NOT NULL DEFAULT true,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CredentialTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CredentialOperation" (
    "id" TEXT NOT NULL,
    "credentialId" TEXT NOT NULL,
    "operationKey" TEXT NOT NULL,
    "operationType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CredentialOperation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "p16_tenants" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "p16_tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "p16_tenant_memberships" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "p16_tenant_memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "p16_external_integrations" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "config_json" TEXT,
    "capabilities_json" TEXT,
    "last_sync_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "p16_external_integrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "p16_integration_credentials" (
    "id" TEXT NOT NULL,
    "integration_id" TEXT NOT NULL,
    "credential_type" TEXT NOT NULL,
    "secret_ref" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "p16_integration_credentials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "p16_integration_mappings" (
    "id" TEXT NOT NULL,
    "integration_id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "external_type" TEXT NOT NULL,
    "mapping_version" INTEGER NOT NULL DEFAULT 1,
    "mapping_json" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "p16_integration_mappings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "p16_external_records" (
    "id" TEXT NOT NULL,
    "integration_id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "external_record_id" TEXT NOT NULL,
    "external_type" TEXT NOT NULL,
    "source_version" TEXT,
    "canonical_type" TEXT,
    "payload_json" TEXT NOT NULL,
    "checksum" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'IMPORTED',
    "first_seen_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_seen_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "p16_external_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "p16_integration_import_jobs" (
    "id" TEXT NOT NULL,
    "integration_id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "cursor" TEXT,
    "records_read" INTEGER NOT NULL DEFAULT 0,
    "records_created" INTEGER NOT NULL DEFAULT 0,
    "records_updated" INTEGER NOT NULL DEFAULT 0,
    "records_rejected" INTEGER NOT NULL DEFAULT 0,
    "error_json" TEXT,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "p16_integration_import_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "p16_integration_export_jobs" (
    "id" TEXT NOT NULL,
    "integration_id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "cursor" TEXT,
    "records_exported" INTEGER NOT NULL DEFAULT 0,
    "records_rejected" INTEGER NOT NULL DEFAULT 0,
    "error_json" TEXT,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "p16_integration_export_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "p16_sync_cursors" (
    "id" TEXT NOT NULL,
    "integration_id" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "cursor" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "last_synced_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "p16_sync_cursors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "p16_data_provenance" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "canonical_type" TEXT NOT NULL,
    "canonical_id" TEXT NOT NULL,
    "source_type" TEXT NOT NULL,
    "source_id" TEXT NOT NULL,
    "transformation" TEXT,
    "mapping_version" INTEGER,
    "imported_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata_json" TEXT,

    CONSTRAINT "p16_data_provenance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "p16_integration_conflicts" (
    "id" TEXT NOT NULL,
    "integration_id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "external_value_json" TEXT NOT NULL,
    "internal_value_json" TEXT NOT NULL,
    "conflict_type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "resolution_json" TEXT,
    "resolved_by" TEXT,
    "resolved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "p16_integration_conflicts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "p16_external_institutions" (
    "id" TEXT NOT NULL,
    "external_key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "region" TEXT,
    "verification_status" TEXT NOT NULL DEFAULT 'UNVERIFIED',
    "metadata_json" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "p16_external_institutions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "p16_external_identity_mappings" (
    "id" TEXT NOT NULL,
    "integration_id" TEXT NOT NULL,
    "external_user_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "p16_external_identity_mappings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Subject_name_key" ON "Subject"("name");

-- CreateIndex
CREATE UNIQUE INDEX "UserTopicMastery_userId_topicId_key" ON "UserTopicMastery"("userId", "topicId");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_userId_key" ON "Subscription"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Resource_url_key" ON "Resource"("url");

-- CreateIndex
CREATE UNIQUE INDEX "UserStats_userId_key" ON "UserStats"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Badge_name_key" ON "Badge"("name");

-- CreateIndex
CREATE UNIQUE INDEX "UserBadge_userId_badgeId_key" ON "UserBadge"("userId", "badgeId");

-- CreateIndex
CREATE UNIQUE INDEX "CognitiveProfile_userId_key" ON "CognitiveProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "SkillNode_name_key" ON "SkillNode"("name");

-- CreateIndex
CREATE UNIQUE INDEX "SkillCredential_blockchainHash_key" ON "SkillCredential"("blockchainHash");

-- CreateIndex
CREATE UNIQUE INDEX "SkillCredential_userId_skillNodeId_key" ON "SkillCredential"("userId", "skillNodeId");

-- CreateIndex
CREATE UNIQUE INDEX "UserSkillNode_userId_skillNodeId_key" ON "UserSkillNode"("userId", "skillNodeId");

-- CreateIndex
CREATE UNIQUE INDEX "UserSkillEdge_userId_sourceId_targetId_key" ON "UserSkillEdge"("userId", "sourceId", "targetId");

-- CreateIndex
CREATE UNIQUE INDEX "LearningEvidenceLog_idempotencyKey_key" ON "LearningEvidenceLog"("idempotencyKey");

-- CreateIndex
CREATE INDEX "LearningEvidenceLog_userId_topicId_idx" ON "LearningEvidenceLog"("userId", "topicId");

-- CreateIndex
CREATE INDEX "PersonalizationDecision_userId_topicId_idx" ON "PersonalizationDecision"("userId", "topicId");

-- CreateIndex
CREATE INDEX "PolicyGateDecision_userId_gateState_idx" ON "PolicyGateDecision"("userId", "gateState");

-- CreateIndex
CREATE INDEX "TeacherIntervention_teacherId_studentId_status_idx" ON "TeacherIntervention"("teacherId", "studentId", "status");

-- CreateIndex
CREATE INDEX "EscalationEvent_userId_status_idx" ON "EscalationEvent"("userId", "status");

-- CreateIndex
CREATE INDEX "LearningLoopAuditLog_userId_timestamp_idx" ON "LearningLoopAuditLog"("userId", "timestamp");

-- CreateIndex
CREATE INDEX "LearningLoopAuditLog_actorType_action_idx" ON "LearningLoopAuditLog"("actorType", "action");

-- CreateIndex
CREATE INDEX "TeacherClass_teacherId_idx" ON "TeacherClass"("teacherId");

-- CreateIndex
CREATE INDEX "TeacherClassEnrollment_studentId_idx" ON "TeacherClassEnrollment"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "TeacherClassEnrollment_classId_studentId_key" ON "TeacherClassEnrollment"("classId", "studentId");

-- CreateIndex
CREATE INDEX "TeacherStudentAssignment_teacherId_isActive_idx" ON "TeacherStudentAssignment"("teacherId", "isActive");

-- CreateIndex
CREATE INDEX "TeacherStudentAssignment_studentId_idx" ON "TeacherStudentAssignment"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "TeacherStudentAssignment_teacherId_studentId_key" ON "TeacherStudentAssignment"("teacherId", "studentId");

-- CreateIndex
CREATE INDEX "ContentVersion_contentId_idx" ON "ContentVersion"("contentId");

-- CreateIndex
CREATE UNIQUE INDEX "ContentVersion_contentId_versionNumber_key" ON "ContentVersion"("contentId", "versionNumber");

-- CreateIndex
CREATE INDEX "ContentAssignment_studentId_status_idx" ON "ContentAssignment"("studentId", "status");

-- CreateIndex
CREATE INDEX "ContentAssignment_classId_idx" ON "ContentAssignment"("classId");

-- CreateIndex
CREATE INDEX "ContentAssignment_teacherId_idx" ON "ContentAssignment"("teacherId");

-- CreateIndex
CREATE INDEX "ParentStudent_parentId_idx" ON "ParentStudent"("parentId");

-- CreateIndex
CREATE INDEX "ParentStudent_studentId_idx" ON "ParentStudent"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "ParentStudent_parentId_studentId_key" ON "ParentStudent"("parentId", "studentId");

-- CreateIndex
CREATE INDEX "ConsentRecord_parentId_studentId_idx" ON "ConsentRecord"("parentId", "studentId");

-- CreateIndex
CREATE INDEX "ConsentRecord_studentId_consentType_idx" ON "ConsentRecord"("studentId", "consentType");

-- CreateIndex
CREATE UNIQUE INDEX "ConsentRecord_parentId_studentId_consentType_key" ON "ConsentRecord"("parentId", "studentId", "consentType");

-- CreateIndex
CREATE INDEX "SafetyEscalation_studentId_status_idx" ON "SafetyEscalation"("studentId", "status");

-- CreateIndex
CREATE INDEX "SafetyEscalation_severity_status_idx" ON "SafetyEscalation"("severity", "status");

-- CreateIndex
CREATE INDEX "AuditEvent_actorId_createdAt_idx" ON "AuditEvent"("actorId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditEvent_resource_resourceId_idx" ON "AuditEvent"("resource", "resourceId");

-- CreateIndex
CREATE INDEX "AuditEvent_action_createdAt_idx" ON "AuditEvent"("action", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationDelivery_notificationId_channel_key" ON "NotificationDelivery"("notificationId", "channel");

-- CreateIndex
CREATE UNIQUE INDEX "IdempotencyRecord_key_key" ON "IdempotencyRecord"("key");

-- CreateIndex
CREATE INDEX "IdempotencyRecord_userId_idx" ON "IdempotencyRecord"("userId");

-- CreateIndex
CREATE INDEX "IdempotencyRecord_expiresAt_idx" ON "IdempotencyRecord"("expiresAt");

-- CreateIndex
CREATE INDEX "SystemAuditEvent_actorId_idx" ON "SystemAuditEvent"("actorId");

-- CreateIndex
CREATE INDEX "SystemAuditEvent_resourceType_resourceId_idx" ON "SystemAuditEvent"("resourceType", "resourceId");

-- CreateIndex
CREATE INDEX "SystemAuditEvent_createdAt_idx" ON "SystemAuditEvent"("createdAt");

-- CreateIndex
CREATE INDEX "SystemAuditEvent_requestId_idx" ON "SystemAuditEvent"("requestId");

-- CreateIndex
CREATE INDEX "AIExecutionRecord_userId_idx" ON "AIExecutionRecord"("userId");

-- CreateIndex
CREATE INDEX "AIExecutionRecord_createdAt_idx" ON "AIExecutionRecord"("createdAt");

-- CreateIndex
CREATE INDEX "AIExecutionRecord_provider_model_idx" ON "AIExecutionRecord"("provider", "model");

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_slug_key" ON "Tenant"("slug");

-- CreateIndex
CREATE INDEX "Tenant_status_idx" ON "Tenant"("status");

-- CreateIndex
CREATE INDEX "Tenant_type_idx" ON "Tenant"("type");

-- CreateIndex
CREATE INDEX "TenantMembership_userId_status_idx" ON "TenantMembership"("userId", "status");

-- CreateIndex
CREATE INDEX "TenantMembership_tenantId_role_idx" ON "TenantMembership"("tenantId", "role");

-- CreateIndex
CREATE UNIQUE INDEX "TenantMembership_tenantId_userId_key" ON "TenantMembership"("tenantId", "userId");

-- CreateIndex
CREATE INDEX "Cohort_tenantId_academicYear_idx" ON "Cohort"("tenantId", "academicYear");

-- CreateIndex
CREATE INDEX "CohortMembership_studentId_idx" ON "CohortMembership"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "CohortMembership_cohortId_studentId_key" ON "CohortMembership"("cohortId", "studentId");

-- CreateIndex
CREATE INDEX "OutboxEvent_status_availableAt_idx" ON "OutboxEvent"("status", "availableAt");

-- CreateIndex
CREATE INDEX "OutboxEvent_aggregateType_aggregateId_idx" ON "OutboxEvent"("aggregateType", "aggregateId");

-- CreateIndex
CREATE INDEX "OutboxEvent_tenantId_eventType_idx" ON "OutboxEvent"("tenantId", "eventType");

-- CreateIndex
CREATE UNIQUE INDEX "FeatureFlag_key_key" ON "FeatureFlag"("key");

-- CreateIndex
CREATE INDEX "FeatureFlag_key_idx" ON "FeatureFlag"("key");

-- CreateIndex
CREATE INDEX "AIModelEvaluationRecord_modelName_modelVersion_idx" ON "AIModelEvaluationRecord"("modelName", "modelVersion");

-- CreateIndex
CREATE INDEX "AIModelEvaluationRecord_createdAt_idx" ON "AIModelEvaluationRecord"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "CommercialProfile_userId_key" ON "CommercialProfile"("userId");

-- CreateIndex
CREATE INDEX "CommercialProfile_onboardingStatus_idx" ON "CommercialProfile"("onboardingStatus");

-- CreateIndex
CREATE UNIQUE INDEX "BillingAccount_userId_key" ON "BillingAccount"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "BillingAccount_stripeCustomerId_key" ON "BillingAccount"("stripeCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "BillingAccount_stripeSubscriptionId_key" ON "BillingAccount"("stripeSubscriptionId");

-- CreateIndex
CREATE INDEX "BillingAccount_userId_idx" ON "BillingAccount"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "BillingEvent_providerEventId_key" ON "BillingEvent"("providerEventId");

-- CreateIndex
CREATE INDEX "BillingEvent_userId_idx" ON "BillingEvent"("userId");

-- CreateIndex
CREATE INDEX "BillingEvent_eventType_idx" ON "BillingEvent"("eventType");

-- CreateIndex
CREATE INDEX "BillingEvent_processed_idx" ON "BillingEvent"("processed");

-- CreateIndex
CREATE INDEX "ProductEvent_userId_occurredAt_idx" ON "ProductEvent"("userId", "occurredAt");

-- CreateIndex
CREATE INDEX "ProductEvent_tenantId_occurredAt_idx" ON "ProductEvent"("tenantId", "occurredAt");

-- CreateIndex
CREATE INDEX "ProductEvent_eventName_occurredAt_idx" ON "ProductEvent"("eventName", "occurredAt");

-- CreateIndex
CREATE INDEX "SupportTicket_userId_status_idx" ON "SupportTicket"("userId", "status");

-- CreateIndex
CREATE INDEX "SupportTicket_priority_status_idx" ON "SupportTicket"("priority", "status");

-- CreateIndex
CREATE INDEX "ProductFeedback_userId_createdAt_idx" ON "ProductFeedback"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "ProductFeedback_category_createdAt_idx" ON "ProductFeedback"("category", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "LearningConcept_canonicalKey_key" ON "LearningConcept"("canonicalKey");

-- CreateIndex
CREATE INDEX "LearningConcept_subject_idx" ON "LearningConcept"("subject");

-- CreateIndex
CREATE INDEX "LearningConcept_domain_idx" ON "LearningConcept"("domain");

-- CreateIndex
CREATE INDEX "LearningConceptRelation_fromConceptId_idx" ON "LearningConceptRelation"("fromConceptId");

-- CreateIndex
CREATE INDEX "LearningConceptRelation_toConceptId_idx" ON "LearningConceptRelation"("toConceptId");

-- CreateIndex
CREATE UNIQUE INDEX "LearningConceptRelation_fromConceptId_toConceptId_relationT_key" ON "LearningConceptRelation"("fromConceptId", "toConceptId", "relationType");

-- CreateIndex
CREATE INDEX "CurriculumAlignment_conceptId_idx" ON "CurriculumAlignment"("conceptId");

-- CreateIndex
CREATE INDEX "CurriculumAlignment_curriculum_grade_idx" ON "CurriculumAlignment"("curriculum", "grade");

-- CreateIndex
CREATE UNIQUE INDEX "LearningExperiment_key_key" ON "LearningExperiment"("key");

-- CreateIndex
CREATE INDEX "LearningExperiment_status_idx" ON "LearningExperiment"("status");

-- CreateIndex
CREATE INDEX "ExperimentAssignment_subjectId_idx" ON "ExperimentAssignment"("subjectId");

-- CreateIndex
CREATE UNIQUE INDEX "ExperimentAssignment_experimentId_subjectId_key" ON "ExperimentAssignment"("experimentId", "subjectId");

-- CreateIndex
CREATE INDEX "ExperimentObservation_experimentId_metric_idx" ON "ExperimentObservation"("experimentId", "metric");

-- CreateIndex
CREATE INDEX "ExperimentObservation_subjectId_occurredAt_idx" ON "ExperimentObservation"("subjectId", "occurredAt");

-- CreateIndex
CREATE INDEX "AIInteractionEvaluation_interactionId_idx" ON "AIInteractionEvaluation"("interactionId");

-- CreateIndex
CREATE INDEX "AIInteractionEvaluation_evaluatorType_idx" ON "AIInteractionEvaluation"("evaluatorType");

-- CreateIndex
CREATE UNIQUE INDEX "AIAgent_key_key" ON "AIAgent"("key");

-- CreateIndex
CREATE INDEX "AIAgent_status_idx" ON "AIAgent"("status");

-- CreateIndex
CREATE INDEX "AIAgent_autonomyLevel_idx" ON "AIAgent"("autonomyLevel");

-- CreateIndex
CREATE UNIQUE INDEX "AIAgentExecution_requestId_key" ON "AIAgentExecution"("requestId");

-- CreateIndex
CREATE INDEX "AIAgentExecution_agentId_status_idx" ON "AIAgentExecution"("agentId", "status");

-- CreateIndex
CREATE INDEX "AIAgentExecution_learnerId_createdAt_idx" ON "AIAgentExecution"("learnerId", "createdAt");

-- CreateIndex
CREATE INDEX "AIAgentExecution_tenantId_idx" ON "AIAgentExecution"("tenantId");

-- CreateIndex
CREATE INDEX "AIAgentExecution_action_idx" ON "AIAgentExecution"("action");

-- CreateIndex
CREATE UNIQUE INDEX "LearningWorkflow_key_key" ON "LearningWorkflow"("key");

-- CreateIndex
CREATE INDEX "LearningWorkflow_status_idx" ON "LearningWorkflow"("status");

-- CreateIndex
CREATE INDEX "WorkflowExecution_workflowId_status_idx" ON "WorkflowExecution"("workflowId", "status");

-- CreateIndex
CREATE INDEX "WorkflowExecution_learnerId_idx" ON "WorkflowExecution"("learnerId");

-- CreateIndex
CREATE INDEX "WorkflowExecution_tenantId_idx" ON "WorkflowExecution"("tenantId");

-- CreateIndex
CREATE INDEX "AIUsageRecord_tenantId_createdAt_idx" ON "AIUsageRecord"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "AIUsageRecord_agentId_idx" ON "AIUsageRecord"("agentId");

-- CreateIndex
CREATE INDEX "AIUsageRecord_learnerId_idx" ON "AIUsageRecord"("learnerId");

-- CreateIndex
CREATE INDEX "Integration_tenantId_provider_idx" ON "Integration"("tenantId", "provider");

-- CreateIndex
CREATE INDEX "Integration_integrationKey_idx" ON "Integration"("integrationKey");

-- CreateIndex
CREATE INDEX "LearningSystemSnapshot_tenantId_generatedAt_idx" ON "LearningSystemSnapshot"("tenantId", "generatedAt");

-- CreateIndex
CREATE INDEX "LearningSystemSnapshot_snapshotType_generatedAt_idx" ON "LearningSystemSnapshot"("snapshotType", "generatedAt");

-- CreateIndex
CREATE INDEX "ImprovementProposal_status_createdAt_idx" ON "ImprovementProposal"("status", "createdAt");

-- CreateIndex
CREATE INDEX "ImprovementProposal_tenantId_status_idx" ON "ImprovementProposal"("tenantId", "status");

-- CreateIndex
CREATE INDEX "LearningOutcome_tenantId_measuredAt_idx" ON "LearningOutcome"("tenantId", "measuredAt");

-- CreateIndex
CREATE INDEX "LearningOutcome_learnerId_conceptId_idx" ON "LearningOutcome"("learnerId", "conceptId");

-- CreateIndex
CREATE INDEX "LearningOutcome_experimentId_idx" ON "LearningOutcome"("experimentId");

-- CreateIndex
CREATE UNIQUE INDEX "ExperimentGovernance_experimentId_key" ON "ExperimentGovernance"("experimentId");

-- CreateIndex
CREATE INDEX "ReleaseArtifact_status_idx" ON "ReleaseArtifact"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ReleaseArtifact_artifactType_artifactKey_version_key" ON "ReleaseArtifact"("artifactType", "artifactKey", "version");

-- CreateIndex
CREATE INDEX "ResearchDataset_status_idx" ON "ResearchDataset"("status");

-- CreateIndex
CREATE UNIQUE INDEX "LearningPattern_patternKey_key" ON "LearningPattern"("patternKey");

-- CreateIndex
CREATE INDEX "PolicyVersion_policyKey_status_idx" ON "PolicyVersion"("policyKey", "status");

-- CreateIndex
CREATE UNIQUE INDEX "PolicyVersion_policyKey_version_key" ON "PolicyVersion"("policyKey", "version");

-- CreateIndex
CREATE UNIQUE INDEX "EvidenceProvenance_evidenceId_key" ON "EvidenceProvenance"("evidenceId");

-- CreateIndex
CREATE INDEX "EvidenceProvenance_tenantId_occurredAt_idx" ON "EvidenceProvenance"("tenantId", "occurredAt");

-- CreateIndex
CREATE INDEX "EvidenceProvenance_learnerId_occurredAt_idx" ON "EvidenceProvenance"("learnerId", "occurredAt");

-- CreateIndex
CREATE INDEX "EvidenceProvenance_conceptId_occurredAt_idx" ON "EvidenceProvenance"("conceptId", "occurredAt");

-- CreateIndex
CREATE INDEX "EvidenceCorrection_evidenceId_idx" ON "EvidenceCorrection"("evidenceId");

-- CreateIndex
CREATE INDEX "EvidenceCorrection_status_idx" ON "EvidenceCorrection"("status");

-- CreateIndex
CREATE INDEX "LearningClaim_claimType_status_idx" ON "LearningClaim"("claimType", "status");

-- CreateIndex
CREATE INDEX "LearningClaim_status_confidence_idx" ON "LearningClaim"("status", "confidence");

-- CreateIndex
CREATE INDEX "ClaimEvidence_claimId_idx" ON "ClaimEvidence"("claimId");

-- CreateIndex
CREATE INDEX "ClaimEvidence_evidenceId_idx" ON "ClaimEvidence"("evidenceId");

-- CreateIndex
CREATE UNIQUE INDEX "ClaimEvidence_claimId_evidenceId_key" ON "ClaimEvidence"("claimId", "evidenceId");

-- CreateIndex
CREATE UNIQUE INDEX "VerifiedLearningKnowledge_claimId_key" ON "VerifiedLearningKnowledge"("claimId");

-- CreateIndex
CREATE INDEX "VerifiedLearningKnowledge_knowledgeType_status_idx" ON "VerifiedLearningKnowledge"("knowledgeType", "status");

-- CreateIndex
CREATE INDEX "CausalStudy_status_idx" ON "CausalStudy"("status");

-- CreateIndex
CREATE INDEX "InterventionEffectiveness_interventionType_idx" ON "InterventionEffectiveness"("interventionType");

-- CreateIndex
CREATE INDEX "InterventionEffectiveness_conceptId_idx" ON "InterventionEffectiveness"("conceptId");

-- CreateIndex
CREATE UNIQUE INDEX "AIDecisionTrace_requestId_key" ON "AIDecisionTrace"("requestId");

-- CreateIndex
CREATE INDEX "AIDecisionTrace_tenantId_createdAt_idx" ON "AIDecisionTrace"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "AIDecisionTrace_learnerId_createdAt_idx" ON "AIDecisionTrace"("learnerId", "createdAt");

-- CreateIndex
CREATE INDEX "AIDecisionTrace_modelVersion_createdAt_idx" ON "AIDecisionTrace"("modelVersion", "createdAt");

-- CreateIndex
CREATE INDEX "AIPromptVersion_key_status_idx" ON "AIPromptVersion"("key", "status");

-- CreateIndex
CREATE UNIQUE INDEX "AIPromptVersion_key_version_key" ON "AIPromptVersion"("key", "version");

-- CreateIndex
CREATE INDEX "KnowledgeContribution_tenantId_idx" ON "KnowledgeContribution"("tenantId");

-- CreateIndex
CREATE INDEX "KnowledgeContribution_claimId_idx" ON "KnowledgeContribution"("claimId");

-- CreateIndex
CREATE INDEX "KnowledgeContribution_status_idx" ON "KnowledgeContribution"("status");

-- CreateIndex
CREATE UNIQUE INDEX "VerifiedContent_contentId_key" ON "VerifiedContent"("contentId");

-- CreateIndex
CREATE INDEX "VerifiedContent_status_idx" ON "VerifiedContent"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ResearchStudyVersion_studyId_version_key" ON "ResearchStudyVersion"("studyId", "version");

-- CreateIndex
CREATE INDEX "ResearchResult_studyId_idx" ON "ResearchResult"("studyId");

-- CreateIndex
CREATE INDEX "GovernanceDecision_resourceType_resourceId_idx" ON "GovernanceDecision"("resourceType", "resourceId");

-- CreateIndex
CREATE INDEX "UnifiedLearnerSnapshot_tenantId_learnerId_idx" ON "UnifiedLearnerSnapshot"("tenantId", "learnerId");

-- CreateIndex
CREATE UNIQUE INDEX "UnifiedLearnerSnapshot_learnerId_version_key" ON "UnifiedLearnerSnapshot"("learnerId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "LearningPassport_learnerId_key" ON "LearningPassport"("learnerId");

-- CreateIndex
CREATE INDEX "LearningPassport_learnerId_idx" ON "LearningPassport"("learnerId");

-- CreateIndex
CREATE INDEX "PassportAchievement_passportId_idx" ON "PassportAchievement"("passportId");

-- CreateIndex
CREATE INDEX "PassportAchievement_verificationStatus_idx" ON "PassportAchievement"("verificationStatus");

-- CreateIndex
CREATE UNIQUE INDEX "LearningCompetency_key_key" ON "LearningCompetency"("key");

-- CreateIndex
CREATE INDEX "LearnerCompetency_learnerId_idx" ON "LearnerCompetency"("learnerId");

-- CreateIndex
CREATE INDEX "LearnerCompetency_competencyId_idx" ON "LearnerCompetency"("competencyId");

-- CreateIndex
CREATE UNIQUE INDEX "LearnerCompetency_learnerId_competencyId_key" ON "LearnerCompetency"("learnerId", "competencyId");

-- CreateIndex
CREATE INDEX "ExternalLearningEvent_tenantId_learnerReference_idx" ON "ExternalLearningEvent"("tenantId", "learnerReference");

-- CreateIndex
CREATE UNIQUE INDEX "ExternalLearningEvent_providerId_externalEventId_key" ON "ExternalLearningEvent"("providerId", "externalEventId");

-- CreateIndex
CREATE INDEX "LearningDataShare_learnerId_idx" ON "LearningDataShare"("learnerId");

-- CreateIndex
CREATE INDEX "LearningDataShare_tenantId_status_idx" ON "LearningDataShare"("tenantId", "status");

-- CreateIndex
CREATE INDEX "LearningSignal_tenantId_learnerId_idx" ON "LearningSignal"("tenantId", "learnerId");

-- CreateIndex
CREATE INDEX "LearningSignal_tenantId_type_status_idx" ON "LearningSignal"("tenantId", "type", "status");

-- CreateIndex
CREATE INDEX "LearningSignal_conceptId_idx" ON "LearningSignal"("conceptId");

-- CreateIndex
CREATE INDEX "LearningIntervention_tenantId_learnerId_status_idx" ON "LearningIntervention"("tenantId", "learnerId", "status");

-- CreateIndex
CREATE INDEX "LearningIntervention_signalId_idx" ON "LearningIntervention"("signalId");

-- CreateIndex
CREATE INDEX "InterventionEvaluation_interventionId_idx" ON "InterventionEvaluation"("interventionId");

-- CreateIndex
CREATE INDEX "PolicyRecommendation_tenantId_status_idx" ON "PolicyRecommendation"("tenantId", "status");

-- CreateIndex
CREATE INDEX "PolicyRecommendation_category_idx" ON "PolicyRecommendation"("category");

-- CreateIndex
CREATE UNIQUE INDEX "OperationsEventProcessing_eventId_key" ON "OperationsEventProcessing"("eventId");

-- CreateIndex
CREATE INDEX "LearningAction_tenantId_learnerId_status_idx" ON "LearningAction"("tenantId", "learnerId", "status");

-- CreateIndex
CREATE INDEX "LearningAction_tenantId_type_idx" ON "LearningAction"("tenantId", "type");

-- CreateIndex
CREATE INDEX "PolicyDecision_actionId_idx" ON "PolicyDecision"("actionId");

-- CreateIndex
CREATE INDEX "PolicyDecision_decision_decidedAt_idx" ON "PolicyDecision"("decision", "decidedAt");

-- CreateIndex
CREATE INDEX "ActionExecution_actionId_idx" ON "ActionExecution"("actionId");

-- CreateIndex
CREATE INDEX "ActionExecution_status_startedAt_idx" ON "ActionExecution"("status", "startedAt");

-- CreateIndex
CREATE INDEX "HumanApproval_tenantId_decision_idx" ON "HumanApproval"("tenantId", "decision");

-- CreateIndex
CREATE INDEX "HumanApproval_actionId_idx" ON "HumanApproval"("actionId");

-- CreateIndex
CREATE INDEX "LearningTwinSnapshot_tenantId_learnerId_createdAt_idx" ON "LearningTwinSnapshot"("tenantId", "learnerId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "LearningTwinSnapshot_learnerId_version_key" ON "LearningTwinSnapshot"("learnerId", "version");

-- CreateIndex
CREATE INDEX "DecisionProvenance_tenantId_createdAt_idx" ON "DecisionProvenance"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "DecisionProvenance_decisionId_idx" ON "DecisionProvenance"("decisionId");

-- CreateIndex
CREATE INDEX "LearningCredential_tenantId_learnerId_idx" ON "LearningCredential"("tenantId", "learnerId");

-- CreateIndex
CREATE INDEX "LearningCredential_tenantId_status_idx" ON "LearningCredential"("tenantId", "status");

-- CreateIndex
CREATE INDEX "LearningCredential_issuerId_idx" ON "LearningCredential"("issuerId");

-- CreateIndex
CREATE INDEX "CredentialVerification_credentialId_idx" ON "CredentialVerification"("credentialId");

-- CreateIndex
CREATE INDEX "CredentialVerification_verifierType_verifierId_idx" ON "CredentialVerification"("verifierType", "verifierId");

-- CreateIndex
CREATE INDEX "CredentialEvent_credentialId_createdAt_idx" ON "CredentialEvent"("credentialId", "createdAt");

-- CreateIndex
CREATE INDEX "CredentialEvent_tenantId_createdAt_idx" ON "CredentialEvent"("tenantId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "CredentialShare_tokenHash_key" ON "CredentialShare"("tokenHash");

-- CreateIndex
CREATE INDEX "CredentialShare_credentialId_idx" ON "CredentialShare"("credentialId");

-- CreateIndex
CREATE UNIQUE INDEX "CredentialVersion_credentialId_version_key" ON "CredentialVersion"("credentialId", "version");

-- CreateIndex
CREATE INDEX "CredentialTemplate_tenantId_active_idx" ON "CredentialTemplate"("tenantId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "CredentialTemplate_tenantId_key_version_key" ON "CredentialTemplate"("tenantId", "key", "version");

-- CreateIndex
CREATE UNIQUE INDEX "CredentialOperation_operationKey_key" ON "CredentialOperation"("operationKey");

-- CreateIndex
CREATE INDEX "CredentialOperation_credentialId_idx" ON "CredentialOperation"("credentialId");

-- CreateIndex
CREATE INDEX "p16_tenant_memberships_user_idx" ON "p16_tenant_memberships"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "p16_tenant_memberships_tenant_id_user_id_key" ON "p16_tenant_memberships"("tenant_id", "user_id");

-- CreateIndex
CREATE INDEX "p16_integrations_tenant_status_idx" ON "p16_external_integrations"("tenant_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "p16_external_integrations_tenant_id_provider_key" ON "p16_external_integrations"("tenant_id", "provider");

-- CreateIndex
CREATE INDEX "p16_credentials_integration_status_idx" ON "p16_integration_credentials"("integration_id", "status");

-- CreateIndex
CREATE INDEX "p16_mappings_integration_entity_idx" ON "p16_integration_mappings"("integration_id", "entity_type");

-- CreateIndex
CREATE UNIQUE INDEX "p16_integration_mappings_integration_id_entity_type_externa_key" ON "p16_integration_mappings"("integration_id", "entity_type", "external_type", "mapping_version");

-- CreateIndex
CREATE INDEX "p16_external_records_tenant_canonical_idx" ON "p16_external_records"("tenant_id", "canonical_type");

-- CreateIndex
CREATE INDEX "p16_external_records_integration_seen_idx" ON "p16_external_records"("integration_id", "last_seen_at");

-- CreateIndex
CREATE UNIQUE INDEX "p16_external_records_integration_id_external_record_id_exte_key" ON "p16_external_records"("integration_id", "external_record_id", "external_type");

-- CreateIndex
CREATE INDEX "p16_import_jobs_tenant_status_idx" ON "p16_integration_import_jobs"("tenant_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "p16_sync_cursors_integration_id_resource_key" ON "p16_sync_cursors"("integration_id", "resource");

-- CreateIndex
CREATE INDEX "p16_provenance_lookup_idx" ON "p16_data_provenance"("tenant_id", "canonical_type", "canonical_id");

-- CreateIndex
CREATE INDEX "p16_conflicts_tenant_status_idx" ON "p16_integration_conflicts"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "p16_conflicts_integration_entity_idx" ON "p16_integration_conflicts"("integration_id", "entity_id");

-- CreateIndex
CREATE UNIQUE INDEX "p16_external_institutions_external_key_key" ON "p16_external_institutions"("external_key");

-- CreateIndex
CREATE INDEX "p16_identity_user_idx" ON "p16_external_identity_mappings"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "p16_external_identity_mappings_integration_id_external_user_key" ON "p16_external_identity_mappings"("integration_id", "external_user_id");

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscussionPost" ADD CONSTRAINT "DiscussionPost_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscussionPost" ADD CONSTRAINT "DiscussionPost_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscussionReply" ADD CONSTRAINT "DiscussionReply_postId_fkey" FOREIGN KEY ("postId") REFERENCES "DiscussionPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscussionReply" ADD CONSTRAINT "DiscussionReply_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostVote" ADD CONSTRAINT "PostVote_postId_fkey" FOREIGN KEY ("postId") REFERENCES "DiscussionPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostVote" ADD CONSTRAINT "PostVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Topic" ADD CONSTRAINT "Topic_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TopicPrerequisite" ADD CONSTRAINT "TopicPrerequisite_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TopicPrerequisite" ADD CONSTRAINT "TopicPrerequisite_prerequisiteId_fkey" FOREIGN KEY ("prerequisiteId") REFERENCES "Topic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningSession" ADD CONSTRAINT "LearningSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningSession" ADD CONSTRAINT "LearningSession_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PracticeSession" ADD CONSTRAINT "PracticeSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PracticeSession" ADD CONSTRAINT "PracticeSession_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAnswer" ADD CONSTRAINT "UserAnswer_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "PracticeSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAnswer" ADD CONSTRAINT "UserAnswer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserTopicMastery" ADD CONSTRAINT "UserTopicMastery_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserTopicMastery" ADD CONSTRAINT "UserTopicMastery_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserStats" ADD CONSTRAINT "UserStats_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBadge" ADD CONSTRAINT "UserBadge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBadge" ADD CONSTRAINT "UserBadge_badgeId_fkey" FOREIGN KEY ("badgeId") REFERENCES "Badge"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MistakeLog" ADD CONSTRAINT "MistakeLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MistakeLog" ADD CONSTRAINT "MistakeLog_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentSession" ADD CONSTRAINT "AssessmentSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentSession" ADD CONSTRAINT "AssessmentSession_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegrityLog" ADD CONSTRAINT "IntegrityLog_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "AssessmentSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EngagementLog" ADD CONSTRAINT "EngagementLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EngagementLog" ADD CONSTRAINT "EngagementLog_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudyGoal" ADD CONSTRAINT "StudyGoal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudySession" ADD CONSTRAINT "StudySession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudySession" ADD CONSTRAINT "StudySession_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeneratedContent" ADD CONSTRAINT "GeneratedContent_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeneratedContent" ADD CONSTRAINT "GeneratedContent_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CognitiveProfile" ADD CONSTRAINT "CognitiveProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillEdge" ADD CONSTRAINT "SkillEdge_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "SkillNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillEdge" ADD CONSTRAINT "SkillEdge_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "SkillNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillCredential" ADD CONSTRAINT "SkillCredential_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillCredential" ADD CONSTRAINT "SkillCredential_skillNodeId_fkey" FOREIGN KEY ("skillNodeId") REFERENCES "SkillNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentProject" ADD CONSTRAINT "AssessmentProject_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentProject" ADD CONSTRAINT "AssessmentProject_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSkillNode" ADD CONSTRAINT "UserSkillNode_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSkillNode" ADD CONSTRAINT "UserSkillNode_skillNodeId_fkey" FOREIGN KEY ("skillNodeId") REFERENCES "SkillNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSkillEdge" ADD CONSTRAINT "UserSkillEdge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSkillEdge" ADD CONSTRAINT "UserSkillEdge_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "UserSkillNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSkillEdge" ADD CONSTRAINT "UserSkillEdge_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "UserSkillNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CognitiveStateLog" ADD CONSTRAINT "CognitiveStateLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonPlan" ADD CONSTRAINT "LessonPlan_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonPlan" ADD CONSTRAINT "LessonPlan_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonPlanStep" ADD CONSTRAINT "LessonPlanStep_lessonPlanId_fkey" FOREIGN KEY ("lessonPlanId") REFERENCES "LessonPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Worksheet" ADD CONSTRAINT "Worksheet_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Worksheet" ADD CONSTRAINT "Worksheet_lessonPlanId_fkey" FOREIGN KEY ("lessonPlanId") REFERENCES "LessonPlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Worksheet" ADD CONSTRAINT "Worksheet_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorksheetQuestion" ADD CONSTRAINT "WorksheetQuestion_worksheetId_fkey" FOREIGN KEY ("worksheetId") REFERENCES "Worksheet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DigitalClassroomSession" ADD CONSTRAINT "DigitalClassroomSession_lessonPlanId_fkey" FOREIGN KEY ("lessonPlanId") REFERENCES "LessonPlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DigitalClassroomSession" ADD CONSTRAINT "DigitalClassroomSession_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DigitalClassroomSession" ADD CONSTRAINT "DigitalClassroomSession_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorksheetSubmission" ADD CONSTRAINT "WorksheetSubmission_worksheetId_fkey" FOREIGN KEY ("worksheetId") REFERENCES "Worksheet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorksheetSubmission" ADD CONSTRAINT "WorksheetSubmission_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorksheetSubmissionAnswer" ADD CONSTRAINT "WorksheetSubmissionAnswer_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "WorksheetSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorksheetSubmissionAnswer" ADD CONSTRAINT "WorksheetSubmissionAnswer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "WorksheetQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "DigitalClassroomSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningEvidenceLog" ADD CONSTRAINT "LearningEvidenceLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningEvidenceLog" ADD CONSTRAINT "LearningEvidenceLog_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonalizationDecision" ADD CONSTRAINT "PersonalizationDecision_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonalizationDecision" ADD CONSTRAINT "PersonalizationDecision_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PolicyGateDecision" ADD CONSTRAINT "PolicyGateDecision_decisionId_fkey" FOREIGN KEY ("decisionId") REFERENCES "PersonalizationDecision"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PolicyGateDecision" ADD CONSTRAINT "PolicyGateDecision_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherIntervention" ADD CONSTRAINT "TeacherIntervention_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherIntervention" ADD CONSTRAINT "TeacherIntervention_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherIntervention" ADD CONSTRAINT "TeacherIntervention_decisionId_fkey" FOREIGN KEY ("decisionId") REFERENCES "PersonalizationDecision"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EscalationEvent" ADD CONSTRAINT "EscalationEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EscalationEvent" ADD CONSTRAINT "EscalationEvent_resolvedById_fkey" FOREIGN KEY ("resolvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningLoopAuditLog" ADD CONSTRAINT "LearningLoopAuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherClass" ADD CONSTRAINT "TeacherClass_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherClassEnrollment" ADD CONSTRAINT "TeacherClassEnrollment_classId_fkey" FOREIGN KEY ("classId") REFERENCES "TeacherClass"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherClassEnrollment" ADD CONSTRAINT "TeacherClassEnrollment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherStudentAssignment" ADD CONSTRAINT "TeacherStudentAssignment_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherStudentAssignment" ADD CONSTRAINT "TeacherStudentAssignment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentVersion" ADD CONSTRAINT "ContentVersion_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "GeneratedContent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentVersion" ADD CONSTRAINT "ContentVersion_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentAssignment" ADD CONSTRAINT "ContentAssignment_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "GeneratedContent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentAssignment" ADD CONSTRAINT "ContentAssignment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentAssignment" ADD CONSTRAINT "ContentAssignment_classId_fkey" FOREIGN KEY ("classId") REFERENCES "TeacherClass"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentAssignment" ADD CONSTRAINT "ContentAssignment_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParentStudent" ADD CONSTRAINT "ParentStudent_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParentStudent" ADD CONSTRAINT "ParentStudent_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsentRecord" ADD CONSTRAINT "ConsentRecord_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsentRecord" ADD CONSTRAINT "ConsentRecord_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SafetyEscalation" ADD CONSTRAINT "SafetyEscalation_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SafetyEscalation" ADD CONSTRAINT "SafetyEscalation_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SafetyEscalation" ADD CONSTRAINT "SafetyEscalation_resolvedById_fkey" FOREIGN KEY ("resolvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationDelivery" ADD CONSTRAINT "NotificationDelivery_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "Notification"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantMembership" ADD CONSTRAINT "TenantMembership_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantMembership" ADD CONSTRAINT "TenantMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cohort" ADD CONSTRAINT "Cohort_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CohortMembership" ADD CONSTRAINT "CohortMembership_cohortId_fkey" FOREIGN KEY ("cohortId") REFERENCES "Cohort"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CohortMembership" ADD CONSTRAINT "CohortMembership_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutboxEvent" ADD CONSTRAINT "OutboxEvent_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningConceptRelation" ADD CONSTRAINT "LearningConceptRelation_fromConceptId_fkey" FOREIGN KEY ("fromConceptId") REFERENCES "LearningConcept"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningConceptRelation" ADD CONSTRAINT "LearningConceptRelation_toConceptId_fkey" FOREIGN KEY ("toConceptId") REFERENCES "LearningConcept"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CurriculumAlignment" ADD CONSTRAINT "CurriculumAlignment_conceptId_fkey" FOREIGN KEY ("conceptId") REFERENCES "LearningConcept"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExperimentAssignment" ADD CONSTRAINT "ExperimentAssignment_experimentId_fkey" FOREIGN KEY ("experimentId") REFERENCES "LearningExperiment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExperimentObservation" ADD CONSTRAINT "ExperimentObservation_experimentId_fkey" FOREIGN KEY ("experimentId") REFERENCES "LearningExperiment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIAgentExecution" ADD CONSTRAINT "AIAgentExecution_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "AIAgent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowExecution" ADD CONSTRAINT "WorkflowExecution_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "LearningWorkflow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PassportAchievement" ADD CONSTRAINT "PassportAchievement_passportId_fkey" FOREIGN KEY ("passportId") REFERENCES "LearningPassport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearnerCompetency" ADD CONSTRAINT "LearnerCompetency_competencyId_fkey" FOREIGN KEY ("competencyId") REFERENCES "LearningCompetency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "p16_tenant_memberships" ADD CONSTRAINT "p16_tenant_memberships_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "p16_tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "p16_external_integrations" ADD CONSTRAINT "p16_external_integrations_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "p16_tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

