export interface RouteBreadcrumb {
  key: string;
  link?: string | null;
  action?: (event: MouseEvent) => unknown;
  icon?: string;
  params?: Record<string, string>;
}
