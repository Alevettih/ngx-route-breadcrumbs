# @alevettih/ngx-route-breadcrumbs

An Angular service that simplifies the creation of breadcrumbs that use routing url and params as a basis.

## Installation

```bash
npm install @alevettih/ngx-route-breadcrumbs
```

### Requirements

- Angular 18+
- RxJS 7.8+
- es-toolkit 1.41+

## Features

- ✅ Create breadcrumbs from routing info.
- ✅ Provide routing data/params into breadcrumbs with interpolation.
- ✅ Return metadata for implementing a "Back" button.
- ✅ Programmatically manipulate breadcrumbs (changes are rolled back when the contributing component is destroyed).
- ✅ Transform links based on route data (`transformLink` method).

## Quick Start

### 1. Provide the service

Import `provideRouteBreadcrumbsService` in your `app.config.ts` or `main.ts`:

```typescript
import { ApplicationConfig } from '@angular/core';
import { provideRouteBreadcrumbsService } from '@alevettih/ngx-route-breadcrumbs';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouteBreadcrumbsService(),
    // ... other providers
  ],
};
```

### 2. Set breadcrumb config to route

```typescript
import { Routes } from '@angular/router';
import {
  RouteBreadcrumbConfig,
  RouteBreadcrumbMeta,
  setBreadcrumb,
} from '@alevettih/ngx-route-breadcrumbs';

export const appRoutes: Routes = [
  {
    path: 'user',
    data: {
      breadcrumb: <RouteBreadcrumbConfig>{
        key: 'Breadcrumbs.User.Root',
        transformLink: (url: string, meta: RouteBreadcrumbMeta): string =>
          meta['userId'] ? `${url}/quick/${meta['userId']}` : url,
      },
    },
    children: [
      {
        path: ':userId',
        resolve: { user: userResolver },
        component: UserEditComponent,
        data: {
          // setBreadcrumb helps provide the correct configuration shape.
          breadcrumb: setBreadcrumb({
            key: 'Breadcrumbs.User.Edit',
            params: {
              name: ':user.name',
            },
          }),
        },
        children: [
          // child routes...
        ],
      },
    ],
  },
];
```

### 3. Create your breadcrumbs component

```typescript
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  output,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  RouteBreadcrumb,
  RouteBreadcrumbsService,
} from '@alevettih/ngx-route-breadcrumbs';

@Component({
  selector: 'breadcrumbs',
  styleUrl: './breadcrumbs.component.less',
  templateUrl: `
    @if (breadcrumbs().length) {
      <nav>
        @for (item of breadcrumbs(); track item.key; let last = $last) {
          @if (item.link) {
            <a
              [routerLink]="item.link"
              [class.active]="last"
              [attr.inert]="last || undefined"
              (click)="onBreadcrumbClick($event, item)"
            >
              {{ item.key | translate: item.params }}
            </a>
          } @else {
            <button
              [class.active]="last"
              [attr.inert]="last || undefined"
              (click)="onBreadcrumbClick($event, item)"
            >
              {{ item.key | translate: item.params }}
            </button>
          }

          @if (!last) {
            <span>/</span>
          }
        }
      </nav>
    }
  `,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BreadcrumbsComponent {
  public readonly service = inject(RouteBreadcrumbsService);

  public readonly breadcrumbs = this.service.items;

  public readonly choose = output<RouteBreadcrumb>();

  public onBreadcrumbClick(
    event: MouseEvent,
    breadcrumb: RouteBreadcrumb,
  ): void {
    this.choose.emit(breadcrumb);
    breadcrumb.action?.(event);
  }
}
```

> **Note:** The component is provided as an example only - create your own based on your business logic.

### 4. Dynamically add/patch breadcrumbs (optional)

```typescript
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
} from '@angular/core';
import { RouteBreadcrumbsService } from '@alevettih/ngx-route-breadcrumbs';

@Component({
  selector: 'test-component',
  templateUrl: './test-component.component.html',
  styleUrls: ['./test-component.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TestComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly breadcrumbs = inject(RouteBreadcrumbsService);

  private extendBreadcrumbs(): void {
    this.breadcrumbs.extend(
      {
        add: [{ key: 'ProcessSegmentSpecificationElementsSelectModal.Title' }],
        patch: [
          {
            index: -1,
            action: (): void => this.close(),
            link: null,
          },
        ],
      },
      this.destroyRef,
    );
  }
}
```

## API Reference

### RouteBreadcrumbsService

