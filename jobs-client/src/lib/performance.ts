import { useEffect, useState, useCallback, useRef } from 'react';

/**
 * Custom hook for debouncing values
 * @param value The value to debounce
 * @param delay The delay in milliseconds
 * @returns The debounced value
 */
export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Custom hook for throttling functions
 * @param callback The function to throttle
 * @param delay The delay in milliseconds
 * @returns The throttled function
 */
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 500
): (...args: Parameters<T>) => void {
  const lastCall = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  return useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();
      const timeSinceLastCall = now - lastCall.current;

      if (timeSinceLastCall >= delay) {
        lastCall.current = now;
        callback(...args);
      } else {
        // Clear any existing timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        // Schedule the call for later
        timeoutRef.current = setTimeout(() => {
          lastCall.current = Date.now();
          callback(...args);
        }, delay - timeSinceLastCall);
      }
    },
    [callback, delay]
  );
}

/**
 * Custom hook for memoizing expensive calculations
 * @param factory Function that returns the computed value
 * @param dependencies Dependencies array for recomputation
 * @returns The memoized value
 */
export function useMemoizedValue<T>(factory: () => T, dependencies: any[]): T {
  const [value, setValue] = useState<T>(factory);
  const previousDeps = useRef<any[]>(dependencies);

  useEffect(() => {
    // Check if dependencies have changed
    const depsChanged = dependencies.some(
      (dep, i) => dep !== previousDeps.current[i]
    );

    if (depsChanged) {
      setValue(factory());
      previousDeps.current = dependencies;
    }
  }, [dependencies, factory]);

  return value;
}

/**
 * Custom hook for lazy loading components
 * @param shouldLoad Condition to determine if the component should be loaded
 * @param loader Function that returns a promise resolving to the component
 * @returns The loaded component or null
 */
export function useLazyLoad<T>(
  shouldLoad: boolean,
  loader: () => Promise<T>
): { isLoading: boolean; data: T | null; error: Error | null } {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (shouldLoad && !data && !isLoading) {
      setIsLoading(true);
      loader()
        .then((result) => {
          setData(result);
          setError(null);
        })
        .catch((err) => {
          setError(err);
          setData(null);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [shouldLoad, loader, data, isLoading]);

  return { isLoading, data, error };
}

/**
 * Custom hook for detecting when an element is in the viewport
 * @param options IntersectionObserver options
 * @returns [ref, isIntersecting] - Ref to attach to the element and boolean indicating if it's in view
 */
export function useInView(
  options: IntersectionObserverInit = { threshold: 0 }
): [React.RefObject<HTMLElement>, boolean] {
  const ref = useRef<HTMLElement>(null);
  const [isIntersecting, setIsIntersecting] = useState<boolean>(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
    }, options);

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [options]);

  return [ref, isIntersecting];
}

/**
 * Utility function to chunk array operations for better performance
 * @param array The array to process
 * @param chunkSize The size of each chunk
 * @param processor Function to process each item
 * @returns Promise that resolves when all items are processed
 */
export async function processInChunks<T, R>(
  array: T[],
  chunkSize: number,
  processor: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = [];
  
  for (let i = 0; i < array.length; i += chunkSize) {
    const chunk = array.slice(i, i + chunkSize);
    const chunkResults = await Promise.all(chunk.map(processor));
    results.push(...chunkResults);
    
    // Allow browser to render between chunks
    await new Promise(resolve => setTimeout(resolve, 0));
  }
  
  return results;
}

/**
 * Utility function to measure performance of a function
 * @param fn Function to measure
 * @param args Arguments to pass to the function
 * @returns [result, executionTime] - Result of the function and execution time in ms
 */
export function measurePerformance<T extends (...args: any[]) => any>(
  fn: T,
  ...args: Parameters<T>
): [ReturnType<T>, number] {
  const start = performance.now();
  const result = fn(...args);
  const end = performance.now();
  
  return [result, end - start];
}