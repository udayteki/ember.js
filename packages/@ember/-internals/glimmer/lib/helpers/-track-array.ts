/**
@module ember
*/
import { tagForProperty } from '@ember/-internals/metal';
import { VM, VMArguments } from '@glimmer/interfaces';
import { createComputeRef, valueForRef } from '@glimmer/reference';
import { consumeTag } from '@glimmer/validator';

/**
  This reference is used to get the `[]` tag of iterables, so we can trigger
  updates to `{{each}}` when it changes. It is put into place by a template
  transform at build time, similar to the (-each-in) helper
*/
export default function trackArray(args: VMArguments, vm: VM) {
  let inner = args.positional.at(0);

  return createComputeRef(vm.env, () => {
    let iterable = valueForRef(inner);

    consumeTag(tagForProperty(iterable, '[]'));

    return iterable;
  });
}
