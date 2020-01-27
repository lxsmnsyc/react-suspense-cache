import {
  Resource, DataFetcher, KeySupplier, Config, CachedData,
} from './types';
import ResourceCache from './global-cache';
import Emitter from './utils/emitter';
import useIsomorphicEffect from './utils/hooks/useIsomorphicEffect';
import useForceUpdate from './utils/hooks/useForceUpdate';

const requests = new Map<string, Promise<void>>();

export default function createResource<Args extends any[], T>(
  keySupplier: KeySupplier<Args>,
  fetcher: DataFetcher<Args, T>,
  config?: Partial<Config>,
): Resource<Args, T> {
  const storage = config?.storage ?? ResourceCache.RUNTIME_CACHE;
  const age = config?.age ?? 60 * 1000;

  const emitter = {
    refetch: new Emitter<void>(),
  };

  function start(...args: Args): Promise<void> {
    const key = keySupplier(...args);
    const newPromise = fetcher(...args).then(
      (value) => {
        storage.set(key, {
          data: {
            status: 'success',
            value,
          },
          timestamp: new Date().getTime(),
        });
      },
      (value) => {
        storage.set(key, {
          data: {
            status: 'failure',
            value,
          },
          timestamp: new Date().getTime(),
        });
      },
    );

    storage.set(key, {
      data: {
        status: 'pending',
      },
      timestamp: new Date().getTime(),
    });

    requests.set(key, newPromise);

    return newPromise;
  }

  function refetch(...args: Args): void {
    start(...args);
    emitter.refetch.emit();
  }

  function revalidate(...args: Args): void {
    const key = keySupplier(...args);

    if (storage.has(key)) {
      const cache = storage.get<CachedData<T>>(key);

      if (cache) {
        const { timestamp } = cache;

        const current = new Date().getTime();

        if (current - timestamp < age) {
          return;
        }
      }
    }

    refetch(...args);
  }

  function set(value: T, ...args: Args): void {
    const key = keySupplier(...args);

    storage.set(key, {
      data: {
        status: 'success',
        value,
      },
      timestamp: new Date().getTime(),
    });

    emitter.refetch.emit();
  }

  function useResource(...args: Args): T | undefined {
    const forceUpdate = useForceUpdate();

    useIsomorphicEffect(() => {
      emitter.refetch.on(forceUpdate);

      return (): void => {
        emitter.refetch.off(forceUpdate);
      };
    }, []);

    useIsomorphicEffect(() => {
      const listener = (): void => {
        if (document.visibilityState === 'visible') {
          revalidate(...args);
        }
      };

      document.addEventListener('visibilitychange', listener);

      return (): void => {
        document.removeEventListener('visibilitychange', listener);
      };
    }, args as React.DependencyList);


    const key = keySupplier(...args);

    if (storage.has(key)) {
      const cache = storage.get<CachedData<T>>(key);
      const instance = requests.get(key);

      if (cache) {
        const { data, timestamp } = cache;

        const current = new Date().getTime();

        if (current - timestamp < age) {
          switch (data.status) {
            case 'success': return data.value;
            case 'failure': throw data.value;
            case 'pending':
              if (instance) {
                throw instance;
              }
              break;
            default:
              break;
          }
        }
      }
    }

    throw start(...args);
  }

  return {
    get: useResource,
    refetch,
    revalidate,
    set,
  } as Resource<Args, T>;
}
