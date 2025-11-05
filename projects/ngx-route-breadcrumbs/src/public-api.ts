/*
 * Public API Surface of ngx-route-breadcrumbs
 */

export { setBreadcrumb } from './lib/helpers';
export {
  provideRouteBreadcrumbsService,
  RouteBreadcrumbsService,
} from './lib/services';
export { type RouteBreadcrumb, type RouteBreadcrumbConfig } from './lib/models';
export {
  type RouteBreadcrumbMeta,
  type RouteBreadcrumbTransformLinkFn,
} from './lib/types';
