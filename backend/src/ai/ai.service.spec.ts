import { Test, TestingModule } from '@nestjs/testing';
import { AiService } from './ai.service';
import { GeminiProvider } from './providers/gemini.provider';
import { OllamaProvider } from './providers/ollama.provider';
import { DeterministicFallbackProvider } from './providers/deterministic-fallback.provider';
import { ProviderTier } from './interfaces/llm-provider.interface';

describe('AiService Multi-Provider Gateway', () => {
  let service: AiService;
  let geminiProvider: jest.Mocked<GeminiProvider>;
  let ollamaProvider: jest.Mocked<OllamaProvider>;
  let fallbackProvider: DeterministicFallbackProvider;

  beforeEach(async () => {
    const mockGemini = {
      tier: ProviderTier.PRIMARY_GEMINI,
      isAvailable: jest.fn().mockResolvedValue(true),
      generateText: jest.fn().mockResolvedValue('Gemini pedagogical response'),
    };

    const mockOllama = {
      tier: ProviderTier.SECONDARY_OLLAMA,
      isAvailable: jest.fn().mockResolvedValue(true),
      generateText: jest.fn().mockResolvedValue('Ollama local model response'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiService,
        { provide: GeminiProvider, useValue: mockGemini },
        { provide: OllamaProvider, useValue: mockOllama },
        DeterministicFallbackProvider,
      ],
    }).compile();

    service = module.get<AiService>(AiService);
    geminiProvider = module.get(GeminiProvider);
    ollamaProvider = module.get(OllamaProvider);
    fallbackProvider = module.get(DeterministicFallbackProvider);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should utilize Primary Gemini when available and healthy', async () => {
    const res = await service.generateTextWithFallback('Explain linear equations');
    expect(res.provider).toBe(ProviderTier.PRIMARY_GEMINI);
    expect(res.fallbackUsed).toBe(false);
    expect(res.text).toBe('Gemini pedagogical response');
    expect(geminiProvider.generateText).toHaveBeenCalled();
  });

  it('should failover to Secondary Ollama when Primary is unavailable', async () => {
    geminiProvider.isAvailable.mockResolvedValue(false);

    const res = await service.generateTextWithFallback('Explain linear equations');
    expect(res.provider).toBe(ProviderTier.SECONDARY_OLLAMA);
    expect(res.fallbackUsed).toBe(true);
    expect(res.text).toBe('Ollama local model response');
    expect(ollamaProvider.generateText).toHaveBeenCalled();
  });

  it('should degrade to Deterministic Cache when all external providers fail', async () => {
    geminiProvider.isAvailable.mockResolvedValue(false);
    ollamaProvider.isAvailable.mockResolvedValue(false);

    const res = await service.generateTextWithFallback('MATH-G8-LINEQ-01 help');
    expect(res.provider).toBe(ProviderTier.DETERMINISTIC_CACHE);
    expect(res.fallbackUsed).toBe(true);
    expect(res.text).toContain('isolate the unknown variable');
  });

  it('should generate valid JSON quiz even during complete external AI outage', async () => {
    geminiProvider.isAvailable.mockResolvedValue(false);
    ollamaProvider.isAvailable.mockResolvedValue(false);

    const quiz = await service.generateQuiz('Linear Equations', 'Basic operations');
    expect(Array.isArray(quiz)).toBe(true);
    expect(quiz.length).toBeGreaterThan(0);
    expect(quiz[0]).toHaveProperty('content');
    expect(quiz[0]).toHaveProperty('correctAnswer');
  });

  it('should support Socratic chat with tutor via fallback', async () => {
    geminiProvider.isAvailable.mockResolvedValue(false);
    ollamaProvider.isAvailable.mockResolvedValue(false);

    const response = await service.chatWithTutor(
      'Linear equations',
      'I do not know what to do with 3x + 5 = 20',
    );
    expect(response).toContain('inverse operation');
  });
});
