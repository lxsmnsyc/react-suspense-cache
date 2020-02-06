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

/** @hidden */
export type Optional<T> = T | null | undefined;

/**
 * An array of values to be received by the [[KeyFactory]]
 * and the data fetcher.
 */
export type StorageRequest = any[];

/**
 * The type of the value to be returned by the [[KeyFactory]].
 *
 * This key is used to indicate the cache slot for both
 * the resource and the global cache.
 */
export type Key = string;

/**
 * A function that receives [[Storagerequest]] and returns a [[Key]].
 */
export type KeyFactory = (...args: StorageRequest) => Key;

/**
 * A asynchronous function that receives [[StorageRequest]] and
 * resolves to a data
 *
 * @typeparam T type of the data to be resolved.
 */
export type Fetcher<T> = (...args: StorageRequest) => Promise<T>;

/**
 * Access modes for the cache.
 */
export enum StorageAccess {
  Read,
  Write,
}

/**
 * Cache response storing the fetcher failure reason.
 */
export interface ResponseFailure {
  status: 'failure';
  value: any;
}

/**
 * Cache response storing the fetcher's resolved value
 *
 * @typeparam T type of the resolved value.
 */
export interface ResponseSuccess<T> {
  status: 'success';
  value: T;
}

/**
 * Cache response types
 * @typeparam T type of the resolved value.
 */
export type ResponseData<T> = ResponseFailure | ResponseSuccess<T>;

/** @hidden */
export interface ResourceCache<T> {
  instance?: Promise<T>;
  data?: ResponseData<T>;
}

/**
 * Values to be received by the [[ResourceHandler]].
 *
 * @typeparam T type of the data that is being passed from the [[Resource]]
 * to the global cache.
 */
export interface ResourceHandlerParam<T> {
  /**
   * Name of the cache for the resource
   */
  cacheName: string;
  /**
   * Procudes key for the cache
   */
  keyFactory: KeyFactory;
  /**
   * Fetches data
   */
  fetcher: Fetcher<T>;
  /**
   * The set of requests received from reading.
   */
  request: StorageRequest;
}

/**
 * Provides the resource-to-cache strategy for the [[Resource]].
 *
 * @typeparam T type of the data that is being passed from the [[Resource]]
 * to the global cache.
 */
export interface ResourceHandler<T> {
  /**
   * Handles the resource-to-cache logic.
   */
  handle: (param: ResourceHandlerParam<T>) => Promise<ResponseData<T>>;
}

/**
 * An object to be received by the [[ResourcePlugin]]'s "cacheWillUpdate" property.
 *
 * @typeparam T type of the cache data
 */
export interface CacheWillUpdateParam<T> extends ResourceHandlerParam<T> {
  /**
   * The original [[ResponseData]] received from the [[ResourceHandler]]
   */
  response: ResponseData<T>;
}

/**
 * An object to be received by the [[ResourcePlugin]]'s "cacheDidUpdate" property.
 *
 * @typeparam T type of the cache data
 */
export interface CacheDidUpdateParam<T> extends ResourceHandlerParam<T> {
  /**
   * The original [[ResponseData]] received from the [[ResourceHandler]]
   */
  oldResponse: Optional<ResponseData<T>>;
  /**
   * The new [[ResponseData]] processed by the [[cacheWillUpdate]]
   */
  newResponse: ResponseData<T>;
}

/**
 * An object to be received by the [[ResourcePlugin]]'s "cacheKeyWillBeUsed" property.
 *
 * @typeparam T type of the cache data
 */
export interface CacheKeyWillBeUsedParam<T> extends ResourceHandlerParam<T> {
  /**
   * Access modes
   */
  access: StorageAccess;
}

/**
 * An object to be received by the [[ResourcePlugin]]'s "cachedResponseWillBeUsed" property.
 *
 * @typeparam T type of the cache data
 */
export interface CachedResponseWillBeUsedParam<T> extends ResourceHandlerParam<T> {
  /**
   * The [[StorageRequest]] processed by [[cacheKeyWillBeUsed]].
   */
  request: StorageRequest;
  /**
   * The cached [[ResponseData]] from the global cache.
   */
  cachedResponse: Optional<ResponseData<T>>;
}

/**
 * An object to be received by the [[ResourcePlugin]]'s "requestWillFetch" property.
 *
 * @typeparam T type of the cache data
 */
export type RequestWillFetchParam<T> = ResourceHandlerParam<T>;

/**
 * An object to be received by the [[ResourcePlugin]]'s "fetchDidFail" property.
 *
 * @typeparam T type of the cache data
 */
export interface FetchDidFailParam<T> extends ResourceHandlerParam<T> {
  /**
   * Original request received by the [[ResourceHandler]].
   */
  oldRequest: StorageRequest;
  /**
   * Request processed by the [[requestWillFetch]].
   */
  newRequest: StorageRequest;
  /**
   * Reason of failure
   */
  error: any;
}

