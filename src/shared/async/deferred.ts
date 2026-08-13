export interface Deferred<T> {
  promise: Promise<T>;
  resolve: (value: T | PromiseLike<T>) => void;
  reject: (reason?: unknown) => void;
}

/**
 * Creates a promise along with externally-callable `resolve`/`reject`
 * functions, for cases where the promise executor pattern is awkward
 * (e.g. resolving a promise from an event listener registered elsewhere).
 *
 * @example
 * ```ts
 * const d = deferred<number>();
 * emitter.once('value', d.resolve);
 * const value = await d.promise;
 * ```
 */
export function deferred<T = void>(): Deferred<T> {
  let resolve!: Deferred<T>['resolve'];
  let reject!: Deferred<T>['reject'];

  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
}
