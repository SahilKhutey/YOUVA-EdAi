import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import { CredentialMeshService } from '../credential-mesh/credential-mesh.service';

/**
 * Handles continuous, embedded, and project-based AI assessments.
 */
@Injectable()
export class AssessmentIntelligenceService {
    constructor(
        private prisma: PrismaService,
        private aiService: AiService,
        private credentialMesh: CredentialMeshService
    ) { }

    /**
     * Teacher or System assigns a complex Assessment Project to a student.
     */
    async assignProject(userId: string, topicId: string, prompt: string, gradingRubric: string) {
        return this.prisma.assessmentProject.create({
            data: {
                userId,
                topicId,
                prompt,
                gradingRubric
            }
        });
    }

    /**
     * The AI evaluates a submitted project, scoring logic and originality.
     * If the student passes spectacularly, a Skill Credential is minted.
     */
    async evaluateSubmission(projectId: string, submissionContent: string) {
        const project = await this.prisma.assessmentProject.findUnique({
            where: { id: projectId },
            include: { topic: true }
        });

        if (!project) throw new NotFoundException('Project not found');

        // AI grading prompt evaluating Logic Trees and Originality against the Rubric
        const evalPrompt = "You are an expert AI Examiner evaluating a complex project submission.\n" +
            "Topic: " + project.topic.title + "\n" +
            "Project Prompt Task: " + project.prompt + "\n" +
            "Grading Rubric (Bloom's Aligned): " + project.gradingRubric + "\n" +
            "Student Submission:\n" +
            "\"\"\"\n" +
            submissionContent + "\n" +
            "\"\"\"\n\n" +
            "Analyze this submission strictly. Return ONLY a valid JSON object with the following structure:\n" +
            "{\n" +
            '  "logicScore": <float between 0.0 and 1.0 representing logical soundness>,\n' +
            '  "originalityScore": <float between 0.0 and 1.0 representing independent thought vs rote recitation>,\n' +
            '  "overallValidation": <float between 0.0 and 1.0 representing final mastery>,\n' +
            '  "feedback": "<detailed string of qualitative feedback>"\n' +
            "}\n";

        try {
            const aiResponse = await this.aiService.generateText(evalPrompt);
            const cleaned = aiResponse.replace(/```json/g, '').replace(/```/g, '').trim();
            const gradingResult = JSON.parse(cleaned);

            // Update Project
            const updatedProject = await this.prisma.assessmentProject.update({
                where: { id: projectId },
                data: {
                    logicScore: gradingResult.logicScore,
                    originalityScore: gradingResult.originalityScore,
                    status: 'EVALUATED',
                    evaluatedAt: new Date()
                }
            });

            // Layer 8 Global Credential Mesh Integration
            // If mastery > 0.85, map the generic subject 'Topic' to a global 'SkillNode' and mint a credential.
            let mintedCredentialUrl = null;
            if (gradingResult.overallValidation >= 0.85) {
                // Find or create the equivalent SkillNode for this Topic
                const nodeName = "Mastery: " + project.topic.title;
                let skillNode = await this.prisma.skillNode.findUnique({ where: { name: nodeName } });

                if (!skillNode) {
                    skillNode = await this.prisma.skillNode.create({
                        data: { name: nodeName, type: 'COMPETENCY' }
                    });
                }

                const cred = await this.credentialMesh.issueCredential(
                    project.userId,
                    skillNode.id,
                    gradingResult.overallValidation
                );
                mintedCredentialUrl = cred.blockchainHash;
            }

            return {
                updatedProject,
                gradingResult,
                mintedCredentialUrl
            };

        } catch (e) {
            console.error('Failed to evaluate project with AI', e);
            throw new Error("Assessment Intelligence Evaluation Failed. Could not parse AI response.");
        }
    }
}
