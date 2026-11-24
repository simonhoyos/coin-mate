import Dataloader from 'dataloader';
import type { IContext } from './types';

export function createLoader<V, K = string, C = K>(
  batchFn: (args: { context: IContext; keys: readonly K[] }) => Promise<V[]>,
  options?: Dataloader.Options<K, V, C>,
) {
  const key = Symbol();

  function getLoader(context: IContext) {
    if (context.dl.has(key) !== true) {
      const loader = new Dataloader(
        (keys: readonly K[]) => batchFn({ context, keys }),
        options,
      );

      context.dl.set(key, loader);
    }

    return context.dl.get(key) as Dataloader<K, V>;
  }

  const load = (args: { context: IContext; id: K }) =>
    getLoader(args.context).load(args.id);

  load.clear = (args: { context: IContext; id: K }) => {
    getLoader(args.context).clear(args.id);
  };

  return load;
}
