import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
} from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import {
  Router,
  RouterOutlet,
  provideRouter,
  UrlSegment,
  UrlMatchResult,
} from '@angular/router';

import { type RouteBreadcrumbConfig, type RouteBreadcrumb } from '../models';

import { RouteBreadcrumbsService } from './route-breadcrumbs.service';

export function recursiveMatcher(
  segments: UrlSegment[],
): UrlMatchResult | null {
  if (segments.length === 0) {
    return null;
  }

  return { consumed: segments };
}

@Component({
  selector: 'test-outlet-component',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<router-outlet />',
  imports: [RouterOutlet],
})
class TestOutletComponent {
  public breadcrumbs = inject(RouteBreadcrumbsService);
  public destroyRef = inject(DestroyRef);
}
@Component({
  selector: 'test-component',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '',
})
class TestComponent {
  public breadcrumbs = inject(RouteBreadcrumbsService);
  public destroyRef = inject(DestroyRef);
}

describe('RouteBreadcrumbsService', (): void => {
  async function setup(): Promise<{
    service: RouteBreadcrumbsService;
    fixture: ComponentFixture<TestComponent>;
    breadcrumbs: RouteBreadcrumb[];
    router: Router;
  }> {
    const breadcrumbs: RouteBreadcrumb[] = [
      { key: 'Home', link: '/home' },
      {
        key: 'First',
        link: '/home/1',
        params: { name: 'test entity' },
      },
      { key: 'Last', link: '/home/1/last' },
    ];

    await TestBed.configureTestingModule({
      providers: [
        RouteBreadcrumbsService,
        provideRouter([
          {
            path: 'home',
            component: TestOutletComponent,
            data: { breadcrumb: <RouteBreadcrumbConfig>{ key: 'Home' } },
            children: [
              {
                path: 'without-key',
                component: TestComponent,
                data: {
                  breadcrumb: <RouteBreadcrumbConfig>{ icon: 'hidden' },
                },
              },
              {
                path: 'with-icon',
                component: TestComponent,
                data: {
                  breadcrumb: <RouteBreadcrumbConfig>{
                    key: 'WithIcon',
                    icon: 'home',
                  },
                },
              },
              {
                path: 'transformed-link',
                component: TestComponent,
                data: {
                  entity: { id: '42' },
                  breadcrumb: <RouteBreadcrumbConfig>{
                    key: 'TransformedLink',
                    transformLink: (link, meta): string =>
                      `${link}?entityId=${(meta['entity'] as Record<string, string>)['id']}`,
                  },
                },
              },
              {
                path: 'static-params',
                component: TestComponent,
                data: {
                  breadcrumb: <RouteBreadcrumbConfig>{
                    key: 'StaticParams',
                    params: { label: 'plain text' },
                  },
                },
              },
              {
                path: ':dynamicPath',
                component: TestComponent,
                data: {
                  dynamicPath: 'resolved-path',
                  breadcrumb: <RouteBreadcrumbConfig>{
                    key: 'DynamicPath',
                  },
                },
              },
              {
                path: 'recursive',
                component: TestOutletComponent,
                data: {
                  breadcrumb: <RouteBreadcrumbConfig>{ key: 'Recursive' },
                },
                children: [
                  {
                    matcher: recursiveMatcher,
                    component: TestComponent,
                    data: {
                      breadcrumb: <RouteBreadcrumbConfig>{
                        key: 'RecursiveChild',
                      },
                    },
                  },
                ],
              },
              {
                path: ':id',
                component: TestOutletComponent,
                data: {
                  entity: { id: '1', name: 'test entity' },
                  breadcrumb: <RouteBreadcrumbConfig>{
                    key: 'First',
                    params: { name: ':entity.name' },
                  },
                },
                children: [
                  {
                    path: 'last',
                    component: TestComponent,
                    data: {
                      breadcrumb: <RouteBreadcrumbConfig>{ key: 'Last' },
                    },
                  },
                ],
              },
            ],
          },
        ]),
      ],
    }).compileComponents();

    const router = TestBed.inject(Router);
    const fixture = TestBed.createComponent(TestComponent);
    const service = fixture.componentInstance.breadcrumbs;

    router.initialNavigation();

    return {
      router,
      breadcrumbs,
      fixture,
      service,
    };
  }

  it('should get breadcrumbs', async (): Promise<void> => {
    const { service, router, breadcrumbs } = await setup();

    await router.navigateByUrl('/home/1/last');

    expect(service.items()).toEqual(breadcrumbs);
  });

  it('should get recursive breadcrumbs', async (): Promise<void> => {
    const { service, router } = await setup();

    await router.navigateByUrl('/home/recursive/a/b/c/d/e/f');

    expect(service.items()).toEqual([
      { key: 'Home', link: '/home' },
      { key: 'Recursive', link: '/home/recursive' },
      { key: 'RecursiveChild', link: '/home/recursive/a' },
      { key: 'RecursiveChild', link: '/home/recursive/a/b' },
      { key: 'RecursiveChild', link: '/home/recursive/a/b/c' },
      { key: 'RecursiveChild', link: '/home/recursive/a/b/c/d' },
      { key: 'RecursiveChild', link: '/home/recursive/a/b/c/d/e' },
      { key: 'RecursiveChild', link: '/home/recursive/a/b/c/d/e/f' },
    ]);
  });

  it('should skip breadcrumb config without key', async (): Promise<void> => {
    const { service, router } = await setup();

    await router.navigateByUrl('/home/without-key');

    expect(service.items()).toEqual([{ key: 'Home', link: '/home' }]);
  });

  it('should include breadcrumb icon', async (): Promise<void> => {
    const { service, router } = await setup();

    await router.navigateByUrl('/home/with-icon');

    expect(service.items()).toEqual([
      { key: 'Home', link: '/home' },
      { key: 'WithIcon', icon: 'home', link: '/home/with-icon' },
    ]);
  });

  it('should transform breadcrumb link using route meta', async (): Promise<void> => {
    const { service, router } = await setup();

    await router.navigateByUrl('/home/transformed-link');

    expect(service.items()).toEqual([
      { key: 'Home', link: '/home' },
      {
        key: 'TransformedLink',
        link: '/home/transformed-link?entityId=42',
      },
    ]);
  });

  it('should keep static breadcrumb params as is', async (): Promise<void> => {
    const { service, router } = await setup();

    await router.navigateByUrl('/home/static-params');

    expect(service.items()).toEqual([
      { key: 'Home', link: '/home' },
      {
        key: 'StaticParams',
        link: '/home/static-params',
        params: { label: 'plain text' },
      },
    ]);
  });

  describe('back', (): void => {
    it('should return the second to last breadcrumb if it exists', async (): Promise<void> => {
      const { service, router, breadcrumbs } = await setup();

      await router.navigateByUrl('/home/1/last');

      expect(service.backItem()).toEqual(breadcrumbs[1]);
    });

    it('should return the first breadcrumb if there is no second to last breadcrumb', async (): Promise<void> => {
      const { service, router, breadcrumbs } = await setup();

      await router.navigateByUrl('/home');

      expect(service.backItem()).toEqual(breadcrumbs[0]);
    });

    it('should return undefined if there are no breadcrumbs', async (): Promise<void> => {
      const { service, router } = await setup();

      await router.navigateByUrl('/');

      expect(service.backItem()).toBeUndefined();
    });
  });

  describe('extend', (): void => {
    it('should apply add and negative-index patch together and rollback both on component destroy', async (): Promise<void> => {
      const { service, fixture, router, breadcrumbs } = await setup();

      const breadcrumbToAdd = { key: 'Additional Item' };
      const breadcrumbToPatch = { key: 'Patched Item' };

      await router.navigateByUrl('/home/1/last');

      service.extend(
        {
          add: [breadcrumbToAdd],
          patch: [{ index: -1, ...breadcrumbToPatch }],
        },
        fixture.componentInstance.destroyRef,
      );

      expect(service.items().length).toEqual(4);
      expect(service.items().at(-1)).toEqual(breadcrumbToAdd);
      expect(service.items().at(-2)).toEqual({
        ...breadcrumbs.at(-1),
        ...breadcrumbToPatch,
      });

      fixture.destroy();

      expect(service.items().length).toEqual(3);
      expect(service.items()).toEqual(breadcrumbs);
    });

    it('should add items without patching and remove them on component destroy', async (): Promise<void> => {
      const { service, fixture, router, breadcrumbs } = await setup();

      const firstBreadcrumbToAdd = { key: 'Additional First' };
      const secondBreadcrumbToAdd = {
        key: 'Additional Second',
        link: '/additional-second',
      };

      await router.navigateByUrl('/home/1/last');

      service.extend(
        {
          add: [firstBreadcrumbToAdd, secondBreadcrumbToAdd],
        },
        fixture.componentInstance.destroyRef,
      );

      expect(service.items()).toEqual([
        ...breadcrumbs,
        firstBreadcrumbToAdd,
        secondBreadcrumbToAdd,
      ]);

      fixture.destroy();

      expect(service.items()).toEqual(breadcrumbs);
    });

    it('should patch item by positive index and remove patch on component destroy', async (): Promise<void> => {
      const { service, fixture, router, breadcrumbs } = await setup();

      await router.navigateByUrl('/home/1/last');

      service.extend(
        {
          patch: [
            {
              index: 1,
              key: 'Patched First',
              link: '/patched-first',
            },
          ],
        },
        fixture.componentInstance.destroyRef,
      );

      expect(service.items()).toEqual([
        breadcrumbs[0],
        {
          ...breadcrumbs[1],
          key: 'Patched First',
          link: '/patched-first',
        },
        breadcrumbs[2],
      ]);

      fixture.destroy();

      expect(service.items()).toEqual(breadcrumbs);
    });

    it('should ignore patch for non-existing index', async (): Promise<void> => {
      const { service, fixture, router, breadcrumbs } = await setup();

      await router.navigateByUrl('/home/1/last');

      service.extend(
        {
          patch: [{ index: 10, key: 'Out of bounds' }],
        },
        fixture.componentInstance.destroyRef,
      );

      expect(service.items()).toEqual(breadcrumbs);

      fixture.destroy();

      expect(service.items()).toEqual(breadcrumbs);
    });

    it('should not overwrite existing breadcrumb fields with undefined patch values', async (): Promise<void> => {
      const { service, fixture, router, breadcrumbs } = await setup();

      await router.navigateByUrl('/home/1/last');

      service.extend(
        {
          patch: [
            {
              index: 1,
              key: undefined,
              link: '/patched-link',
            },
          ],
        },
        fixture.componentInstance.destroyRef,
      );

      expect(service.items()[1]).toEqual({
        ...breadcrumbs[1],
        link: '/patched-link',
      });

      fixture.destroy();

      expect(service.items()).toEqual(breadcrumbs);
    });

    it('should remove all added items with the same key on component destroy', async (): Promise<void> => {
      const { service, fixture, router, breadcrumbs } = await setup();

      const duplicateKeyBreadcrumb = { key: 'Duplicate' };

      await router.navigateByUrl('/home/1/last');

      service.extend(
        {
          add: [
            duplicateKeyBreadcrumb,
            {
              ...duplicateKeyBreadcrumb,
              link: '/duplicate',
            },
          ],
        },
        fixture.componentInstance.destroyRef,
      );

      expect(service.items()).toEqual([
        ...breadcrumbs,
        duplicateKeyBreadcrumb,
        {
          ...duplicateKeyBreadcrumb,
          link: '/duplicate',
        },
      ]);

      fixture.destroy();

      expect(service.items()).toEqual(breadcrumbs);
    });
  });
});
