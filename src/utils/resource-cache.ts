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
import { ResourceCache, Key } from '../types';

const GLOBAL_CACHE = new Map<string, Map<string, ResourceCache<any>>>();

const RESOURCE_CACHE = {
  has(cacheName: string, key: Key): boolean {
    if (GLOBAL_CACHE.has(cacheName)) {
      const cache = GLOBAL_CACHE.get(cacheName);

      return !!cache && cache.has(key);
    }

    return false;
  },
  get<T>(cacheName: string, key: Key): ResourceCache<T> | undefined {
    if (GLOBAL_CACHE.has(cacheName)) {
      const cache = GLOBAL_CACHE.get(cacheName);

      return cache && cache.get(key);
    }

    return undefined;
  },
  set<T>(cacheName: string, key: Key, value: ResourceCache<T>): void {
    let cache;
    if (GLOBAL_CACHE.has(cacheName)) {
      cache = GLOBAL_CACHE.get(cacheName);
    }

    if (!cache) {
      cache = new Map<string, ResourceCache<any>>();
      GLOBAL_CACHE.set(cacheName, cache);
    }

    cache.set(key, value);
  },
  delete(cacheName: string, key: Key): void {
    if (GLOBAL_CACHE.has(cacheName)) {
      const cache = GLOBAL_CACHE.get(cacheName);

      if (cache) {
        cache.delete(key);
      }
    }
  },
};

export default RESOURCE_CACHE;
