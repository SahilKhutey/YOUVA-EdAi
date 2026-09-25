import {
  KnowledgePublishingStateMachine,
  TransitionContext,
} from './knowledge-publishing.machine';

describe('KnowledgePublishingStateMachine', () => {
  it('should allow teacher to submit DRAFT for review', () => {
    const context: TransitionContext = { actorRole: 'TEACHER' };
    expect(
      KnowledgePublishingStateMachine.canTransition('DRAFT', 'SUBMIT_FOR_REVIEW', context),
    ).toBe(true);

    const nextStatus = KnowledgePublishingStateMachine.transition(
      'DRAFT',
      'SUBMIT_FOR_REVIEW',
      context,
    );
    expect(nextStatus).toBe('IN_REVIEW');
  });

  it('should prevent teacher from directly publishing DRAFT without bypass', () => {
    const context: TransitionContext = { actorRole: 'TEACHER', isAuthorizedBypass: false };
    expect(
      KnowledgePublishingStateMachine.canTransition('DRAFT', 'PUBLISH', context),
    ).toBe(false);

    expect(() =>
      KnowledgePublishingStateMachine.transition('DRAFT', 'PUBLISH', context),
    ).toThrow(/Invalid knowledge transition/);
  });

  it('should allow admin to publish DRAFT with explicit authorized bypass', () => {
    const context: TransitionContext = { actorRole: 'ADMIN', isAuthorizedBypass: true };
    expect(
      KnowledgePublishingStateMachine.canTransition('DRAFT', 'PUBLISH', context),
    ).toBe(true);

    const nextStatus = KnowledgePublishingStateMachine.transition(
      'DRAFT',
      'PUBLISH',
      context,
    );
    expect(nextStatus).toBe('PUBLISHED');
  });

  it('should allow reviewer to approve IN_REVIEW content', () => {
    const context: TransitionContext = { actorRole: 'REVIEWER' };
    expect(
      KnowledgePublishingStateMachine.canTransition('IN_REVIEW', 'APPROVE', context),
    ).toBe(true);

    const nextStatus = KnowledgePublishingStateMachine.transition(
      'IN_REVIEW',
      'APPROVE',
      context,
    );
    expect(nextStatus).toBe('APPROVED');
  });

  it('should allow reviewer to request changes sending IN_REVIEW back to DRAFT', () => {
    const context: TransitionContext = { actorRole: 'REVIEWER' };
    const nextStatus = KnowledgePublishingStateMachine.transition(
      'IN_REVIEW',
      'REQUEST_CHANGES',
      context,
    );
    expect(nextStatus).toBe('DRAFT');
  });

  it('should allow publishing APPROVED content', () => {
    const context: TransitionContext = { actorRole: 'ADMIN' };
    const nextStatus = KnowledgePublishingStateMachine.transition(
      'APPROVED',
      'PUBLISH',
      context,
    );
    expect(nextStatus).toBe('PUBLISHED');
  });

  it('should allow archiving PUBLISHED content', () => {
    const context: TransitionContext = { actorRole: 'ADMIN' };
    const nextStatus = KnowledgePublishingStateMachine.transition(
      'PUBLISHED',
      'ARCHIVE',
      context,
    );
    expect(nextStatus).toBe('ARCHIVED');
  });
});
