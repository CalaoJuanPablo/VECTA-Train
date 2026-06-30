'use client';

import { useEffect, type ChangeEvent, type FormEvent } from 'react';
import { z } from 'zod';
import { useFormsApi, useFormsStore } from './forms-provider';
import type { FieldErrors, FieldValues, FormState } from './forms-store';

export interface UseFormOptions<Schema extends z.ZodType> {
  /** Unique id for this form within the provider. */
  id: string;
  /** zod schema used to validate on submit. */
  schema: Schema;
  /** Initial field values. */
  initialValues: z.input<Schema>;
}

type StringKeys<T> = Extract<keyof T, string>;

/**
 * Binds a named form (held in the FormsProvider) to a zod schema. Owns values,
 * errors and validation so design-system field components stay purely visual.
 */
export function useForm<Schema extends z.ZodType>({
  id,
  schema,
  initialValues,
}: UseFormOptions<Schema>) {
  type Input = z.input<Schema>;
  type Output = z.output<Schema>;

  const api = useFormsApi();
  const stored = useFormsStore((s) => s.forms[id]);

  // Register the form once on mount; registerForm is a no-op if it already exists.
  useEffect(() => {
    api.getState().registerForm(id, initialValues as FieldValues);
    // initialValues is intentionally read once at registration time.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [api, id]);

  const form: FormState =
    stored ?? {
      values: { ...(initialValues as FieldValues) },
      errors: {},
      touched: {},
      isSubmitting: false,
      initialValues: initialValues as FieldValues,
    };

  const setValue = (field: StringKeys<Input>, value: unknown) =>
    api.getState().setValue(id, field, value);

  const setTouched = (field: StringKeys<Input>) => api.getState().setTouched(id, field);

  const reset = () => api.getState().reset(id);

  /** Spread onto a design-system field to wire value/error/change/blur. */
  const fieldProps = (field: StringKeys<Input>) => ({
    name: field,
    value: (form.values[field] as string | undefined) ?? '',
    error: form.errors[field],
    onChange: (event: ChangeEvent<HTMLInputElement>) => setValue(field, event.target.value),
    onBlur: () => setTouched(field),
  });

  const handleSubmit =
    (onValid: (values: Output) => void | Promise<void>) => async (event?: FormEvent) => {
      event?.preventDefault();
      const state = api.getState();
      const current = state.forms[id]?.values ?? (initialValues as FieldValues);

      const result = schema.safeParse(current);
      if (!result.success) {
        const flat = z.flattenError(result.error);
        const mapped: FieldErrors = {};
        for (const [key, messages] of Object.entries(flat.fieldErrors)) {
          mapped[key] = (messages as string[] | undefined)?.[0];
          state.setTouched(id, key);
        }
        state.setErrors(id, mapped);
        return;
      }

      state.setErrors(id, {});
      state.setSubmitting(id, true);
      try {
        await onValid(result.data as Output);
      } finally {
        api.getState().setSubmitting(id, false);
      }
    };

  return {
    values: form.values as Input,
    errors: form.errors,
    touched: form.touched,
    isSubmitting: form.isSubmitting,
    setValue,
    setTouched,
    reset,
    fieldProps,
    handleSubmit,
  };
}
