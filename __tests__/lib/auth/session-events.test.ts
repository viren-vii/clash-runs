import {
  registerSessionInvalidatedHandler,
  emitSessionInvalidated,
} from '../../../lib/auth/session-events';

describe('session-events', () => {
  afterEach(() => {
    // Ensure no handler leaks between tests
    emitSessionInvalidated(); // safe no-op if nothing registered
  });

  it('calls the registered handler when session is invalidated', () => {
    const handler = jest.fn();
    registerSessionInvalidatedHandler(handler);

    emitSessionInvalidated();

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('does not throw when no handler is registered', () => {
    expect(() => emitSessionInvalidated()).not.toThrow();
  });

  it('cleanup function removes the handler', () => {
    const handler = jest.fn();
    const cleanup = registerSessionInvalidatedHandler(handler);

    cleanup();
    emitSessionInvalidated();

    expect(handler).not.toHaveBeenCalled();
  });

  it('second registration replaces the first handler', () => {
    const first = jest.fn();
    const second = jest.fn();

    registerSessionInvalidatedHandler(first);
    registerSessionInvalidatedHandler(second);

    emitSessionInvalidated();

    expect(second).toHaveBeenCalledTimes(1);
    expect(first).not.toHaveBeenCalled();
  });
});
