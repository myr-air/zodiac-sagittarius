import { toggleId } from "./collection";

export function updateFieldState<State, Field extends keyof State>(
  state: State,
  field: Field,
  value: State[Field],
): State {
  return { ...state, [field]: value };
}

export function updateFieldsState<State>(
  state: State,
  fields: Partial<State>,
): State {
  return { ...state, ...fields };
}

export function toggleIdFieldState<
  Field extends PropertyKey,
  State extends Record<Field, string[]>,
>(state: State, field: Field, id: string): State {
  return {
    ...state,
    [field]: toggleId(state[field], id),
  };
}
