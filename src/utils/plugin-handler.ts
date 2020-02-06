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
import {
  ResponseData,
  StorageRequest,
  ResourcePlugin,
  Optional,
  StorageAccess,
  RequestWillFetchParam,
  FetchDidSucceedParam,
  FetchDidFailParam,
  ResourceHandlerParam,
  CachedResponseWillBeUsedParam,
  CacheKeyWillBeUsedParam,
  CacheWillUpdateParam,
  CacheDidUpdateParam,
} from '../types';
import { reduce, forEach } from './async';
import STRATEGY_CACHE from './strategy-cache';


/** @hidden */
async function requestWillFetch<T>(
  params: RequestWillFetchParam<T>,
  plugins: ResourcePlugin<T>[],
): Promise<StorageRequest> {
  return reduce(plugins, async (acc, current) => {
    if (current.requestWillFetch) {
      return current.requestWillFetch({
        ...params,
        request: acc,
      });
    }
    return acc;
  }, params.request);
}

/** @hidden */
async function fetchDidSucceed<T>(
  params: FetchDidSucceedParam<T>,
  plugins: ResourcePlugin<T>[],
): Promise<ResponseData<T>> {
  return reduce(plugins, async (acc, current) => {
    if (current.fetchDidSucceed) {
      return current.fetchDidSucceed({
        ...params,
        response: acc,
      });
    }
    return acc;
  }, params.response);
}

/** @hidden */
async function fetchDidFail<T>(
  params: FetchDidFailParam<T>,
  plugins: ResourcePlugin<T>[],
): Promise<void> {
  await forEach(plugins, async (value) => {
    if (value.fetchDidFail) {
      await value.fetchDidFail(params);
    }
    return true;
  });
}

/**
 * Fetches data from the fetcher (provided by the params).
 *
 * Calls `requestWillFetch`, `fetchDidSucceed` and `fetchDidFail` stages.
 *
 * @param param original parameter received from the [[ResourceHandler]]
 * @param plugins Array of [[ResourcePlugin]]
 */
export async function fetchData<T>(
  param: ResourceHandlerParam<T>,
  plugins: ResourcePlugin<T>[],
): Promise<ResponseData<T>> {
  const newRequest = await requestWillFetch<T>(param, plugins);

  try {
    const initialResponse: ResponseData<T> = await param.fetcher(...param.request).then(
      (value) => ({
        value,
        status: 'success',
      }),
      (value) => ({
        value,
        status: 'failure',
      }),
    );

    const processedResponse = await fetchDidSucceed({
      ...param,
      request: newRequest,
      response: initialResponse,
    }, plugins);

    return processedResponse;
  } catch (err) {
    await fetchDidFail({
      ...param,
      oldRequest: param.request,
      newRequest,
      error: err,
    }, plugins);

    throw err;
  }
}

/** @hidden */
async function cacheKeyWillBeUsed<T>(
  param: CacheKeyWillBeUsedParam<T>,
  plugins: ResourcePlugin<T>[],
): Promise<StorageRequest> {
  return reduce(plugins, async (acc, current) => {
    if (current.cacheKeyWillBeUsed) {
      return current.cacheKeyWillBeUsed({
        ...param,
        request: acc,
      });
    }
    return acc;
  }, param.request);
}

/** @hidden */
async function cachedResponseWillBeUsed<T>(
  param: CachedResponseWillBeUsedParam<T>,
  plugins: ResourcePlugin<T>[],
): Promise<Optional<ResponseData<T>>> {
  return reduce(plugins, async (acc, current) => {
    if (current.cachedResponseWillBeUsed) {
      return current.cachedResponseWillBeUsed({
        ...param,
        cachedResponse: acc,
      });
    }
    return Promise.resolve(acc);
  }, param.cachedResponse);
}

/** @hidden */
async function cacheWillUpdate<T>(
  param: CacheWillUpdateParam<T>,
  plugins: ResourcePlugin<T>[],
): Promise<Optional<ResponseData<T>>> {
  let newResponse: Optional<ResponseData<T>> = param.response;

  await forEach(plugins, async (value) => {
    if (value.cacheWillUpdate && newResponse) {
      newResponse = await value.cacheWillUpdate({
        ...param,
        response: newResponse,
      });
    }
    return !!newResponse;
  });

  if (newResponse && newResponse.status === 'failure') {
    return undefined;
  }

  return newResponse;
}

/**
 * Reads data from the cache.
 *
 * Calls `cacheKeyWillBeUsed` and `cachedResponseWillBeUsed` stages.
 *
 * @param param original parameter received from the [[ResourceHandler]]
 * @param plugins Array of [[ResourcePlugin]]
 */
export async function matchData<T>(
  param: ResourceHandlerParam<T>,
  plugins: ResourcePlugin<T>[],
): Promise<Optional<ResponseData<T>>> {
  const newRequest = await cacheKeyWillBeUsed({
    ...param,
    access: StorageAccess.Read,
  }, plugins);
  const key = param.keyFactory(newRequest);
  return cachedResponseWillBeUsed({
    ...param,
    request: newRequest,
    cachedResponse: STRATEGY_CACHE.get(param.cacheName, key),
  }, plugins);
}

/** @hidden */
async function cacheDidUpdate<T>(
  param: CacheDidUpdateParam<T>,
  plugins: ResourcePlugin<T>[],
): Promise<void> {
  await forEach(plugins, async (value) => {
    if (value.cacheDidUpdate) {
      await value.cacheDidUpdate(param);
    }
    return true;
  });
}

/**
 * Writes the data to the cache
 *
 * Calls `cacheKeyWillBeUsed`, `cacheWillUpdate` and `cacheDidUpdate` stages.
 * Also calls the [[matchData]] stages.
 *
 * @param param original parameter received from the [[ResourceHandler]]
 * @param plugins Array of [[ResourcePlugin]]
 */
export async function cacheData<T>(
  param: ResourceHandlerParam<T>,
  response: ResponseData<T>,
  plugins: ResourcePlugin<T>[],
): Promise<void> {
  const newRequest = await cacheKeyWillBeUsed({
    ...param,
    access: StorageAccess.Write,
  }, plugins);
  const cachedResponse = await cacheWillUpdate({
    ...param,
    response,
    request: newRequest,
  }, plugins);

  if (!cachedResponse) {
    return;
  }

  const key = param.keyFactory(newRequest);

  const oldResponse = await matchData({
    ...param,
    request: newRequest,
  }, plugins);

  STRATEGY_CACHE.set(param.cacheName, key, cachedResponse);

  await cacheDidUpdate({
    ...param,
    request: newRequest,
    oldResponse,
    newResponse: cachedResponse,
  }, plugins);
}
