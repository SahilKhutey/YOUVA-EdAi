# Route inventory (generated, 132 routes)

Read from decorator metadata. "Login" = JwtAuthGuard present. "Knows caller" = the handler receives the request object, so it can tell who is calling; a login-only route that does not can only be safe if it serves the same public data to everyone. Ownership checks inside handlers are NOT shown here.

| Method | Path | Login | Roles | Knows caller | Controller |
|---|---|---|---|---|---|
| POST | /ai-mentor/chat | yes | - | yes | AiMentorController |
| GET | /ai-mentor/context/:topicId | yes | - | yes | AiMentorController |
| POST | /ai-mentor/study-buddy | yes | - | yes | AiMentorController |
| POST | /ai/generate | yes | - | no | AiController |
| GET | /analytics/ai-report | yes | - | yes | AnalyticsController |
| GET | /analytics/dashboard-stats | yes | - | yes | AnalyticsController |
| GET | /analytics/heatmap | yes | - | yes | AnalyticsController |
| GET | /analytics/recent-sessions | yes | - | yes | AnalyticsController |
| GET | /analytics/recommendations | yes | - | yes | AnalyticsController |
| GET | /analytics/subject-breakdown | yes | - | yes | AnalyticsController |
| GET | /analytics/summary | yes | - | yes | AnalyticsController |
| GET | /analytics/upcoming-tests | yes | - | yes | AnalyticsController |
| GET | /analytics/weak-topics | yes | - | yes | AnalyticsController |
| DELETE | /announcements/:id | yes | TEACHER, ADMIN | no | AnnouncementController |
| GET | /announcements | yes | - | no | AnnouncementController |
| POST | /announcements | yes | TEACHER, ADMIN | yes | AnnouncementController |
| POST | /assessment-intelligence/assign | yes | TEACHER, ADMIN | yes | AssessmentIntelligenceController |
| POST | /assessment-intelligence/evaluate/:id | yes | - | yes | AssessmentIntelligenceController |
| POST | /assessment/:sessionId/log-anomaly | yes | - | yes | AssessmentController |
| POST | /assessment/:sessionId/submit | yes | - | yes | AssessmentController |
| POST | /assessment/start | yes | - | yes | AssessmentController |
| PATCH | /auth/complete-onboarding | yes | - | yes | AuthController |
| POST | /auth/login | **NO** | - | yes | AuthController |
| POST | /auth/register | **NO** | - | no | AuthController |
| PUT | /classroom/lesson-plan/:id/publish | yes | TEACHER, ADMIN | yes | ClassroomController |
| GET | /classroom/lesson-plan/:id | yes | - | yes | ClassroomController |
| POST | /classroom/lesson-plan/generate | yes | TEACHER, ADMIN | yes | ClassroomController |
| GET | /classroom/lesson-plan | yes | TEACHER, ADMIN | yes | ClassroomController |
| GET | /classroom/session/:id | yes | - | yes | ClassroomController |
| POST | /classroom/session/start | yes | TEACHER, ADMIN | yes | ClassroomController |
| PUT | /classroom/worksheet/:id/publish | yes | TEACHER, ADMIN | yes | ClassroomController |
| POST | /classroom/worksheet/:id/submit | yes | - | yes | ClassroomController |
| GET | /classroom/worksheet/:id | yes | - | yes | ClassroomController |
| POST | /classroom/worksheet/generate | yes | TEACHER, ADMIN | yes | ClassroomController |
| GET | /classroom/worksheet/submission/:id | yes | - | yes | ClassroomController |
| GET | /classroom/worksheet | yes | TEACHER, ADMIN | yes | ClassroomController |
| POST | /cognitive-state/hebbian-transfer | yes | - | yes | NeuralCognitiveController |
| POST | /cognitive-state/log | yes | - | yes | NeuralCognitiveController |
| POST | /consent/student/:studentId/erase | yes | ADMIN | yes | ConsentController |
| GET | /consent/student/:studentId/export | yes | TEACHER, ADMIN | yes | ConsentController |
| POST | /consent/student/:studentId/revoke | yes | TEACHER, ADMIN | yes | ConsentController |
| GET | /consent/student/:studentId | yes | TEACHER, ADMIN | yes | ConsentController |
| POST | /consent | yes | TEACHER, ADMIN | yes | ConsentController |
| GET | /content-gen/drafts | yes | TEACHER, ADMIN | yes | ContentGenController |
| POST | /content-gen/generate | yes | TEACHER, ADMIN | yes | ContentGenController |
| PUT | /content-gen/publish/:draftId | yes | TEACHER, ADMIN | yes | ContentGenController |
| POST | /content/engage | yes | - | yes | ContentSearchController |
| GET | /content/search | yes | - | yes | ContentSearchController |
| GET | /credential-mesh/my-credentials | yes | - | yes | CredentialMeshController |
| GET | /dashboard/stats | yes | - | yes | DashboardController |
| POST | /engagement/telemetry | yes | - | yes | EngagementController |
| GET | /feedback/overview | yes | TEACHER, ADMIN | no | FeedbackController |
| POST | /feedback | yes | - | yes | FeedbackController |
| GET | /forum/home | yes | - | no | ForumController |
| PATCH | /forum/post/:id/pin | yes | TEACHER, ADMIN | no | ForumController |
| PATCH | /forum/post/:id/upvote | yes | - | yes | ForumController |
| GET | /forum/post/:id | yes | - | no | ForumController |
| POST | /forum/post/:postId/reply | yes | - | yes | ForumController |
| POST | /forum/post | yes | - | yes | ForumController |
| PATCH | /forum/reply/:id/accept | yes | TEACHER, ADMIN | no | ForumController |
| GET | /forum/topic/:topicId | yes | - | no | ForumController |
| GET | /gamification/badges/list | yes | - | no | GamificationController |
| GET | /gamification/badges | yes | - | yes | GamificationController |
| GET | /gamification/leaderboard | yes | - | yes | GamificationController |
| POST | /gamification/seed-badges | yes | ADMIN | no | GamificationController |
| GET | /gamification/stats | yes | - | yes | GamificationController |
| GET | / | **NO** | - | no | AppController |
| GET | /global-verification/:hash | **NO** | - | no | GlobalVerificationController |
| GET | /goals/progress | yes | - | yes | GoalController |
| GET | /goals | yes | - | yes | GoalController |
| POST | /goals | yes | - | yes | GoalController |
| GET | /learning-loop/audit/:studentId | yes | - | yes | LearningLoopController |
| POST | /learning-loop/context | yes | - | yes | LearningLoopController |
| POST | /learning-loop/escalation/:id/resolve | yes | TEACHER, ADMIN | yes | LearningLoopController |
| POST | /learning-loop/evidence | yes | - | yes | LearningLoopController |
| GET | /learning-loop/gate/:studentId | yes | - | yes | LearningLoopController |
| POST | /learning-loop/personalize | yes | - | yes | LearningLoopController |
| POST | /learning-loop/teacher/intervention | yes | TEACHER, ADMIN | yes | LearningLoopController |
| GET | /learning-loop/teacher/queue | yes | TEACHER, ADMIN | yes | LearningLoopController |
| POST | /learning/chat | yes | - | yes | LearningController |
| POST | /learning/end | yes | - | yes | LearningController |
| GET | /learning/history | yes | - | yes | LearningController |
| GET | /learning/mastery | yes | - | yes | LearningController |
| GET | /learning/recommendations | yes | - | yes | LearningController |
| GET | /learning/sessions/:id | yes | - | yes | LearningController |
| GET | /learning/sessions | yes | - | yes | LearningController |
| POST | /learning/start | yes | - | yes | LearningController |
| GET | /learning/today | yes | - | yes | LearningController |
| PATCH | /notifications/:id/read | yes | - | yes | NotificationController |
| PATCH | /notifications/read-all | yes | - | yes | NotificationController |
| GET | /notifications | yes | - | yes | NotificationController |
| POST | /practice/generate | yes | - | yes | PracticeController |
| POST | /practice/submit | yes | - | yes | PracticeController |
| GET | /practice/tests | yes | - | yes | PracticeController |
| GET | /revision/schedule | yes | - | yes | RevisionController |
| POST | /revision/start | yes | - | yes | RevisionController |
| GET | /revision/suggestions | yes | - | yes | RevisionController |
| PATCH | /schedule/:id/complete | yes | - | yes | SchedulerController |
| DELETE | /schedule/:id | yes | - | yes | SchedulerController |
| POST | /schedule/generate-plan | yes | - | yes | SchedulerController |
| GET | /schedule/suggested | yes | - | yes | SchedulerController |
| GET | /schedule | yes | - | yes | SchedulerController |
| POST | /schedule | yes | - | yes | SchedulerController |
| GET | /subjects/:id | yes | - | no | SubjectsController |
| GET | /subjects | yes | - | no | SubjectsController |
| POST | /subscription/create-checkout-session | yes | - | yes | SubscriptionController |
| GET | /subscription/status | yes | - | yes | SubscriptionController |
| POST | /subscription/webhook | **NO** | - | yes | SubscriptionController |
| GET | /teacher-analytics/cohort | yes | TEACHER, ADMIN | yes | TeacherAnalyticsController |
| GET | /teacher-analytics/content-performance | yes | TEACHER, ADMIN | yes | TeacherAnalyticsController |
| GET | /teacher-analytics/export-csv | yes | TEACHER, ADMIN | yes | TeacherAnalyticsController |
| GET | /teacher-analytics/student/:studentId | yes | TEACHER, ADMIN | yes | TeacherAnalyticsController |
| GET | /teacher-analytics/students | yes | TEACHER, ADMIN | yes | TeacherAnalyticsController |
| GET | /teacher-analytics/worksheet-performance | yes | TEACHER, ADMIN | yes | TeacherAnalyticsController |
| GET | /teacher/analytics | yes | TEACHER, ADMIN | yes | TeacherOpsController |
| POST | /teacher/classes/:id/enroll | yes | TEACHER, ADMIN | yes | TeacherOpsController |
| GET | /teacher/classes | yes | TEACHER, ADMIN | yes | TeacherOpsController |
| POST | /teacher/classes | yes | TEACHER, ADMIN | yes | TeacherOpsController |
| POST | /teacher/content/assign | yes | TEACHER, ADMIN | yes | TeacherOpsController |
| POST | /teacher/content/publish/:id | yes | TEACHER, ADMIN | yes | TeacherOpsController |
| GET | /teacher/content | yes | TEACHER, ADMIN | yes | TeacherOpsController |
| GET | /teacher/dashboard | yes | TEACHER, ADMIN | yes | TeacherOpsController |
| POST | /teacher/interventions/:id/resolve | yes | TEACHER, ADMIN | yes | TeacherOpsController |
| GET | /teacher/interventions | yes | TEACHER, ADMIN | yes | TeacherOpsController |
| POST | /teacher/recommendations/:id/approve | yes | TEACHER, ADMIN | yes | TeacherOpsController |
| POST | /teacher/recommendations/:id/override | yes | TEACHER, ADMIN | yes | TeacherOpsController |
| GET | /teacher/recommendations | yes | TEACHER, ADMIN | yes | TeacherOpsController |
| GET | /teacher/students/:id | yes | TEACHER, ADMIN | yes | TeacherOpsController |
| POST | /teacher/students/:studentId/topics/:topicId/difficulty | yes | TEACHER, ADMIN | yes | TeacherOpsController |
| GET | /teacher/students | yes | TEACHER, ADMIN | yes | TeacherOpsController |
| GET | /users/me | yes | - | yes | UsersController |
| PATCH | /users/profile | yes | - | yes | UsersController |
