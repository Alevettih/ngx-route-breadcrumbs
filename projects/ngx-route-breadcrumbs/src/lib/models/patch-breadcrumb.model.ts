import { RouteBreadcrumb } from './route-breadcrumb.model';

export interface PatchBreadcrumb extends Partial<RouteBreadcrumb> {
  index: number;
}
