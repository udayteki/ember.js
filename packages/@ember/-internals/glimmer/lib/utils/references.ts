import { debugFreeze } from '@ember/debug';
import { DEBUG } from '@glimmer/env';
import { CapturedArguments, Environment } from '@glimmer/interfaces';
import { createComputeRef, Reference } from '@glimmer/reference';
import { reifyArgs } from '@glimmer/runtime';
import { consumeTag, deprecateMutationsInAutotrackingTransaction } from '@glimmer/validator';
import { HelperInstance, RECOMPUTE_TAG, SimpleHelper } from '../helper';

export function createHelperRef<T = unknown>(
  env: Environment,
  helper: SimpleHelper<T> | HelperInstance<T>,
  args: CapturedArguments
): Reference<T> {
  return createComputeRef(env, () => {
    let { positional, named } = reifyArgs(args);

    let ret: T;

    if (DEBUG) {
      debugFreeze(positional);
      debugFreeze(named);

      deprecateMutationsInAutotrackingTransaction!(() => {
        ret = helper.compute(positional, named);
      });
    } else {
      ret = helper.compute(positional, named);
    }

    if (helper[RECOMPUTE_TAG]) {
      consumeTag(helper[RECOMPUTE_TAG]);
    }

    return ret!;
  });
}
