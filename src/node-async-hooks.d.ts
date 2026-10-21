// Minimal ambient types for the subset of `node:async_hooks` we use. The full
// Node types are not installed (@types/node is not a dependency), but the
// AsyncLocalStorage class is provided at runtime by the `nodejs_compat`
// compatibility flag. Declaring only what we use avoids adding a heavy devDep.
declare module 'node:async_hooks' {
  export class AsyncLocalStorage<T> {
    constructor();
    getStore(): T | undefined;
    run<R>(store: T, callback: (...args: unknown[]) => R): R;
  }
}
