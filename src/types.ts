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
export type Optional<T> = T | null | undefined;

export type StorageRequest = any[];

export type Key = string;

export type Age = number;

export type KeyFactory = (...args: StorageRequest) => Key;

export type Fetcher<T> = (...args: StorageRequest) => Promise<T>;


export enum StorageAccess {
  Read,
  Write,
}
export interface ResponseFailure {
  status: 'failure';
  value: any;
}

export interface ResponseSuccess<T> {
  status: 'success';
  value: T;
}


export type ResponseData<T> = ResponseFailure | ResponseSuccess<T>;

export interface ResourceCache<T> {
  instance?: Promise<T>;
  data?: ResponseData<T>;
}

export type StorageResponse<T> = ResponseData<T>;

export interface ResourceHandler<T> {
  handle: (
    cacheName: string,
    keyFactory: KeyFactory,
    fetcher: Fetcher<T>,
    request: StorageRequest,
  ) => Promise<StorageResponse<T>>;
}

export interface ResourcePlugin<T> {
  cacheWillUpdate?: (
    request: StorageRequest,
    response: StorageResponse<T>,
  ) => Promise<Optional<StorageResponse<T>>>;
  cacheDidUpdate?: (
    cacheName: string,
    key: Key,
    request: StorageRequest,
    oldResponse: Optional<StorageResponse<T>>,
    newResponse: StorageResponse<T>,
  ) => Promise<void>;
  cacheKeyWillBeUsed?: (
    request: StorageRequest,
    access: StorageAccess,
  ) => Promise<StorageRequest>;
  cachedResponseWillBeUsed?: (
    cacheName: string,
    key: Key,
    request: StorageRequest,
    cachedResponse: Optional<StorageResponse<T>>,
  ) => Promise<Optional<StorageResponse<T>>>;
  requestWillFetch?: (
    request: StorageRequest,
  ) => Promise<StorageRequest>;
  fetchDidFail?: (
    oldRequest: StorageRequest,
    newRequest: StorageRequest,
    error: any,
  ) => Promise<void>;
  fetchDidSucceed?: (
    request: StorageRequest,
    response: StorageResponse<T>,
  ) => Promise<StorageResponse<T>>;
}

export interface HandlerConfig {
  plugins: ResourcePlugin<any>[];
}

export interface Config<T> {
  keyFactory: KeyFactory;
  fetcher: Fetcher<T>;
  cacheName?: string;
  strategy?: ResourceHandler<T>;
  revalidateOnVisibility?: boolean;
  updateOnVisibility?: boolean;
}

export interface Resource<T, Params extends StorageRequest> {
  read: (...params: Params) => T | undefined;
  mutate: (value: T, ...params: Params) => void;
  trigger: (...params: Params) => void;
}
