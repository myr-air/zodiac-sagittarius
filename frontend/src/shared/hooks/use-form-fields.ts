import { useCallback, useState } from "react";
import {
  updateFieldsState,
  updateFieldState,
} from "@/src/shared/form-state";

export function useFormFields<State>(initialFields: State) {
  const [fields, setFields] = useState<State>(initialFields);

  const updateField = useCallback(
    <Field extends keyof State>(field: Field, value: State[Field]) => {
      setFields((current) => updateFieldState(current, field, value));
    },
    [],
  );

  const updateFields = useCallback((nextFields: Partial<State>) => {
    setFields((current) => updateFieldsState(current, nextFields));
  }, []);

  return {
    fields,
    setFields,
    updateField,
    updateFields,
  };
}
