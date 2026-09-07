export interface MultimodalPolicy {
  allowImage: boolean;
  allowAudio: boolean;
  allowSpeech: boolean;
  allowVideo: boolean;

  maxInputBytes: number;
  maxDurationSeconds: number;

  requiresTeacherReview: boolean;
}

export function getMultimodalPolicy(ageTier: string): MultimodalPolicy {
  const normalizedTier = ageTier?.toUpperCase() ?? '';

  switch (normalizedTier) {
    case 'KIDS':
    case 'CHILD':
      return {
        allowImage: true,
        allowAudio: true,
        allowSpeech: true,
        allowVideo: false,
        maxInputBytes: 5_000_000,
        maxDurationSeconds: 60,
        requiresTeacherReview: true,
      };

    case 'MIDDLE_SCHOOL':
      return {
        allowImage: true,
        allowAudio: true,
        allowSpeech: true,
        allowVideo: true,
        maxInputBytes: 10_000_000,
        maxDurationSeconds: 120,
        requiresTeacherReview: false,
      };

    case 'HIGH_SCHOOL':
    case 'TEEN':
    case 'ADULT':
      return {
        allowImage: true,
        allowAudio: true,
        allowSpeech: true,
        allowVideo: true,
        maxInputBytes: 20_000_000,
        maxDurationSeconds: 300,
        requiresTeacherReview: false,
      };

    default:
      throw new Error('Unsupported age tier.');
  }
}
