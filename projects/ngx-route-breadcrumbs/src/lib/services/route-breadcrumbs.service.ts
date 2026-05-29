import {
  computed,
  DestroyRef,
  inject,
  Injectable,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRouteSnapshot, Router, UrlSegment } from '@angular/router';
import { cloneDeep, merge, omit, omitBy, toMerged } from 'es-toolkit';
import { buffer, filter, map } from 'rxjs';

import { isActivationEnd, isNavigationEnd, getValue } from '../helpers';
import {
  RouteBreadcrumb,
  RouteBreadcrumbConfig,
  RouteBreadcrumbsExtendFnParams,
} from '../models';
import { RouteBreadcrumbMeta } from '../types';

@Injectable()
export class RouteBreadcrumbsService {
  private readonly router = inject(Router);

  private readonly navigationEnd$ = this.router.events.pipe(
    filter(isNavigationEnd),
    takeUntilDestroyed(),
  );
  private readonly activationEnd$ = this.router.events.pipe(
    filter(isActivationEnd),
    takeUntilDestroyed(),
  );
  private readonly additional = signal<RouteBreadcrumb[]>([]);
  private readonly base = computed<RouteBreadcrumb[]>(() =>
    this.getCollection(this.snapshots() ?? []),
  );
  private readonly unMutated = computed((): RouteBreadcrumb[] =>
    cloneDeep([...this.base(), ...this.additional()]),
  );
  private readonly mutations = signal<Record<number, RouteBreadcrumb>>({});
  private readonly snapshots = toSignal(
    this.activationEnd$.pipe(
      map(({ snapshot }): ActivatedRouteSnapshot => snapshot),
      buffer(this.navigationEnd$),
      map((snapshots): ActivatedRouteSnapshot[] => snapshots.reverse()),
    ),
  );

  public readonly items = computed((): RouteBreadcrumb[] =>
    this.unMutated().map(
      (item: RouteBreadcrumb, index: number): RouteBreadcrumb =>
        this.mutations()[index] ?? item,
    ),
  );

  public readonly backItem = computed((): RouteBreadcrumb | undefined => {
    const breadcrumbs: RouteBreadcrumb[] = this.items();
    /**
     * Generic helper that returns the breadcrumb used for "Back" button behavior.
     *
     * Chooses the penultimate breadcrumb (or the first one if the penultimate entry does not exist)
     * and relies on its link for navigation.
     */
    return breadcrumbs.at(-2) ?? breadcrumbs.at(0);
  });

  /**
   * Manipulates the breadcrumb list; any changes are rolled back when the component
   * that added them is destroyed.
   *
   * Use only when breadcrumbs cannot be provided via routing (for example, in modal flows).
   */
  public extend(
    { add = [], patch = [] }: RouteBreadcrumbsExtendFnParams,
    destroyRef: DestroyRef,
  ): void {
    for (const item of patch) {
      this.addMutation(item.index, omit(item, ['index']) as RouteBreadcrumb);
    }

    for (const item of add) {
      this.add(item);
    }

    destroyRef.onDestroy((): void => {
      for (const item of add) {
        this.remove(item.key);
      }

      for (const item of patch) {
        this.removeMutation(item.index);
      }
    });
  }

  private getBreadcrumbParams(
    config: RouteBreadcrumbConfig,
    data: RouteBreadcrumbMeta,
  ): Record<string, string> | undefined {
    const params: Record<string, string> = {};

    if (!config['params']) {
      return;
    }

    for (const interpolateKey in config['params']) {
      const dataKey = config['params'][interpolateKey];

      params[interpolateKey] = this.getDynamicItem(data, dataKey);
    }

    return params;
  }

  private getDynamicItem<T>(data: RouteBreadcrumbMeta, key: string): T {
    const dynamicKeyPrefix = ':';

    if (key.startsWith(dynamicKeyPrefix)) {
      const dataKeys = key
        .replace(new RegExp(`^\\${dynamicKeyPrefix}`), '')
        .split('.');

      return getValue<T>(data, dataKeys);
    }
    return key as T;
  }

