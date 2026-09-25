import { Controller, Get, Param, Query } from '@nestjs/common';
import { AssuranceDomain, AssuranceRuleDto } from '../domain/assurance.types';
import { RuleRegistryService } from '../rules/registry/rule-registry.service';

@Controller('api/v1/assurance/rules')
export class RuleRegistryController {
  constructor(private readonly ruleRegistry: RuleRegistryService) {}

  @Get()
  async listRules(@Query('domain') domain?: AssuranceDomain): Promise<AssuranceRuleDto[]> {
    return this.ruleRegistry.listRules(domain);
  }

  @Get(':id')
  async getRule(
    @Param('id') id: string,
    @Query('version') version?: string,
  ): Promise<AssuranceRuleDto | null> {
    return this.ruleRegistry.getRule(id, version ?? '1.0.0');
  }
}
