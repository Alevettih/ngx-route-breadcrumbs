import { Event } from '@angular/router';

export type RouterEventTypeGuardFn<T extends Event> = (
  event: Event,
) => event is T;
