import { Event, NavigationEnd } from '@angular/router';

import { RouterEventTypeGuardFn } from '../../types';

export const isNavigationEnd: RouterEventTypeGuardFn<NavigationEnd> = (
  event: Event,
): event is NavigationEnd => event instanceof NavigationEnd;
