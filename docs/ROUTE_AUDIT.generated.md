# Route inventory (generated, 132 routes)

Read from decorator metadata. "Login" = JwtAuthGuard present. Ownership checks inside handlers are NOT shown here.

| Method | Path | Login | Roles | Controller |
|---|---|---|---|---|
| POST | /ai-mentor/chat | yes | - | AiMentorController |
| GET | /ai-mentor/context/:topicId | yes | - | AiMentorController |
| POST | /ai-mentor/study-buddy | yes | - | AiMentorController |
| POST | /ai/generate | yes | - | AiController |
| GET | /analytics/ai-report | yes | - | AnalyticsController |
| GET | /analytics/dashboard-stats | yes | - | AnalyticsController |
| GET | /analytics/heatmap | yes | - | AnalyticsController |
| GET | /analytics/recent-sessions | yes | - | AnalyticsController |
| GET | /analytics/recommendations | yes | - | AnalyticsController |
| GET | /analytics/subject-breakdown | yes | - | AnalyticsController |
| GET | /analytics/summary | yes | - | AnalyticsController |
| GET | /analytics/upcoming-tests | yes | - | AnalyticsController |
| GET | /analytics/weak-topics | yes | - | AnalyticsController |
| DELETE | /announcements/:id | yes | TEACHER, ADMIN | AnnouncementController |
| GET | /announcements | yes | - | AnnouncementController |
| POST | /announcements | yes | TEACHER, ADMIN | AnnouncementController |
| POST | /assessment-intelligence/assign | yes | TEACHER, ADMIN | AssessmentIntelligenceController |
| POST | /assessment-intelligence/evaluate/:id | yes | - | AssessmentIntelligenceController |
| POST | /assessment/:sessionId/log-anomaly | yes | - | AssessmentController |
| POST | /assessment/:sessionId/submit | yes | - | AssessmentController |
| POST | /assessment/start | yes | - | AssessmentController |
| PATCH | /auth/complete-onboarding | yes | - | AuthController |
| POST | /auth/login | **NO** | - | AuthController |
| POST | /auth/register | **NO** | - | AuthController |
| PUT | /classroom/lesson-plan/:id/publish | yes | TEACHER, ADMIN | ClassroomController |
| GET | /classroom/lesson-plan/:id | yes | - | ClassroomController |
| POST | /classroom/lesson-plan/generate | yes | TEACHER, ADMIN | ClassroomController |
| GET | /classroom/lesson-plan | yes | TEACHER, ADMIN | ClassroomController |
| GET | /classroom/session/:id | yes | - | ClassroomController |
| POST | /classroom/session/start | yes | TEACHER, ADMIN | ClassroomController |
| PUT | /classroom/worksheet/:id/publish | yes | TEACHER, ADMIN | ClassroomController |
| POST | /classroom/worksheet/:id/submit | yes | - | ClassroomController |
| GET | /classroom/worksheet/:id | yes | - | ClassroomController |
| POST | /classroom/worksheet/generate | yes | TEACHER, ADMIN | ClassroomController |
| GET | /classroom/worksheet/submission/:id | yes | - | ClassroomController |
| GET | /classroom/worksheet | yes | TEACHER, ADMIN | ClassroomController |
| POST | /cognitive-state/hebbian-transfer | yes | - | NeuralCognitiveController |
| POST | /cognitive-state/log | yes | - | NeuralCognitiveController |
| POST | /consent/student/:studentId/erase | yes | ADMIN | ConsentController |
| GET | /consent/student/:studentId/export | yes | TEACHER, ADMIN | ConsentController |
| POST | /consent/student/:studentId/revoke | yes | TEACHER, ADMIN | ConsentController |
| GET | /consent/student/:studentId | yes | TEACHER, ADMIN | ConsentController |
| POST | /consent | yes | TEACHER, ADMIN | ConsentController |
| GET | /content-gen/drafts | yes | TEACHER, ADMIN | ContentGenController |
| POST | /content-gen/generate | yes | TEACHER, ADMIN | ContentGenController |
| PUT | /content-gen/publish/:draftId | yes | TEACHER, ADMIN | ContentGenController |
| POST | /content/engage | yes | - | ContentSearchController |
| GET | /content/search | yes | - | ContentSearchController |
| GET | /credential-mesh/my-credentials | yes | - | CredentialMeshController |
| GET | /dashboard/stats | yes | - | DashboardController |
| POST | /engagement/telemetry | yes | - | EngagementController |
| GET | /feedback/overview | yes | TEACHER, ADMIN | FeedbackController |
| POST | /feedback | yes | - | FeedbackController |
| GET | /forum/home | yes | - | ForumController |
| PATCH | /forum/post/:id/pin | yes | TEACHER, ADMIN | ForumController |
| PATCH | /forum/post/:id/upvote | yes | - | ForumController |
| GET | /forum/post/:id | yes | - | ForumController |
| POST | /forum/post/:postId/reply | yes | - | ForumController |
| POST | /forum/post | yes | - | ForumController |
| PATCH | /forum/reply/:id/accept | yes | TEACHER, ADMIN | ForumController |
| GET | /forum/topic/:topicId | yes | - | ForumController |
| GET | /gamification/badges/list | yes | - | GamificationController |
| GET | /gamification/badges | yes | - | GamificationController |
| GET | /gamification/leaderboard | yes | - | GamificationController |
| POST | /gamification/seed-badges | yes | - | GamificationController |
| GET | /gamification/stats | yes | - | GamificationController |
| GET | / | **NO** | - | AppController |
| GET | /global-verification/:hash | **NO** | - | GlobalVerificationController |
| GET | /goals/progress | yes | - | GoalController |
| GET | /goals | yes | - | GoalController |
| POST | /goals | yes | - | GoalController |
| GET | /learning-loop/audit/:studentId | yes | - | LearningLoopController |
| POST | /learning-loop/context | yes | - | LearningLoopController |
| POST | /learning-loop/escalation/:id/resolve | yes | TEACHER, ADMIN | LearningLoopController |
| POST | /learning-loop/evidence | yes | - | LearningLoopController |
| GET | /learning-loop/gate/:studentId | yes | - | LearningLoopController |
| POST | /learning-loop/personalize | yes | - | LearningLoopController |
| POST | /learning-loop/teacher/intervention | yes | TEACHER, ADMIN | LearningLoopController |
| GET | /learning-loop/teacher/queue | yes | TEACHER, ADMIN | LearningLoopController |
| POST | /learning/chat | yes | - | LearningController |
| POST | /learning/end | yes | - | LearningController |
| GET | /learning/history | yes | - | LearningController |
| GET | /learning/mastery | yes | - | LearningController |
| GET | /learning/recommendations | yes | - | LearningController |
| GET | /learning/sessions/:id | yes | - | LearningController |
| GET | /learning/sessions | yes | - | LearningController |
| POST | /learning/start | yes | - | LearningController |
| GET | /learning/today | yes | - | LearningController |
| PATCH | /notifications/:id/read | yes | - | NotificationController |
| PATCH | /notifications/read-all | yes | - | NotificationController |
| GET | /notifications | yes | - | NotificationController |
| POST | /practice/generate | yes | - | PracticeController |
| POST | /practice/submit | yes | - | PracticeController |
| GET | /practice/tests | yes | - | PracticeController |
| GET | /revision/schedule | yes | - | RevisionController |
| POST | /revision/start | yes | - | RevisionController |
| GET | /revision/suggestions | yes | - | RevisionController |
| PATCH | /schedule/:id/complete | yes | - | SchedulerController |
| DELETE | /schedule/:id | yes | - | SchedulerController |
| POST | /schedule/generate-plan | yes | - | SchedulerController |
| GET | /schedule/suggested | yes | - | SchedulerController |
| GET | /schedule | yes | - | SchedulerController |
| POST | /schedule | yes | - | SchedulerController |
| GET | /subjects/:id | yes | - | SubjectsController |
| GET | /subjects | yes | - | SubjectsController |
| POST | /subscription/create-checkout-session | yes | - | SubscriptionController |
| GET | /subscription/status | yes | - | SubscriptionController |
| POST | /subscription/webhook | **NO** | - | SubscriptionController |
| GET | /teacher-analytics/cohort | yes | TEACHER, ADMIN | TeacherAnalyticsController |
| GET | /teacher-analytics/content-performance | yes | TEACHER, ADMIN | TeacherAnalyticsController |
| GET | /teacher-analytics/export-csv | yes | TEACHER, ADMIN | TeacherAnalyticsController |
| GET | /teacher-analytics/student/:studentId | yes | TEACHER, ADMIN | TeacherAnalyticsController |
| GET | /teacher-analytics/students | yes | TEACHER, ADMIN | TeacherAnalyticsController |
| GET | /teacher-analytics/worksheet-performance | yes | TEACHER, ADMIN | TeacherAnalyticsController |
| GET | /teacher/analytics | yes | TEACHER, ADMIN | TeacherOpsController |
| POST | /teacher/classes/:id/enroll | yes | TEACHER, ADMIN | TeacherOpsController |
| GET | /teacher/classes | yes | TEACHER, ADMIN | TeacherOpsController |
| POST | /teacher/classes | yes | TEACHER, ADMIN | TeacherOpsController |
| POST | /teacher/content/assign | yes | TEACHER, ADMIN | TeacherOpsController |
| POST | /teacher/content/publish/:id | yes | TEACHER, ADMIN | TeacherOpsController |
| GET | /teacher/content | yes | TEACHER, ADMIN | TeacherOpsController |
| GET | /teacher/dashboard | yes | TEACHER, ADMIN | TeacherOpsController |
| POST | /teacher/interventions/:id/resolve | yes | TEACHER, ADMIN | TeacherOpsController |
| GET | /teacher/interventions | yes | TEACHER, ADMIN | TeacherOpsController |
| POST | /teacher/recommendations/:id/approve | yes | TEACHER, ADMIN | TeacherOpsController |
| POST | /teacher/recommendations/:id/override | yes | TEACHER, ADMIN | TeacherOpsController |
| GET | /teacher/recommendations | yes | TEACHER, ADMIN | TeacherOpsController |
| GET | /teacher/students/:id | yes | TEACHER, ADMIN | TeacherOpsController |
| POST | /teacher/students/:studentId/topics/:topicId/difficulty | yes | TEACHER, ADMIN | TeacherOpsController |
| GET | /teacher/students | yes | TEACHER, ADMIN | TeacherOpsController |
| GET | /users/me | yes | - | UsersController |
| PATCH | /users/profile | yes | - | UsersController |
