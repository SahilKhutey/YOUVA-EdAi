import { Test, TestingModule } from '@nestjs/testing';
import { PedagogyService } from './pedagogy.service';

describe('PedagogyService', () => {
  let service: PedagogyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PedagogyService],
    }).compile();

    service = module.get<PedagogyService>(PedagogyService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
