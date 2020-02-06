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
  ResourcePlugin, HandlerConfig, Optional, ResourceHandlerParam,
} from '../types';
import { fetchData, matchData } from '../utils/plugin-handler';
import SuccessOnlyPlugin from '../plugins/success-only-plugin';
import NoResponseError from '../errors/no-response';
import AllPromiseFailedError from '../errors/all-promise-failed';

/** @hidden */
function promiseAny<T>(
  promises: Promise<Optional<ResponseData<T>>>[],
): Promise<Optional<ResponseData<T>>> {
  return new Promise((resolve, reject) => {
    const mapped = promises.map((p) => Promise.resolve(p));

    const errors: Error[] = [];

    let errorCounter = mapped.length;

    mapped.forEach((p, index) => {
      p.then(
        resolve,
        (err) => {
          errors[index] = err;
          errorCounter -= 1;

          if (errorCounter === 0) {
            reject(new AllPromiseFailedError(errors));
          }
        },
      );
    });
  });
}

/**
 * Implements the "Cache & network race" strategy:
 * https://developers.google.com/web/fundamentals/instant-and-offline/offline-cookbook/#cache-and-network-race
 *
 * Tries to fetch from the cache and the fetcher at the same time,
 * resolving with the data of whichever fetching comes first.
 *
 * @category Strategies
 * @typeparam T type of the data to be cached.
 */
export default class CacheFetcherRace<T> implements ResourceHandler<T> {
  private plugins: ResourcePlugin<T>[];

  constructor({ plugins }: HandlerConfig) {
    this.plugins = plugins.length === 0
      ? [new SuccessOnlyPlugin()]
      : plugins;
  }

  /** @ignore */
  public async handle(param: ResourceHandlerParam<T>): Promise<ResponseData<T>> {
    const fetched = fetchData(param, this.plugins);

    const cached = matchData(param, this.plugins);

    const response = await promiseAny([
      fetched,
      cached,
    ]);

    if (!response) {
      throw new NoResponseError(param.cacheName, param.request);
    }

    return response;
  }
}
