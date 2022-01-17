# electron-ipc-methods

IPC via method call in Electron

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

Other notes to include:

- window.apis.apiName.method() may be preferrable to window.apiName.method() because upon typing "window." into VSCode, all available window properties are shown, whereas upon typing "window.apis.", only available APIs are shown.
- PassThroughError is not an instance of Error, so don't extend it.
- Must take care to bind before all usage, because not static.
