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
import { DataStorage, Key } from './types';

const MAP = new Map<string, any>();

const RUNTIME_CACHE: DataStorage = {
  get<R>(key: Key): R | undefined {
    return MAP.get(key);
  },

  set<R>(key: Key, value: R): void {
    MAP.set(key, value);
  },

  has(key: Key): boolean {
    return MAP.has(key);
  },

  remove(key: Key): void {
    MAP.delete(key);
  },
};

const LOCAL_CACHE: DataStorage = {
  get<R>(key: Key): R | undefined {
    const value = localStorage.getItem(key);

    if (value == null) {
      return undefined;
    }

    return JSON.parse(value) as R;
  },

  set<R>(key: Key, value: R): void {
    localStorage.setItem(key, JSON.stringify(value));
  },

  has(key: Key): boolean {
    return localStorage.getItem(key) != null;
  },

  remove(key: Key): void {
    localStorage.removeItem(key);
  },
};

const SESSION_CACHE: DataStorage = {
  get<R>(key: Key): R | undefined {
    const value = sessionStorage.getItem(key);

    if (value == null) {
      return undefined;
    }

    return JSON.parse(value) as R;
  },

  set<R>(key: Key, value: R): void {
    sessionStorage.setItem(key, JSON.stringify(value));
  },

  has(key: Key): boolean {
    return sessionStorage.getItem(key) != null;
  },

  remove(key: Key): void {
    sessionStorage.removeItem(key);
  },
};

export default {
  LOCAL_CACHE,
  RUNTIME_CACHE,
  SESSION_CACHE,
};
