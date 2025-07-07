import { z } from 'zod';
import { useState } from 'react';
import { useForm, UseFormProps, FieldValues, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

/**
 * Custom hook for form validation using Zod schemas
 * @param schema Zod schema for form validation
 * @param options React Hook Form options
 * @returns Form methods and validation state
 */
export function useZodForm<TSchema extends z.ZodType<any, any, any>>(
  schema: TSchema,
  options?: Omit<UseFormProps<z.infer<TSchema>>, 'resolver'>
) {
  type FormValues = z.infer<TSchema>;
  
  const form = useForm<FormValues>({
    ...options,
    resolver: zodResolver(schema),
  });

  return {
    ...form,
    formState: {
      ...form.formState,
    },
  };
}

/**
 * Custom hook for handling form submission with validation and API calls
 * @param schema Zod schema for form validation
 * @param onSubmit Function to handle form submission
 * @param options React Hook Form options
 * @returns Form methods, submission state, and error handling
 */
export function useValidatedForm<TSchema extends z.ZodType<any, any, any>>(
  schema: TSchema,
  onSubmit: SubmitHandler<z.infer<TSchema>>,
  options?: Omit<UseFormProps<z.infer<TSchema>>, 'resolver'>
) {
  type FormValues = z.infer<TSchema>;
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const form = useZodForm<TSchema>(schema, {
    ...options,
  });
  
  const handleSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      await onSubmit(data);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return {
    ...form,
    formState: form.formState,
    handleSubmit: form.handleSubmit(handleSubmit),
    isSubmitting,
    error,
    setError,
  };
}

/**
 * Utility function to get field error message
 * @param form Form state from useZodForm or useValidatedForm
 * @param fieldName Field name to get error for
 * @returns Error message for the field
 */
export function getFieldError(form: any, fieldName: string): string | undefined {
  return form.formState?.errors?.[fieldName]?.message;
}

/**
 * Utility function to check if a field has an error
 * @param form Form state from useZodForm or useValidatedForm
 * @param fieldName Field name to check
 * @returns Boolean indicating if the field has an error
 */
export function hasFieldError(form: any, fieldName: string): boolean {
  return !!form.formState?.errors?.[fieldName];
}