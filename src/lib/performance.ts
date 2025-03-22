import React, { lazy, Suspense, ComponentType } from "react";
import LoadingPage from "@/components/common/LoadingPage";

/**
 * Creates a lazily loaded component with a loading fallback
 * @param importFn - Dynamic import function for the component
 * @param fallback - Optional custom loading component
 */
export function lazyLoad<T extends ComponentType<any>>(importFn: () => Promise<{ default: T }>, fallback: React.ReactNode = React.createElement(LoadingPage)) {
  const LazyComponent = lazy(importFn);

  return (props: React.ComponentProps<T>) => React.createElement(Suspense, { fallback }, React.createElement(LazyComponent, props));
}

/**
 * Prefetches a component to improve perceived performance
 * @param importFn - Dynamic import function for the component
 */
export function prefetchComponent(importFn: () => Promise<any>) {
  // Start loading the component in the background
  importFn();
}

/**
 * Measures and logs component render time
 */
export function withPerformanceTracking<P extends object>(Component: React.ComponentType<P>, componentName: string) {
  return function PerformanceTrackedComponent(props: P) {
    const startTime = performance.now();

    React.useEffect(() => {
      const endTime = performance.now();
      console.log(`[Performance] ${componentName} rendered in ${endTime - startTime}ms`);
    }, []);

    return React.createElement(Component, props);
  };
}

/**
 * Creates a memoized component with deep prop comparison
 */
export function createMemoizedComponent<P extends object>(Component: React.ComponentType<P>, propsAreEqual?: (prevProps: Readonly<P>, nextProps: Readonly<P>) => boolean) {
  return React.memo(Component, propsAreEqual);
}
