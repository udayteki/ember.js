import { assert } from '@ember/debug';
import { DEBUG } from '@glimmer/env';
import { Helper, VM, VMArguments } from '@glimmer/interfaces';
import { createComputeRef, valueForRef } from '@glimmer/reference';

let helper: Helper;

if (DEBUG) {
  helper = (args: VMArguments, vm: VM) => {
    let inner = args.positional.at(0);

    return createComputeRef(vm.env, () => {
      let value = valueForRef(inner);

      assert(
        'You cannot pass a null or undefined destination element to in-element',
        value !== null && value !== undefined
      );

      return value;
    });
  };
} else {
  helper = (args: VMArguments) => args.positional.at(0);
}

export default helper;
