import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
} from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { RouteBreadcrumbConfig, RouteBreadcrumb } from '../models';

import { RouteBreadcrumbsService } from './route-breadcrumbs.service';

@Component({
  selector: 'test-outlet-component',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<router-outlet />',
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
    it('should add and update items in the breadcrumbs collection and remove this changes on component destroy', async (): Promise<void> => {
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
  });
});
