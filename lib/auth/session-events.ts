let handler: (() => void) | null = null;

export function registerSessionInvalidatedHandler(cb: () => void): () => void {
  handler = cb;
  return () => {
    if (handler === cb) handler = null;
  };
}

export function emitSessionInvalidated(): void {
  handler?.();
}
