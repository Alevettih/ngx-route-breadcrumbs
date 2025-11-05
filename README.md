# @alevettih/ngx-route-breadcrumbs

An Angular service that simplifies the creation of breadcrumbs that use routing url and params as a basis.

## Overview

`@alevettih/ngx-route-breadcrumbs` is an Angular library that provides a simple way to
create breadcrumbs from routing information.

## Features

- ✅ Create breadcrumbs from routing info.
- ✅ Provide routing data/params into breadcrumbs with interpolation.
- ✅ Return metadata for implementing a "Back" button.
- ✅ Programmatically manipulate breadcrumbs (changes are rolled back when the contributing component is destroyed).
- ✅ Transform links based on route data (`transformLink` method).

## API Overview

| Service                   | Description                                                                               |
| ------------------------- | ----------------------------------------------------------------------------------------- |
| `RouteBreadcrumbsService` | Provides APIs for building and manipulating breadcrumbs sourced from routing information. |

| Member                       | Description                                                                                    |
| ---------------------------- | ---------------------------------------------------------------------------------------------- |
| `items`                      | Signal that exposes the current breadcrumb collection.                                         |
| `extend(params, destroyRef)` | Temporarily adds or patches breadcrumbs that fall back when the owning component is destroyed. |
| `getBack(breadcrumbs)`       | Helper that returns the breadcrumb to use for "Back" navigation.                               |

For a more detailed reference, see the [library README](projects/ngx-route-breadcrumbs/README.md#api-reference).

## Project Structure

```
ngx-route-breadcrumbs/
├── projects/
│   └── ngx-route-breadcrumbs/        # Library source code
│       └── src/
│           └── lib/
│               ├── helpers/       # Helpers and type guards
│               ├── models/        # TypeScript models
│               ├── services/      # RouteBreadcrumbs service
│               └── types/         # TypeScript types
├── dist/                          # Build artifacts
└── package.json
```

## Development

### Requirements

- Node.js 24+
- npm 11+
- Angular CLI 20.3+

### Install Dependencies

```bash
npm install
```

### Build the Library

```bash
npm run build
```

Or build in watch mode:

```bash
npm run watch
```

### Testing

```bash
npm run test
```

### Linting

Run lint checks:

```bash
npm run lint
```

Auto-fix issues:

```bash
npm run lint:fix
```

### Formatting

Check formatting:

```bash
npm run format:check
```

Auto-format the code:

```bash
npm run format
```

## Library Usage

For detailed usage guidelines, see the
[library README](projects/ngx-route-breadcrumbs/README.md).

## Tech Stack

- **Angular** 20+
- **TypeScript** 5.9+
- **RxJS** 7.8+

## License

This project is distributed under the [MIT](LICENSE) license.

## Authors

[@Alevettih](https://github.com/Alevettih)
