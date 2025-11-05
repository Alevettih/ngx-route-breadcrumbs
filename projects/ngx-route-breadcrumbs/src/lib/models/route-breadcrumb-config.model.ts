import { RouteBreadcrumbTransformLinkFn } from '../types';

import { RouteBreadcrumb } from './route-breadcrumb.model';

export interface RouteBreadcrumbConfig extends Omit<RouteBreadcrumb, 'link'> {
  transformLink?: RouteBreadcrumbTransformLinkFn;
}
