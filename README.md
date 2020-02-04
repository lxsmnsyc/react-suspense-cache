# react-suspense-cache
React library for creating Suspense-ful cached resources

## Features

* Reactive - Data-fetching components that reads from resources can automatically re-render to update from the resource's data. This is useful if the data being served has been updated in the background.
* Caching Strategies - Inspired by the [Offline Cookbook](https://developers.google.com/web/fundamentals/instant-and-offline/offline-cookbook/) and Google's Workbox, `react-suspense-cache` implements the caching strategies for the Suspense resources. 7 caching strategies are already built-out-of-the-box.
* Plugins - Caching strategies can receive plugins that allows additional business logic on how the data is being handled internally. An example is imposing an expiration policy through the built-in `ExpirationPlugin`.

## Install

```bash
yarn add @lxsmnsyc/react-suspense-cache
```

## Usage

To create a resource, you must import and call the function `createResource` which receives a config object:

```js
import { createResource } from '@lxsmnsyc/react-suspense-cache';

const myResource = createResource({ ... });
```

The resource created has three functions:
* `read` - a function that can receive a parameter and return data. This function shall be called by the data-fetching components.
* `mutate` - receives a data and multiple values. Replaces the cached data with the given data. All data-fetching components of similarly received arguments (except the data) will be re-rendered.
* `trigger` - triggers a refetch for the specific resource and re-renders all data-fetching component of similar arguments.

The config object has the options:
* `keyFactory` - a function that receives the parameters received by the Resource's methods, and returns a string which is used as a key for caching.
* `fetcher` - a function that provides the data. Receives the same parameters.
* `cacheName` - optional. Used for the global cache as a way to separate it from the rest of the resources (assuming these resources have no cache names.).
* `strategy` - optional. Implements the resource-to-cache data policy. If no strategy is provided, the data is stored resource-level.
* `revalidateOnVisibility` - optional. Whenever the page becomes visible, all data-fetching components will perform a data revalidation. Defaults to false.
* `updateOnVisibility` - optional. Whenever the page becomes visible, all data-fetching components will re-render. Defaults to false.

### Example

Here's a simple resource that fetches data from the Dog API with the given `kind`. The resource employs the stale-while-revalidate strategy with an data expiration time of 10 seconds.

```js
const randomDog = createResource({
  /**
   * Generate key for the cache
   */
  keyFactory(kind) {
    return `https://dog.ceo/api/breed/${kind}/images/random`;
  },
  /**
   * Data provider
   */
  async fetcher(kind) {
    const response = await fetch(`https://dog.ceo/api/breed/${kind}/images/random`);
    const json = await response.json();
    return json.message;
  },
  /**
   * Use a stale-while-revalidate strategy with a data expiration
   * of 10 seconds.
   */
  strategy: new strategies.StaleWhileRevalidate({
    plugins: [
      new plugins.ExpirationPlugin(10),
    ],
  }),
  /**
   * Revalidate our components every time the page goes visible again.
   */
  revalidateOnVisibility: true,
});
```

## How does it work?

A traditional Suspense resource has a single source of data, whose data is kept at the entire runtime. That's one layer of data flow. This library has 4 layers of data flow:
- Global Cache: a runtime cache that stores every single data from every single resource.
- Strategy: Handles the resource-to-cache logic, this includes cache loading and data fetching.
- Resource: provides the data-fetching logic to the strategy, keeps the Promise instance for the Suspense components.
- Components: reads the data from the resource, and can reactively update when necessary.

## Similar libraries

- [Google Workbox](https://github.com/GoogleChrome/workbox)
- [SWR](https://github.com/zeit/swr) - React Hooks library for remote data fetching.
- [Hitchcock](https://github.com/pomber/hitchcock) - The Master of Suspense 🍿