  private getLink(
    data: RouteBreadcrumbMeta,
    pathFromRoot: ActivatedRouteSnapshot[],
  ): string {
    return pathFromRoot
      .map(({ url }): string =>
        url
          .map((segment: UrlSegment): string =>
            this.getDynamicItem(data, segment.toString()),
          )
          .join('/'),
      )
      .filter(Boolean)
      .join('/');
  }

  private getCollection(
    snapshots: ActivatedRouteSnapshot[],
  ): RouteBreadcrumb[] {
    return snapshots
      .filter(({ data }): boolean => Boolean(data['breadcrumb']))
      .reduce(this.prepareBreadcrumbs.bind(this), []);
  }

  private prepareBreadcrumbs(
    rootAcc: RouteBreadcrumb[],
    { data, pathFromRoot, routeConfig, url }: ActivatedRouteSnapshot,
    _index: number,
    snapshots: ActivatedRouteSnapshot[],
  ): RouteBreadcrumb[] {
    const config = data['breadcrumb'] as RouteBreadcrumbConfig | undefined;
    const meta: RouteBreadcrumbMeta = snapshots.reduce(
      (acc, snapshot): RouteBreadcrumbMeta =>
        omit(merge(acc, toMerged(snapshot.data, snapshot.params)), [
          'breadcrumb',
        ]),
      {},
    );

    if (!config?.['key']) {
      return [...rootAcc];
    }

    const links = this.getBreadcrumbLinks(meta, pathFromRoot, url, routeConfig);

    return links.reduce(
      (acc: RouteBreadcrumb[], link: string): RouteBreadcrumb[] => {
        if (
          acc.some(
            (item: RouteBreadcrumb): boolean =>
              item.key === config['key'] && item.link === link,
          )
        ) {
          return acc;
        }

        const breadcrumb: RouteBreadcrumb = {
          key: config['key'],
          icon: config['icon'],
          link: config.transformLink?.(link, meta) ?? link,
          params: this.getBreadcrumbParams(config, meta),
        };

        return [...acc, breadcrumb];
      },
      rootAcc,
    );
  }

  private getBreadcrumbLinks(
    data: RouteBreadcrumbMeta,
    pathFromRoot: ActivatedRouteSnapshot[],
    url: UrlSegment[],
    routeConfig: ActivatedRouteSnapshot['routeConfig'],
  ): string[] {
    const link = `/${this.getLink(data, pathFromRoot)}`;

    if (!routeConfig?.matcher || url.length <= 1) {
      return [link];
    }

    const parentLink = `/${this.getLink(data, pathFromRoot.slice(0, -1))}`;

    return url.map((_: UrlSegment, index: number): string => {
      const childLink = url
        .slice(0, index + 1)
        .map((segment: UrlSegment): string =>
          this.getDynamicItem(data, segment.toString()),
        )
        .join('/');

      return `${parentLink}/${childLink}`;
    });
  }

  private add(breadcrumb: RouteBreadcrumb): void {
    this.additional.update((items: RouteBreadcrumb[]): RouteBreadcrumb[] => [
      ...items,
      breadcrumb,
    ]);
  }

  private remove(key: string): void {
    this.additional.update((items: RouteBreadcrumb[]): RouteBreadcrumb[] =>
      items.filter((item: RouteBreadcrumb): boolean => item.key !== key),
    );
  }

  private addMutation(index: number, breadcrumb: RouteBreadcrumb): void {
    const items = this.unMutated();
    const normalizedIndex = index < 0 ? items.length + index : index;
    const item = items.at(index);

    if (item) {
      this.mutations.update(
        (
          breadcrumbsMap: Record<string, RouteBreadcrumb>,
        ): Record<string, RouteBreadcrumb> => ({
          ...breadcrumbsMap,
          [normalizedIndex]: {
            ...item,
            ...omitBy(
              breadcrumb,
              (value): boolean => typeof value === 'undefined',
            ),
          },
        }),
      );
    }
  }

  private removeMutation(index: number): void {
    const items = this.unMutated();
    const normalizedIndex = index < 0 ? items.length + index : index;

    if (items.at(index)) {
      this.mutations.update(
        (
          breadcrumbsMap: Record<string, RouteBreadcrumb>,
        ): Record<string, RouteBreadcrumb> =>
          omit(breadcrumbsMap, [normalizedIndex.toString()]),
      );
    }
  }
}
