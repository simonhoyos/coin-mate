import Dataloader from 'dataloader';
import type { IContext } from './types';

export function createLoader<V, K = string, C = K>(
  batchFn: (args: { context: IContext; keys: readonly K[] }) => Promise<V[]>,
  options?: Dataloader.Options<K, V, C>,
) {
  const key = Symbol();

  return (args: { context: IContext; id: K }) => {
    if (args.context.dl.has(key) !== true) {
      const loader = new Dataloader(
        (keys: readonly K[]) => batchFn({ context: args.context, keys }),
        options,
      );

      args.context.dl.set(key, loader);
    }

    const loader = args.context.dl.get(key) as Dataloader<K, V>;

    return loader.load(args.id);
  };
}
