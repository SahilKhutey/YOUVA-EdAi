import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import {
  MetricComparison,
  ScenarioComparisonDto,
  SimulationResultDto,
} from '../domain/twin.types';
import { ScenarioService } from '../scenarios/scenario.service';

@Injectable()
export class ScenarioComparisonService {
  private readonly logger = new Logger(ScenarioComparisonService.name);

  constructor(private readonly scenarioService: ScenarioService) {}

  async compareScenarios(
    baselineScenarioId: string,
    scenarioId: string,
  ): Promise<ScenarioComparisonDto> {
    this.logger.log(`Comparing scenario '${scenarioId}' against baseline '${baselineScenarioId}'...`);

    const baselineScenario = await this.scenarioService.getScenario(baselineScenarioId);
    const targetScenario = await this.scenarioService.getScenario(scenarioId);

    const baselineResult: SimulationResultDto | undefined = baselineScenario.results?.[0];
    const targetResult: SimulationResultDto | undefined = targetScenario.results?.[0];

    if (!baselineResult) {
      throw new BadRequestException(
        `Baseline scenario '${baselineScenarioId}' does not have any simulation results. Run simulation first.`,
      );
    }

    if (!targetResult) {
      throw new BadRequestException(
        `Target scenario '${scenarioId}' does not have any simulation results. Run simulation first.`,
      );
    }

    const metrics: MetricComparison[] = [
      {
        metric: 'Affected Learners',
        baseline: baselineResult.projected.affectedLearners,
        scenario: targetResult.projected.affectedLearners,
        delta: targetResult.projected.affectedLearners - baselineResult.projected.affectedLearners,
        unit: 'learners',
      },
      {
        metric: 'Affected Courses',
        baseline: baselineResult.projected.affectedCourses,
        scenario: targetResult.projected.affectedCourses,
        delta: targetResult.projected.affectedCourses - baselineResult.projected.affectedCourses,
        unit: 'courses',
      },
      {
        metric: 'Prerequisite Conflicts',
        baseline: baselineResult.projected.prerequisiteConflicts,
        scenario: targetResult.projected.prerequisiteConflicts,
        delta: targetResult.projected.prerequisiteConflicts - baselineResult.projected.prerequisiteConflicts,
        unit: 'conflicts',
      },
      {
        metric: 'Assessment Conflicts',
        baseline: baselineResult.projected.assessmentConflicts,
        scenario: targetResult.projected.assessmentConflicts,
        delta: targetResult.projected.assessmentConflicts - baselineResult.projected.assessmentConflicts,
        unit: 'conflicts',
      },
      {
        metric: 'Teacher Workload Delta',
        baseline: `${baselineResult.projected.estimatedTeacherWorkloadDeltaPct.toFixed(1)}%`,
        scenario: `${targetResult.projected.estimatedTeacherWorkloadDeltaPct.toFixed(1)}%`,
        delta: `${(targetResult.projected.estimatedTeacherWorkloadDeltaPct - baselineResult.projected.estimatedTeacherWorkloadDeltaPct).toFixed(1)}%`,
        unit: '%',
      },
      {
        metric: 'Remediation Demand Delta',
        baseline: `${baselineResult.projected.estimatedRemediationDemandDeltaPct.toFixed(1)}%`,
        scenario: `${targetResult.projected.estimatedRemediationDemandDeltaPct.toFixed(1)}%`,
        delta: `${(targetResult.projected.estimatedRemediationDemandDeltaPct - baselineResult.projected.estimatedRemediationDemandDeltaPct).toFixed(1)}%`,
        unit: '%',
      },
    ];

    return {
      baselineScenarioId,
      scenarioId,
      metrics,
      impacts: targetResult.impacts,
      conflicts: targetResult.conflicts,
      assumptions: targetResult.assumptions,
      limitations: targetResult.limitations,
    };
  }
}
