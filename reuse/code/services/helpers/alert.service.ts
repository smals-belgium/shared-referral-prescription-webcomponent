import { Injectable, signal, Signal, WritableSignal } from '@angular/core';
import { ResolvedError } from '@reuse/code/interfaces/error.interface';
import { AlertType } from '@reuse/code/interfaces';

/**
 * Manages named alert targets as signals.
 *
 * Components register a target with `setTarget(name)` to get a read-only signal,
 * then bind it to their alert box. Errors are pushed via `show(name, error)`.
 *
 * The "active target" lets interceptors route errors to whichever component is
 * currently visible, call `setActive(name)` on mount, `resetActive()` on unmount.
 * Defaults to `'global'` if unset; a global alert component should always register that name.
 */
@Injectable({ providedIn: 'root' })
export class AlertService {
  private readonly alertTargets = new Map<string, WritableSignal<ResolvedError | null>>();

  private activeTargetName?: string;
  private previousTargetName: string = 'global';

  setActive(name: string): void {
    this.previousTargetName = this.activeTargetName ?? 'global';
    this.activeTargetName = name;
  }

  resetActive(): void {
    this.activeTargetName = this.previousTargetName;
  }

  setTarget(name: string): Signal<ResolvedError | null> {
    return this.getOrCreate(name).asReadonly();
  }

  show(name: string, error: ResolvedError): void {
    this.getOrCreate(name).set(error);
  }

  showGeneralError(
    name: string,
    key?: string,
    opts?: { dismissible?: boolean; severity?: AlertType; retry?: boolean }
  ): void {
    const error = this.getGeneralError(key, opts);

    this.show(name, error);
  }

  getGeneralError(
    key?: string,
    opts?: { dismissible?: boolean; severity?: AlertType; retry?: boolean }
  ): ResolvedError {
    const defaultTitle = 'common.error.default.header';
    const defaultSubTitle = 'common.error.default.subheader';

    return {
      title: defaultTitle,
      subTitle: defaultSubTitle,
      message: key,
      severity: opts?.severity ?? AlertType.Error,
      dismissible: opts?.dismissible ?? true,
      retry: opts?.retry ?? false,
    };
  }

  showCurrentActiveAlert(error: ResolvedError): void {
    this.show(this.activeTargetName ?? 'global', error);
  }

  clear(name: string): void {
    this.alertTargets.get(name)?.set(null);
  }

  remove(name: string): void {
    this.alertTargets.delete(name);
  }

  private getOrCreate(name: string): WritableSignal<ResolvedError | null> {
    let activeAlert = this.alertTargets.get(name);
    if (!activeAlert) {
      activeAlert = signal<ResolvedError | null>(null);
      this.alertTargets.set(name, activeAlert);
    }
    return activeAlert;
  }
}
