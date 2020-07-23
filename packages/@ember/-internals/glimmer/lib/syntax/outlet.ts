import { Option, VM, VMArguments } from '@glimmer/interfaces';
import {
  childRefFromParts,
  createComputeRef,
  createRootRef,
  Reference,
  valueForRef,
} from '@glimmer/reference';
import { CurriedComponentDefinition, curry, EMPTY_POSITIONAL_ARGS } from '@glimmer/runtime';
import { OutletComponentDefinition, OutletDefinitionState } from '../component-managers/outlet';
import { DynamicScope } from '../renderer';
import { isTemplateFactory } from '../template';
import { OutletState } from '../utils/outlet';

/**
  The `{{outlet}}` helper lets you specify where a child route will render in
  your template. An important use of the `{{outlet}}` helper is in your
  application's `application.hbs` file:

  ```app/templates/application.hbs
  <MyHeader />

  <div class="my-dynamic-content">
    <!-- this content will change based on the current route, which depends on the current URL -->
    {{outlet}}
  </div>

  <MyFooter />
  ```

  You may also specify a name for the `{{outlet}}`, which is useful when using more than one
  `{{outlet}}` in a template:

  ```app/templates/application.hbs
  {{outlet "menu"}}
  {{outlet "sidebar"}}
  {{outlet "main"}}
  ```

  Your routes can then render into a specific one of these `outlet`s by specifying the `outlet`
  attribute in your `renderTemplate` function:

  ```app/routes/menu.js
  import Route from '@ember/routing/route';

  export default class MenuRoute extends Route {
    renderTemplate() {
      this.render({ outlet: 'menu' });
    }
  }
  ```

  See the [routing guide](https://guides.emberjs.com/release/routing/rendering-a-template/) for more
  information on how your `route` interacts with the `{{outlet}}` helper.
  Note: Your content __will not render__ if there isn't an `{{outlet}}` for it.

  @method outlet
  @param {String} [name]
  @for Ember.Templates.helpers
  @public
*/
function _outlet([outletRef, outletState]: [Reference, any]) {
  let state = stateFor(outletRef);

  if (!validate(state, outletState.lastState)) {
    outletState.lastState = state;

    if (state !== null) {
      outletState.definition = curry(new OutletComponentDefinition(state), {
        named: {
          model: childRefFromParts(outletRef, ['render', 'model']),
        },
        positional: EMPTY_POSITIONAL_ARGS,
      });
    } else {
      outletState.definition = null;
    }
  }

  return outletState.definition;
}

export function outletHelper(args: VMArguments, vm: VM) {
  let scope = vm.dynamicScope() as DynamicScope;
  let nameRef: Reference<string>;

  if (args.positional.length === 0) {
    nameRef = createRootRef(vm.env, 'main');
  } else {
    nameRef = args.positional.at(0);
  }

  let outletRef = childRefFromParts(scope.outletState, ['outlets', nameRef]);

  let lastState: Option<OutletDefinitionState> = null;
  let definition: Option<CurriedComponentDefinition> = null;

  return createComputeRef(vm.env, () => {
    let state = stateFor(outletRef);

    if (!validate(state, lastState)) {
      lastState = state;

      if (state !== null) {
        definition = curry(new OutletComponentDefinition(state), {
          named: {
            model: childRefFromParts(outletRef, ['render', 'model']),
          },
          positional: EMPTY_POSITIONAL_ARGS,
        });
      } else {
        definition = null;
      }
    }

    return definition;
  });
}

// if (DEBUG) {
//   OutletModelReference.prototype['debugLogName'] = '@model';
// }

function stateFor(ref: Reference<OutletState | undefined>): OutletDefinitionState | null {
  let outlet = valueForRef(ref);
  if (outlet === undefined) return null;
  let render = outlet.render;
  if (render === undefined) return null;
  let template = render.template;
  if (template === undefined) return null;

  // this guard can be removed once @ember/test-helpers@1.6.0 has "aged out"
  // and is no longer considered supported
  if (isTemplateFactory(template)) {
    template = template(render.owner);
  }

  return {
    ref,
    name: render.name,
    outlet: render.outlet,
    template,
    controller: render.controller,
    model: render.model,
  };
}

function validate(state: OutletDefinitionState | null, lastState: OutletDefinitionState | null) {
  if (state === null) {
    return lastState === null;
  }
  if (lastState === null) {
    return false;
  }
  return state.template === lastState.template && state.controller === lastState.controller;
}
