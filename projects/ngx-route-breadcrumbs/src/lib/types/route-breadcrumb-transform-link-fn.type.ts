import { RouteBreadcrumbMeta } from './route-breadcrumb-meta.type';

export type RouteBreadcrumbTransformLinkFn = (
  link: string,
  meta: RouteBreadcrumbMeta,
) => string;
