import { ActivationEnd, Event } from '@angular/router';

import { RouterEventTypeGuardFn } from '../../types';

export const isActivationEnd: RouterEventTypeGuardFn<ActivationEnd> = (
  event: Event,
): event is ActivationEnd => event instanceof ActivationEnd;
