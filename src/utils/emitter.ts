
export type EmitterListener<Target> = (value: Target) => void;

export default class Emitter<Target> {
  private listeners: Set<EmitterListener<Target>>;

  constructor() {
    this.listeners = new Set<EmitterListener<Target>>();
  }

  on(listener: EmitterListener<Target>): void {
    this.listeners.add(listener);
  }

  off(listener: EmitterListener<Target>): void {
    this.listeners.delete(listener);
  }

  emit(value: Target): void {
    new Set(this.listeners).forEach((listener) => listener(value));
  }
}
