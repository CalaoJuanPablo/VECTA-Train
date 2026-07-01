import { createStore } from 'zustand/vanilla';

export type FieldValues = Record<string, unknown>;
export type FieldErrors = Record<string, string | undefined>;
export type FieldTouched = Record<string, boolean>;

export interface FormState {
  values: FieldValues;
  errors: FieldErrors;
  touched: FieldTouched;
  isSubmitting: boolean;
  initialValues: FieldValues;
}

export interface FormsState {
  /** Each named form managed by a single provider lives here, keyed by id. */
  forms: Record<string, FormState>;
  registerForm: (id: string, initialValues: FieldValues) => void;
  setValue: (id: string, field: string, value: unknown) => void;
  setTouched: (id: string, field: string, touched?: boolean) => void;
  setErrors: (id: string, errors: FieldErrors) => void;
  setSubmitting: (id: string, isSubmitting: boolean) => void;
  reset: (id: string) => void;
}

export type FormsStore = ReturnType<typeof createFormsStore>;

function emptyForm(initialValues: FieldValues): FormState {
  return { values: { ...initialValues }, errors: {}, touched: {}, isSubmitting: false, initialValues };
}

/**
 * Vanilla zustand store backing the FormsProvider. A single store instance holds
 * the state of every named form, so one provider can host multiple forms.
 */
export function createFormsStore() {
  return createStore<FormsState>((set) => ({
    forms: {},

    registerForm: (id, initialValues) =>
      set((s) => {
        // Don't clobber a form that is already registered.
        if (s.forms[id]) return s;
        return { forms: { ...s.forms, [id]: emptyForm(initialValues) } };
      }),

    setValue: (id, field, value) =>
      set((s) => {
        const form = s.forms[id];
        if (!form) return s;
        return {
          forms: {
            ...s.forms,
            [id]: {
              ...form,
              values: { ...form.values, [field]: value },
              // Clear the field's error as the user edits it.
              errors: { ...form.errors, [field]: undefined },
            },
          },
        };
      }),

    setTouched: (id, field, touched = true) =>
      set((s) => {
        const form = s.forms[id];
        if (!form) return s;
        return {
          forms: { ...s.forms, [id]: { ...form, touched: { ...form.touched, [field]: touched } } },
        };
      }),

    setErrors: (id, errors) =>
      set((s) => {
        const form = s.forms[id];
        if (!form) return s;
        return { forms: { ...s.forms, [id]: { ...form, errors } } };
      }),

    setSubmitting: (id, isSubmitting) =>
      set((s) => {
        const form = s.forms[id];
        if (!form) return s;
        return { forms: { ...s.forms, [id]: { ...form, isSubmitting } } };
      }),

    reset: (id) =>
      set((s) => {
        const form = s.forms[id];
        if (!form) return s;
        return { forms: { ...s.forms, [id]: emptyForm(form.initialValues) } };
      }),
  }));
}
