# electron-affinity

IPC via simple method calls in Electron

WORK IN PROGRESS

Completed renderer method invocations of main.

Will next add a way for main to send events to windows via methods.

And then will document.

Notes on problems addressed:

- Misspellings and name changes to IPC names break calls.
- There are two IPC names spaces, might define in one but call the other.
- Keeping argument and return types in sync between main and renderer.
- Custom mechanisms are required to convey structured errors over IPC.
- Classes become untyped objects when transmitted over IPC.
- Lots of boilerplate code required to implement IPC on both sides.
- Extra effort is required to make IPC functionality locally available.
- Causing thrown-errors to be passed on to the client.
- Distinguishing between coding errors and client/user errors.

Other notes to include:

- Drawback of having to ensure that IPC only used after async initialization.
- window.apis.apiName.method() may be preferrable to window.apiName.method() because upon typing "window." into VSCode, all available window properties are shown, whereas upon typing "window.apis.", only available APIs are shown.
- RelayedError is not an instance of Error, so don't extend it.
- Must take care to bind before all usage, because not static.
- When sending objects that are subsequently referenced on the sending side, the object may contain additional properties that may interfere with serialization of that object or deep copies or comparisons. To avoid this, clone objects prior to sending. (TODO: Can I prevent this by removing the tag after sending? It seems that I can for main and window arguments but not for main reply.)
- // see https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work
  Object.setPrototypeOf(this, CustomError.prototype);
