import { Signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { debounceTime } from 'rxjs';

export function createDebouncedSignal<T>(
  source: Signal<T>,
  debounceMs: number,
  isBrowser: boolean,
  initialValue: T
): Signal<T> {
  return toSignal(toObservable(source).pipe(debounceTime(isBrowser ? debounceMs : 0)), {
    initialValue,
  });
}
