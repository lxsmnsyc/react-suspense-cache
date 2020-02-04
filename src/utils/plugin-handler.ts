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
  StorageResponse,
  StorageRequest,
  ResourcePlugin,
  Fetcher,
  Optional,
  StorageAccess,
  KeyFactory,
  Key,
} from '../types';
import { reduce, forEach } from './async';
import STRATEGY_CACHE from './strategy-cache';

async function requestWillFetch<T>(
  request: StorageRequest,
  plugins: ResourcePlugin<T>[],
): Promise<StorageRequest> {
  return reduce(plugins, async (acc, current) => {
    if (current.requestWillFetch) {
      return current.requestWillFetch(acc);
    }
    return acc;
  }, request);
}

async function fetchDidSucceed<T>(
  request: StorageRequest,
  response: StorageResponse<T>,
  plugins: ResourcePlugin<T>[],
): Promise<StorageResponse<T>> {
  return reduce(plugins, async (acc, current) => {
    if (current.fetchDidSucceed) {
      return current.fetchDidSucceed(request, acc);
    }
    return acc;
  }, response);
}

async function fetchDidFail<T>(
  oldRequest: StorageRequest,
  newRequest: StorageRequest,
  error: any,
  plugins: ResourcePlugin<T>[],
): Promise<void> {
  await forEach(plugins, async (value) => {
    if (value.fetchDidFail) {
      await value.fetchDidFail(oldRequest, newRequest, error);
    }
    return true;
  });
}

export async function fetchData<T>(
  fetcher: Fetcher<T>,
  request: StorageRequest,
  plugins: ResourcePlugin<T>[],
): Promise<StorageResponse<T>> {
  const newRequest = await requestWillFetch<T>(request, plugins);

  try {
    const initialResponse: StorageResponse<T> = await fetcher(...request).then(
      (value) => ({
        value,
        status: 'success',
      }),
      (value) => ({
        value,
        status: 'failure',
      }),
    );

    const processedResponse = await fetchDidSucceed(newRequest, initialResponse, plugins);

    return processedResponse;
  } catch (err) {
    await fetchDidFail(request, newRequest, err, plugins);

    throw err;
  }
}

async function cacheKeyWillBeUsed<T>(
  request: StorageRequest,
  access: StorageAccess,
  plugins: ResourcePlugin<T>[],
): Promise<StorageRequest> {
  return reduce(plugins, async (acc, current) => {
    if (current.cacheKeyWillBeUsed) {
      return current.cacheKeyWillBeUsed(acc, access);
    }
    return acc;
  }, request);
}

async function cachedResponseWillBeUsed<T>(
  cacheName: string,
  key: Key,
  request: StorageRequest,
  response: Optional<StorageResponse<T>>,
  plugins: ResourcePlugin<T>[],
): Promise<Optional<StorageResponse<T>>> {
  return reduce(plugins, async (acc, current) => {
    if (current.cachedResponseWillBeUsed) {
      return current.cachedResponseWillBeUsed(cacheName, key, request, acc);
    }
    return Promise.resolve(acc);
  }, response);
}

async function cacheWillUpdate<T>(
  request: StorageRequest,
  response: StorageResponse<T>,
  plugins: ResourcePlugin<T>[],
): Promise<Optional<StorageResponse<T>>> {
  let newResponse: Optional<StorageResponse<T>> = response;

  await forEach(plugins, async (value) => {
    if (value.cacheWillUpdate && newResponse) {
      newResponse = await value.cacheWillUpdate(request, newResponse);
    }
    return !!newResponse;
  });

  if (newResponse && newResponse.status === 'failure') {
    return undefined;
  }

  return newResponse;
}

export async function matchData<T>(
  cacheName: string,
  keyFactory: KeyFactory,
  request: StorageRequest,
  plugins: ResourcePlugin<T>[],
): Promise<Optional<StorageResponse<T>>> {
  const newRequest = await cacheKeyWillBeUsed(request, StorageAccess.Read, plugins);
  const key = keyFactory(newRequest);
  return cachedResponseWillBeUsed(
    cacheName, key, request, STRATEGY_CACHE.get(cacheName, key), plugins,
  );
}

async function cacheDidUpdate<T>(
  cacheName: string,
  key: Key,
  request: StorageRequest,
  oldResponse: Optional<StorageResponse<T>>,
  newResponse: StorageResponse<T>,
  plugins: ResourcePlugin<T>[],
): Promise<void> {
  await forEach(plugins, async (value) => {
    if (value.cacheDidUpdate) {
      await value.cacheDidUpdate(cacheName, key, request, oldResponse, newResponse);
    }
    return true;
  });
}

export async function cacheData<T>(
  cacheName: string,
  keyFactory: KeyFactory,
  request: StorageRequest,
  response: StorageResponse<T>,
  plugins: ResourcePlugin<T>[],
): Promise<void> {
  const newRequest = await cacheKeyWillBeUsed(request, StorageAccess.Write, plugins);
  const cachedResponse = await cacheWillUpdate(request, response, plugins);

  if (!cachedResponse) {
    return;
  }

  const key = keyFactory(newRequest);

  const oldResponse = await matchData(cacheName, keyFactory, request, plugins);

  STRATEGY_CACHE.set(cacheName, key, cachedResponse);

  await cacheDidUpdate(cacheName, key, request, oldResponse, cachedResponse, plugins);
}
