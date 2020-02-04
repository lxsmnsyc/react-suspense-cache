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
  StorageResponse, Key, ResourcePlugin, StorageRequest, Optional,
} from '../types';
import { defer } from '../utils/async';

const GLOBAL_CACHE = new Map<string, Map<string, number>>();

const EXPIRATION_CACHE = {
  has(cacheName: string, key: Key): boolean {
    if (GLOBAL_CACHE.has(cacheName)) {
      const cache = GLOBAL_CACHE.get(cacheName);

      return !!cache && cache.has(key);
    }

    return false;
  },
  get(cacheName: string, key: Key): number | undefined {
    if (GLOBAL_CACHE.has(cacheName)) {
      const cache = GLOBAL_CACHE.get(cacheName);

      return cache && cache.get(key);
    }

    return undefined;
  },
  set(cacheName: string, key: Key, value: number): void {
    let cache;
    if (GLOBAL_CACHE.has(cacheName)) {
      cache = GLOBAL_CACHE.get(cacheName);
    }

    if (!cache) {
      cache = new Map<string, number>();
      GLOBAL_CACHE.set(cacheName, cache);
    }

    cache.set(key, value);
  },
};

export default class ExpirationPlugin implements ResourcePlugin<any> {
  private maxAgeSeconds?: number;

  constructor(maxAgeSeconds?: number) {
    this.maxAgeSeconds = maxAgeSeconds;
  }

  public async cachedResponseWillBeUsed(
    cacheName: string,
    key: Key,
    _: StorageRequest,
    cachedResponse: Optional<StorageResponse<any>>,
  ): Promise<Optional<StorageResponse<any>>> {
    await defer();
    if (!cachedResponse) {
      return null;
    }

    if (!this.maxAgeSeconds) {
      return cachedResponse;
    }

    if (EXPIRATION_CACHE.has(cacheName, key)) {
      const value = EXPIRATION_CACHE.get(cacheName, key);

      if (value && value >= Date.now() - (this.maxAgeSeconds * 1000)) {
        return cachedResponse;
      }
    }

    return null;
  }

  public async cacheDidUpdate(
    cacheName: string,
    key: Key,
  ): Promise<void> {
    await defer();

    EXPIRATION_CACHE.set(cacheName, key, Date.now());
  }
}
