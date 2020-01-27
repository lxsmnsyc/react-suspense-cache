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

export type Key = string;
export type Age = number;

export interface AsyncSuccess<T> {
  readonly status: 'success';
  readonly value: T;
}

export interface AsyncFailure {
  readonly status: 'failure';
  readonly value: any;
}

export interface AsyncPending {
  readonly status: 'pending';
}

export type AsyncState<T> = AsyncSuccess<T> | AsyncFailure | AsyncPending;

export type KeySupplier<Args extends any[]> = (...args: Args) => Key;
export type DataFetcher<Args extends any[], R> = (...args: Args) => Promise<R>;

export interface CachedData<T> {
  readonly data: AsyncState<T>;
  readonly timestamp: number;
}

export interface DataStorage {
  get: <R>(key: Key) => R | undefined;
  set: <R>(key: Key, value: R) => void;
  has: (key: Key) => boolean;
  remove: (key: Key) => void;
}

export interface Config {
  readonly storage: DataStorage;
  readonly age: Age;
}

export interface Resource<Args extends any[], T> {
  readonly get: (...args: Args) => T | undefined;
  readonly set: (value: T, ...args: Args) => void;
  readonly refetch: (...args: Args) => void;
  readonly revalidate: (...args: Args) => void;
}
