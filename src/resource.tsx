/**
 * @license
 * MIT License
 *
 * Copyright (c) 2020 Alexis Munsayac
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *
 *
 * @author Alexis Munsayac <alexis.munsayac@gmail.com>
 * @copyright Alexis Munsayac 2020
 */
import {
  StorageRequest, Resource, Config, ResponseData, Key,
} from './types';
import Emitter from './utils/emitter';
import RESOURCE_CACHE from './utils/resource-cache';
import useVisibilityUpdate from './utils/hooks/useVisibilityUpdate';
import useVisibilityRevalidate from './utils/hooks/useVisibilityRevalidate';
import useAutoUpdate from './utils/hooks/useAutoUpdate';
import STRATEGY_CACHE from './utils/strategy-cache';

/**
 * Constructs a React resource for Suspense components.
 * @typeparam T the type of the data that flows in the resource.
 * @typeparam Params a unified type for the [[StorageRequest]]
 * @category Core
 */
export default function createResource<T, Params extends StorageRequest>(
  {
    keyFactory, fetcher, strategy, cacheName,
    revalidateOnVisibility, updateOnVisibility,
  }: Config<T>,
): Resource<T, Params> {
  const cache = cacheName ?? '';

  const triggerEmitter = new Emitter<Key>();

  /** @hidden */
  function startFetch(key: Key, request: Params): Promise<void> {
    let instance;
    /**
     * If strategy exists in config, use it.
     */
    if (strategy) {
      instance = strategy.handle({
        cacheName: cache,
        keyFactory,
        fetcher,
        request,
      });
    } else {
      /**
       * Default to fetcher
       */
      instance = fetcher(...request).then<ResponseData<T>, ResponseData<T>>(
        (value) => ({
          value,
          status: 'success',
        }),
        (value) => ({
          value,
          status: 'failure',
        }),
      );
    }

    /**
     * Update the resource cache when promise finishes.
     */
    instance = instance.then(
      (data) => RESOURCE_CACHE.set(cache, key, { data }),
      (data) => RESOURCE_CACHE.set(cache, key, { data }),
    );

    /**
     * Save the promise
     */
    RESOURCE_CACHE.set(cache, key, {
      instance,
    });

    return instance;
  }

  function trigger(...args: Params): void {
    /**
     * Generate key
     */
    const key = keyFactory(...args);

    /**
     * Re-fetch
     */
    startFetch(key, args);

    /**
     * Re-render all data-fetching components
     */
    triggerEmitter.emit(key);
  }

  function mutate(value: T, ...args: Params): void {
    /**
     * Generate key
     */
    const key = keyFactory(...args);

    /**
     * Set the value
     */
    if (strategy) {
      STRATEGY_CACHE.set(cache, key, {
        status: 'success',
        value,
      });

      /**
       * Re-fetch
       */
      startFetch(key, args);
    } else {
      RESOURCE_CACHE.set(cache, key, {
        data: {
          status: 'success',
          value,
        },
      });
    }
    /**
     * Re-render all data-fetching components
     */
    triggerEmitter.emit(key);
  }

  function useResource(...args: Params): T | undefined {
    /**
     * Generate key
     */
    const key = keyFactory(...args);

    /**
     * Call our hooks
     */
    useAutoUpdate(triggerEmitter, key);
    useVisibilityUpdate(!!updateOnVisibility);
    useVisibilityRevalidate<Params>(!!revalidateOnVisibility, trigger, args);

    /**
     * Get resource
     */
    const resource = RESOURCE_CACHE.get<T>(cache, key);

    /**
     * Check if resource is pending
     */
    if (resource) {
      /**
       * Extract fields
       */
      const { instance, data } = resource;
      /**
       * Check if data has been resolved
       */
      if (!data) {
        /**
         * Throw promise for the suspense
         */
        throw instance;
      } else {
        switch (data.status) {
          case 'failure': throw data.value;
          case 'success': return data.value;
          default:
        }
      }
    } else {
      /**
       * Throw the promise
       */
      throw startFetch(key, args);
    }
    return undefined;
  }

  return {
    read: useResource,
    trigger,
    mutate,
  };
}
