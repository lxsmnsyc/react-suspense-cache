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
  ResourceHandler, ResponseData,
  ResourcePlugin, HandlerConfig,
  Optional, ResourceHandlerParam,
} from '../types';
import { fetchData, matchData, cacheData } from '../utils/plugin-handler';
import SuccessOnlyPlugin from '../plugins/success-only-plugin';
import NoResponseError from '../errors/no-response';

/** @hidden */
interface TimeoutRef {
  current?: number;
}

/** @hidden */
interface TimeoutControl<T> {
  promise: Promise<Optional<ResponseData<T>>>;
  id: TimeoutRef;
}

/** @hidden */
function timeoutPromise<T>(
  timeout: number,
  param: ResourceHandlerParam<T>,
  plugins: ResourcePlugin<T>[],
): TimeoutControl<T> {
  const id: TimeoutRef = {};

  const promise = new Promise<Optional<ResponseData<T>>>((resolve) => {
    id.current = window.setTimeout(() => {
      matchData<T>(param, plugins).then((value) => {
        resolve(value);
      });
    }, timeout);
  });

  return { id, promise };
}

/** @hidden */
async function fetcherPromise<T>(
  id: number | undefined,
  param: ResourceHandlerParam<T>,
  plugins: ResourcePlugin<T>[],
): Promise<Optional<ResponseData<T>>> {
  let response;
  let error;

  try {
    response = await fetchData(param, plugins);
  } catch (err) {
    error = err;
  }

  if (id) {
    window.clearTimeout(id);
  }

  if (error) {
    response = await matchData(param, plugins);
  } else if (response) {
    cacheData(param, response, plugins);
  }

  return response;
}

export interface FetcherFirstConfig extends HandlerConfig {
  timeout?: number;
}

/**
 * Implements the "Network falling back to cache" strategy:
 * https://developers.google.com/web/fundamentals/instant-and-offline/offline-cookbook/#network-falling-back-to-cache
 *
 * Tries to fetch from the fetcher first with a given timeout (optional).
 * If the fetcher fails through errors or if it doesn't respond up until the
 * given timeout, the data is fetched from the cache.
 *
 * @category Strategies
 * @typeparam T type of the data to be cached.
 */
export default class FetcherFirst<T> implements ResourceHandler<T> {
  private plugins: ResourcePlugin<T>[];

  private timeout?: number;

  constructor({ timeout, plugins }: FetcherFirstConfig) {
    this.plugins = plugins.length === 0
      ? [new SuccessOnlyPlugin()]
      : plugins;
    this.timeout = timeout;
  }

  /** @ignore */
  public async handle(param: ResourceHandlerParam<T>): Promise<ResponseData<T>> {
    const promises = [];
    let timeoutId;

    if (this.timeout) {
      const { id, promise } = timeoutPromise(
        this.timeout,
        param,
        this.plugins,
      );

      timeoutId = id.current;

      promises.push(promise);
    }

    const fetched = fetcherPromise(timeoutId, param, this.plugins);

    promises.push(fetched);

    const response = await Promise.race(promises);

    if (!response) {
      throw new NoResponseError(param.cacheName, param.request);
    }

    return response;
  }
}
