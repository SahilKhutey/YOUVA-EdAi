import { IsNotEmpty, IsString, IsOptional, IsEnum } from 'class-validator';
import { ActivityType, Modality, Pacing } from '../domain/enums';

export class PersonalizationRequestDto {
  @IsNotEmpty()
  @IsString()
  topicId: string;

  @IsOptional()
  @IsEnum(ActivityType)
  preferredActivityType?: ActivityType;

  @IsOptional()
  @IsEnum(Modality)
  preferredModality?: Modality;

  @IsOptional()
  @IsEnum(Pacing)
  preferredPacing?: Pacing;
}
