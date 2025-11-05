import { PatchBreadcrumb } from './patch-breadcrumb.model';
import { RouteBreadcrumb } from './route-breadcrumb.model';

export interface RouteBreadcrumbsExtendFnParams {
  add?: RouteBreadcrumb[];
  patch?: PatchBreadcrumb[];
}
