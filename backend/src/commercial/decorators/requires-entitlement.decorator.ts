import { SetMetadata } from '@nestjs/common';
import { Entitlement } from '../commercial.constants';

export const REQUIRED_ENTITLEMENT = 'required_entitlement';

export const RequiresEntitlement = (
  entitlement: Entitlement,
): MethodDecorator => SetMetadata(REQUIRED_ENTITLEMENT, entitlement);
