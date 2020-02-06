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
  ResponseData, Key, ResourcePlugin, Optional,
  CachedResponseWillBeUsedParam, CacheDidUpdateParam,
} from '../types';
import { defer } from '../utils/async';

/** @hidden */
const CACHE = new Map<string, Map<string, number>>();

/** @hidden */
const EXPIRATION_CACHE = {
  has(cacheName: string, key: Key): boolean {
    if (CACHE.has(cacheName)) {
      const cache = CACHE.get(cacheName);

      return !!cache && cache.has(key);
    }

    return false;
  },
  get(cacheName: string, key: Key): number | undefined {
    if (CACHE.has(cacheName)) {
      const cache = CACHE.get(cacheName);

      return cache && cache.get(key);
    }

    return undefined;
  },
  set(cacheName: string, key: Key, value: number): void {
    let cache;
    if (CACHE.has(cacheName)) {
      cache = CACHE.get(cacheName);
    }

    if (!cache) {
      cache = new Map<string, number>();
      CACHE.set(cacheName, cache);
    }

    cache.set(key, value);
  },
};

/**
 * Marks a cache with timestamp expiration logic.
 *
 * Once the cache expires, this forces the receiving strategy
 * to refetch (if provided by the strategy logic) or respond
 * with no data.
 *
 * @category Plugins
 */
export default class ExpirationPlugin implements ResourcePlugin<any> {
  private maxAgeSeconds?: number;

  constructor(maxAgeSeconds?: number) {
    this.maxAgeSeconds = maxAgeSeconds;
  }

  public async cachedResponseWillBeUsed(
    param: CachedResponseWillBeUsedParam<any>,
  ): Promise<Optional<ResponseData<any>>> {
    await defer();
    if (!param.cachedResponse) {
      return null;
    }

    if (!this.maxAgeSeconds) {
      return param.cachedResponse;
    }

    const key = param.keyFactory(param.request);

    if (EXPIRATION_CACHE.has(param.cacheName, key)) {
      const value = EXPIRATION_CACHE.get(param.cacheName, key);

      if (value && value >= Date.now() - (this.maxAgeSeconds * 1000)) {
        return param.cachedResponse;
      }
    }

    return null;
  }

  public async cacheDidUpdate(param: CacheDidUpdateParam<any>): Promise<void> {
    await defer();

    EXPIRATION_CACHE.set(param.cacheName, param.keyFactory(param.request), Date.now());
  }
}
