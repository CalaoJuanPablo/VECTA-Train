import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { FormsProvider } from './forms-provider';
import { useForm } from './use-form';

const wrapper = ({ children }: { children: ReactNode }) => <FormsProvider>{children}</FormsProvider>;

const schemaA = z.object({ name: z.string().min(1, 'Name is required') });
const schemaB = z.object({ city: z.string().min(1, 'City is required') });

describe('useForm', () => {
  it('updates values via setValue', () => {
    const { result } = renderHook(
      () => useForm({ id: 'a', schema: schemaA, initialValues: { name: '' } }),
      { wrapper },
    );

    act(() => result.current.setValue('name', 'Jane'));
    expect(result.current.values.name).toBe('Jane');
  });

  it('surfaces field errors and skips onValid when invalid', async () => {
    const onValid = vi.fn();
    const { result } = renderHook(
      () => useForm({ id: 'a', schema: schemaA, initialValues: { name: '' } }),
      { wrapper },
    );

    await act(async () => {
      await result.current.handleSubmit(onValid)();
    });

    expect(onValid).not.toHaveBeenCalled();
    expect(result.current.errors.name).toBe('Name is required');
  });

  it('calls onValid with parsed values when valid', async () => {
    const onValid = vi.fn();
    const { result } = renderHook(
      () => useForm({ id: 'a', schema: schemaA, initialValues: { name: '' } }),
      { wrapper },
    );

    act(() => result.current.setValue('name', 'Jane'));
    await act(async () => {
      await result.current.handleSubmit(onValid)();
    });

    expect(onValid).toHaveBeenCalledWith({ name: 'Jane' });
    expect(result.current.errors.name).toBeUndefined();
  });

  it('keeps multiple forms independent under one provider', () => {
    const { result } = renderHook(
      () => ({
        a: useForm({ id: 'a', schema: schemaA, initialValues: { name: '' } }),
        b: useForm({ id: 'b', schema: schemaB, initialValues: { city: '' } }),
      }),
      { wrapper },
    );

    act(() => result.current.a.setValue('name', 'Jane'));
    expect(result.current.a.values.name).toBe('Jane');
    expect(result.current.b.values.city).toBe('');
  });
});