| Method                                                                         | Description                                                                                                                      |
| ------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| `items(): Signal<RouteBreadcrumb[]>`                                           | Computed signal that combines router-derived breadcrumbs with temporary overrides.                                               |
| `backItem(): Signal<RouteBreadcrumb \| undefined>`                             | Computed signal that returns a breadcrumb suited for “Back” navigation (the penultimate item, or the first if only one exists).  |
| `extend(params: RouteBreadcrumbsExtendFnParams, destroyRef: DestroyRef): void` | Adds items from `params.add`, applies patches from `params.patch`, and automatically rolls back changes when `destroyRef` fires. |

### Helpers

| Helper                             | Description                                                                              |
| ---------------------------------- | ---------------------------------------------------------------------------------------- |
| `provideRouteBreadcrumbsService()` | Environment provider that wires up the service and eagerly initializes breadcrumbs.      |
| `setBreadcrumb(config)`            | Utility for building a `RouteBreadcrumbConfig` with dynamic param interpolation support. |

### Models & Types

#### RouteBreadcrumb

| Field    | Type                             | Description                                                                  |
| -------- | -------------------------------- | ---------------------------------------------------------------------------- |
| `key`    | `string`                         | Translation key or identifier displayed in the UI.                           |
| `link`   | `string \| null`                 | Optional router link; omit or set to `null` to render a non-link breadcrumb. |
| `action` | `(event: MouseEvent) => unknown` | Optional click handler invoked when the breadcrumb is selected.              |
| `icon`   | `string`                         | Optional icon token for visual decorators.                                   |
| `params` | `Record<string, string>`         | Optional key/value pairs supplied to translation pipes or templates.         |

#### RouteBreadcrumbConfig

Extends `RouteBreadcrumb` (without the `link` property) and adds configuration-only behaviour.

| Field           | Type                             | Description                                                                     |
| --------------- | -------------------------------- | ------------------------------------------------------------------------------- |
| `key`           | `string`                         | Inherited identifier propagated to the rendered breadcrumb.                     |
| `action`        | `(event: MouseEvent) => unknown` | Optional action executed when the breadcrumb is activated.                      |
| `icon`          | `string`                         | Optional icon token used by UI renderers.                                       |
| `params`        | `Record<string, string>`         | Optional interpolation data available to templates.                             |
| `transformLink` | `RouteBreadcrumbTransformLinkFn` | Optional per-route hook that adjusts the generated link using current metadata. |

#### RouteBreadcrumbsExtendFnParams

| Field   | Type                | Description                                                               |
| ------- | ------------------- | ------------------------------------------------------------------------- |
| `add`   | `RouteBreadcrumb[]` | Optional list of breadcrumbs to append after router-derived items.        |
| `patch` | `PatchBreadcrumb[]` | Optional set of partial updates applied to existing breadcrumbs by index. |

#### RouteBreadcrumbMeta

| Alias                 | Expands To      | Description                                                                                |
| --------------------- | --------------- | ------------------------------------------------------------------------------------------ |
| `RouteBreadcrumbMeta` | `Data & Params` | Combined Angular `data` and `params` objects exposed to interpolation and transform hooks. |

#### RouteBreadcrumbTransformLinkFn

| Item     | Type                  | Description                                                        |
| -------- | --------------------- | ------------------------------------------------------------------ |
| `link`   | `string`              | The link generated from routing information before transformation. |
| `meta`   | `RouteBreadcrumbMeta` | Aggregated metadata for the current route chain.                   |
| `return` | `string`              | The adjusted link returned to the breadcrumb service.              |

#### PatchBreadcrumb

| Field    | Type                             | Description                                                      |
| -------- | -------------------------------- | ---------------------------------------------------------------- |
| `index`  | `number`                         | Index of the breadcrumb to update within the current collection. |
| `key`    | `string`                         | Optional replacement key.                                        |
| `link`   | `string \| null`                 | Optional replacement link.                                       |
| `action` | `(event: MouseEvent) => unknown` | Optional replacement action.                                     |
| `icon`   | `string`                         | Optional replacement icon token.                                 |
| `params` | `Record<string, string>`         | Optional replacement interpolation parameters.                   |

## Compatibility

- **Angular:** 18.0.0+
- **TypeScript:** Use the version supported by your Angular release (Angular 18+ currently requires TypeScript 5.4 or newer)
- **RxJS:** 7.8+
- **es-toolkit:** 1.41+

## License

This library is distributed under the [MIT](LICENSE) license.

## Support

If you have questions or run into issues, please open an issue in the project repository.
