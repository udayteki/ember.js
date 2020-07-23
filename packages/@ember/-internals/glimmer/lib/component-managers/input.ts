import { ENV } from '@ember/-internals/environment';
import { set } from '@ember/-internals/metal';
import { Owner } from '@ember/-internals/owner';
import { assert, debugFreeze } from '@ember/debug';
import {
  Bounds,
  ComponentCapabilities,
  Destroyable,
  Dict,
  DynamicScope,
  PreparedArguments,
  VM,
  VMArguments,
} from '@glimmer/interfaces';
import { createRootRef, Reference, valueForRef } from '@glimmer/reference';
import { registerDestructor } from '@glimmer/runtime';
import { CONSTANT_TAG, createTag } from '@glimmer/validator';
import { EmberVMEnvironment } from '../environment';
import InternalComponentManager, { InternalDefinitionState } from './internal';

const CAPABILITIES: ComponentCapabilities = {
  dynamicLayout: false,
  dynamicTag: false,
  prepareArgs: true,
  createArgs: true,
  attributeHook: false,
  elementHook: false,
  createCaller: true,
  dynamicScope: false,
  updateHook: true,
  createInstance: true,
  wrapped: false,
  willDestroy: false,
};

export interface InputComponentState {
  env: EmberVMEnvironment;
  type: Reference;
  instance: Destroyable;
}

const EMPTY_POSITIONAL_ARGS: Reference[] = [];

debugFreeze(EMPTY_POSITIONAL_ARGS);

export default class InputComponentManager extends InternalComponentManager<InputComponentState> {
  getCapabilities(): ComponentCapabilities {
    return CAPABILITIES;
  }

  prepareArgs(_state: InternalDefinitionState, args: VMArguments, vm: VM): PreparedArguments {
    assert(
      'The `<Input />` component does not take any positional arguments',
      args.positional.length === 0
    );

    let __ARGS__: Dict<Reference> = args.named.capture();

    return {
      positional: EMPTY_POSITIONAL_ARGS,
      named: {
        __ARGS__: createRootRef(vm.env, __ARGS__),
        type: args.named.get('type'),
      },
    };
  }

  create(
    env: EmberVMEnvironment,
    { ComponentClass, layout }: InternalDefinitionState,
    args: VMArguments,
    _dynamicScope: DynamicScope,
    caller: Reference
  ): InputComponentState {
    // assert('caller must be const', isConstTagged(caller));

    let type = args.named.get('type');

    let instance = ComponentClass.create({
      caller: valueForRef(caller),
      type: valueForRef(type),
    });

    let state = { env, type, instance };

    if (ENV._DEBUG_RENDER_TREE) {
      env.extra.debugRenderTree.create(state, {
        type: 'component',
        name: 'input',
        args: args.capture(),
        instance,
        template: layout,
      });

      registerDestructor(instance, () => env.extra.debugRenderTree.willDestroy(state));
    }

    return state;
  }

  getSelf({ env, instance }: InputComponentState): Reference {
    return createRootRef(env, instance);
  }

  getTag() {
    if (ENV._DEBUG_RENDER_TREE) {
      // returning a const tag skips the update hook (VM BUG?)
      return createTag();
    } else {
      // an outlet has no hooks
      return CONSTANT_TAG;
    }
  }

  didRenderLayout(state: InputComponentState, bounds: Bounds): void {
    if (ENV._DEBUG_RENDER_TREE) {
      state.env.extra.debugRenderTree.didRender(state, bounds);
    }
  }

  update(state: InputComponentState): void {
    set(state.instance, 'type', valueForRef(state.type));

    if (ENV._DEBUG_RENDER_TREE) {
      state.env.extra.debugRenderTree.update(state);
    }
  }

  didUpdateLayout(state: InputComponentState, bounds: Bounds): void {
    if (ENV._DEBUG_RENDER_TREE) {
      state.env.extra.debugRenderTree.didRender(state, bounds);
    }
  }

  getDestroyable(state: InputComponentState): Destroyable {
    return state.instance;
  }
}

export const InputComponentManagerFactory = (owner: Owner) => {
  return new InputComponentManager(owner);
};
