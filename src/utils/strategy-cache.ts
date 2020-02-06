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
 * @hidden
 */
import { ResponseData, Key } from '../types';

const CACHE = new Map<string, Map<string, ResponseData<any>>>();

const STRATEGY_CACHE = {
  /**
   * Checks if the GlobalCache has the given key of cache occupied
   * @param cacheName the name of the cache to access to
   * @param key key of the data to check for
   */
  has(cacheName: string, key: Key): boolean {
    if (CACHE.has(cacheName)) {
      const cache = CACHE.get(cacheName);

      return !!cache && cache.has(key);
    }

    return false;
  },
  /**
   * Gets the cached data from the given cache and key
   * @param cacheName the name of the cache to access to
   * @param key key of the data to check for
   * @typeparam T the type of the cached value
   */
  get<T>(cacheName: string, key: Key): ResponseData<T> | undefined {
    if (CACHE.has(cacheName)) {
      const cache = CACHE.get(cacheName);

      return cache && cache.get(key);
    }

    return undefined;
  },
  /**
   * Sets the data to be cached for the given cache and key
   * @param cacheName the name of the cache to access to
   * @param key key of the data to check for
   * @param value value to be cached
   * @typeparam T the type of the value to be cached with.
   */
  set<T>(cacheName: string, key: Key, value: ResponseData<T>): void {
    let cache;
    if (CACHE.has(cacheName)) {
      cache = CACHE.get(cacheName);
    }

    if (!cache) {
      cache = new Map<string, ResponseData<any>>();
      CACHE.set(cacheName, cache);
    }

    cache.set(key, value);
  },
};

export default STRATEGY_CACHE;
