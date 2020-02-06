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
  ResourcePlugin, HandlerConfig, ResourceHandlerParam,
} from '../types';
import { fetchData, matchData } from '../utils/plugin-handler';
import SuccessOnlyPlugin from '../plugins/success-only-plugin';

/**
 * Implements the "Cache, falling back to network" strategy:
 * https://developers.google.com/web/fundamentals/instant-and-offline/offline-cookbook/#cache-falling-back-to-network
 *
 * Responds with the cached data first and tries to fetch data,
 * thereafter caching the data and responds with the data if
 * the cached data fails.
 *
 * @category Strategies
 * @typeparam T type of the data to be cached.
 */
export default class CacheFirst<T> implements ResourceHandler<T> {
  private plugins: ResourcePlugin<T>[];

  constructor({ plugins }: HandlerConfig) {
    this.plugins = plugins.length === 0
      ? [new SuccessOnlyPlugin()]
      : plugins;
  }

  /** @ignore */
  public async handle(param: ResourceHandlerParam<T>): Promise<ResponseData<T>> {
    let response = await matchData(param, this.plugins);

    if (!response) {
      response = await fetchData(param, this.plugins);
    }

    return response;
  }
}
