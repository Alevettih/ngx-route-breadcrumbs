import {
  EnvironmentProviders,
  inject,
  makeEnvironmentProviders,
  provideAppInitializer,
} from '@angular/core';

import { RouteBreadcrumbsService } from './route-breadcrumbs.service';

export function provideRouteBreadcrumbsService(): EnvironmentProviders {
  return makeEnvironmentProviders([
    RouteBreadcrumbsService,
    /**
     * Ensures breadcrumbs are initialized even when the consuming component is not rendered yet.
     */
    provideAppInitializer((): void => {
      const breadcrumbs = inject(RouteBreadcrumbsService);
      breadcrumbs.items();
    }),
  ]);
}