/**
 * An object to be received by the [[ResourcePlugin]]'s "fetchDidSucceed" property.
 *
 * @typeparam T type of the cache data
 */
export interface FetchDidSucceedParam<T> extends ResourceHandlerParam<T> {
  /**
   * Request processed by the [[requestWillFetch]].
   */
  request: StorageRequest;
  /**
   * Result of the [[Fetcher]]
   */
  response: ResponseData<T>;
}

/**
 * Plugins are an extension to Strategies that allows to process
 * cached data or fetch responses.
 *
 * @typeparam T type of the cached and fetched data.
 */
export interface ResourcePlugin<T> {
  /**
   * Called during the cache writing stage.
   *
   * Receives the [[ResponseData]] to be cached and
   * allows to process and output a new
   * [[ResponseData]] to be cached, or null to
   * prevent caching.
   *
   * Also receives the newly processed [[StorageRequest]]
   * from [[cacheKeyWillBeUsed]].
   */
  cacheWillUpdate?: (
    param: CacheWillUpdateParam<T>,
  ) => Promise<Optional<ResponseData<T>>>;
  /**
   * Called during the cache writing stage.
   *
   * Receives the old [[ResponseData]] (passed from the [[ResourceHandler]]),
   * the new [[ResponseData]] (processed by the [[cacheWillUpdate]]),
   * and the [[StorageRequest]] (processed by the [[cacheKeyWillBeUsed]])
   */
  cacheDidUpdate?: (
    param: CacheDidUpdateParam<T>,
  ) => Promise<void>;
  /**
   * Called during the cache fetching and cache writing stage.
   *
   * Receives the request from the [[ResourceHandler]]
   * and allows to process and output a new [[StorageRequest]].
   */
  cacheKeyWillBeUsed?: (
    param: CacheKeyWillBeUsedParam<T>,
  ) => Promise<StorageRequest>;
  /**
   * Called during the cache fetching stage.
   *
   * Receives the processed [[StorageRequest]] from the [[cacheKeyWillBeUsed]]
   * and allows to process and return a new [[ResponseData]]
   */
  cachedResponseWillBeUsed?: (
    param: CachedResponseWillBeUsedParam<T>,
  ) => Promise<Optional<ResponseData<T>>>;
  /**
   * Called during the data fetching stage.
   *
   * Receives the parameters from the [[ResourceHandler]] and allows
   * to process and output a new [[StorageRequest]].
   */
  requestWillFetch?: (
    param: RequestWillFetchParam<T>,
  ) => Promise<StorageRequest>;
  /**
   * Called during the data fetching stage.
   *
   * Receives the original request from the [[ResourceHandler]] and
   * the processed request from the [[requestWillFetch]] and the error
   * received from the fetcher failure.
   */
  fetchDidFail?: (
    param: FetchDidFailParam<T>,
  ) => Promise<void>;
  /**
   * Called during the data fetching stage.
   *
   * Receives the original request from the [[ResourceHandler]] and
   * the success response from the succeeding fetcher.
   */
  fetchDidSucceed?: (
    param: FetchDidSucceedParam<T>,
  ) => Promise<ResponseData<T>>;
}

/**
 * Config interface for the [[ResourceHandler]]
 */
export interface HandlerConfig {
  /**
   * An array of [[ResourcePlugin]] used by the [[ResourceHandler]]
   * for additional data handling.
   */
  plugins: ResourcePlugin<any>[];
}

/**
 * Config interface for the [[Resource]]
 */
export interface Config<T> {
  /**
   * Procudes key for the cache
   */
  keyFactory: KeyFactory;
  /**
   * Fetches data
   */
  fetcher: Fetcher<T>;
  /**
   * Name of the cache for the resource
   */
  cacheName?: string;
  /**
   * Strategy for the resource-to-cache handling.
   */
  strategy?: ResourceHandler<T>;
  /**
   * If true, revalidates all components that reads
   * from the resource whenever the page becomes
   * visible.
   */
  revalidateOnVisibility?: boolean;
  /**
   * If true, re-renders all components that reads
   * from the resource whenever the page becomes
   * visible.
   */
  updateOnVisibility?: boolean;
}

/**
 * An interface for data-fetching resources to be used
 * for Suspense-wrapped components.
 */
export interface Resource<T, Params extends StorageRequest> {
  /**
   * Declarative resource reading. Used by the data-fetching
   * components.
   *
   * if the [[Config]]'s `revalidateOnVisibility` is set to true,
   * it causes all of the components with shared requests to opt
   * to fallback for the resource revalidation when the page
   * gets visible again.
   *
   * if the [[Config]]'s `updateOnVisibility` is set to true,
   * it causes all of the components to re-render again.
   */
  read: (...params: Params) => T | undefined;

  /**
   * Mutates the cache value from both the resource cache and
   * the global cache.
   */
  mutate: (value: T, ...params: Params) => void;

  /**
   * Triggers a cache revalidation for the resource.
   */
  trigger: (...params: Params) => void;
}
