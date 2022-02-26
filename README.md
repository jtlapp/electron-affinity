# electron-affinity

IPC via simple method calls in Electron

_WORK IN PROGRESS_

(caveats, practical matters, and API reference still missing)

## Introduction

Electron Affinity a small TypeScript library that makes IPC as simple as possible in Electron. It was designed to eliminate many of the problems that can arise when using IPC. It has the following features:

- IPC services are merely methods on a vanilla class, callable both locally and remotely.
- Group IPC methods into different classes to organize them into named APIs.
- Make an API remotely available by handing an instance of its class to the library function that exposes it.
- Remotely bind an API by passing its name to the library function that binds it.
- Change the TypeScript signature of an IPC method to instantly change the remotely available signature.
- Optionally provide the exposing and binding functions with a restortion function that transparently restores objects to class instances after transfer, enabling APIs to have class instance parameters and return values.
- Cause a main API to throw an exception in the calling window by having the API wrap the exception in an instance of class `RelayedError` and throwing this instance.
- Main APIs are all asynchronous functions using Electron `invoke`, while window APIs are all synchronous functions using Electron `send`.

Note: The library should work with plain JavaScript, but I have not tried it, so I don't know what special considerations might need to be documented.

## Installation

`npm install electron-affinity`

or

`yarn add electron-affinity`

## Usage

Electron Affinity supports main APIs and window APIs. Main APIs are defined in main and callable from renderer windows. Window APIs are defined in renderer windows and callable from main. Window-to-window calling is not supported.

### Main APIs

A main API is an instance of a class defined in main. All methods of this class, including ancestor class methods, are treated as IPC methods except for those prefixed with underscore (`_`) or pound (`#`). You can use these prefixes to define private methods and properties on which the IPC methods rely.

Each main API method can take any number of parameters, including none, but must return a promise. The promise need not resolve to a value.

Here is an example main API called `DataApi`:

```ts
import { RelayedError } from "electron-affinity/main";

export class DataApi {
  private _dataSource: DataSource;
  private _dataset: Dataset | null = null;

  constructor(dataSource: DataSource) {
    this._dataSource = dataSource;
  }

  async openDataset(setName: string, timeout: number) {
    this._dataset = this._dataSource.open(setName, timeout);
  }

  async readData() {
    data = await this._dataset.read();
    this.__checkForError();
    return data;
  }

  async writeData(data: Data) {
    await this._dataset.write(data.format());
    this.__checkForError();
  }

  async closeDataset() {
    this._dataset.close();
  }

  private _checkForError() {
    const err: DataError | null = this._dataSource.getError();
    if (err) throw new RelayedError(err);
  }
}
```

Here are a few things to note about this API:

- All methods return promises even when they don't need to. This allows all IPC calls to main to use `ipcRenderer.invoke()`, keeping Electron Affinity simple.
- Even though `writeData()` received `data` via IPC, it exists as an instance of `Data` with the `format()` method available.
- The usage of the `private` modifier has no effect on Electon Affinity. Instead, it is the `_` prefix that prevents members `_dataSource`, `_dataset`, and `_checkforError()` from being exposed as IPC methods.
- If the data source encounters an error, `_checkForError()` returns the error (sans stack trace) to the window to be thrown from within the renderer.
- Exceptions thrown by `open()`, `read()`, or `write()` do not get returned to the window and instead cause exceptions within main.

Main makes this API available to windows by calling `exposeMainApi` before the windows attempt to use the API:

```ts
import { exposeMainApi } from "electron-affinity/main";

exposeMainApi(new DataApi(dataSource), restorer);
```

`restorer` is an optional function-typed argument that takes responsibility for restoring the classes of transferred objects. It only restores those classes that the API requires be restored. Scroll down for an explanation of its use.

A window uses the API as follows:

```ts
import { bindMainApi } from "electron-affinity/window";
import type { DataApi } from "path/to/data_api";

async function loadWeatherData() {
  const dataApi = await bindMainApi<DataApi>("DataApi");

  dataApi.openDataset("weather-data", 500);
  try {
    let data = await dataApi.readData();
    while (data !== null) {
      /* do something with the data */
      data = await dataApi.readData();
    }
  } catch (err) {
    if (err instanceof DataError) {
      /* handle relayed error */
    }
  }
  dataApi.closeDataset();
}
```

Note the following about calling the API:

- The code imports the _type_ `DataApi` rather than the class `DataApi`. This keeps the renderer from pulling in main-side code.
- `bindMainApi()` takes both the type parameter `DataApi` and the string name of the API `"DataApi"`. The names must agree.
- Main must have previously exposed the API. The window will not wait for main to subsequently expose it.
- The code calls an API method as if the method were local to the window.
- There is no need to wait on APIs, particularly those that technically didn't need to be declared asynchronous (but were to satisfy Electron Affinity).

Finally, include the following line in your `preload.js`:

```ts
import "electron-ipc-methods/preload";
```

Alternatively, preload directly from `node_modules` using the appropriate path:

```ts
const window = new BrowserWindow({
  webPreferences: {
    preload: path.join(__dirname, "../node_modules/electron-affinity/preload.js"),
    nodeIntegration: false,
    contextIsolation: true,
  },
});
```

### Window APIs

Window APIs are analogous to main APIs, except that they are defined in the renderer, are synchronous, and don't return a value. All methods of a window API class, including ancestor class methods, are treated as IPC methods except for those prefixed with underscore (`_`) or pound (`#`). As with main APIs, they can take any number of parameters, including none.

Here is an example window API called `StatusApi`:

```ts
export class StatusApi {
  private _receiver: StatusReceiver;

  constructor(receiver: StatusReceiver) {
    this._receiver = receiver;
  }

  progressUpdate(percentCompleted: number) {
    this._receiver.updateStatusBar(percentCompleted);
  }

  async systemReport(report: SystemReport) {
    const summary = await report.generateSummary();
    this._receiver.updateMessage(summary);
  }
}
```

Note the following about this API:

- The methods are implemented as `window.webContents.send()` calls; the return values of window API methods are not returned. Main always shows their return values as void.
- Methods can by asynchronous, but main cannot wait for them to resolve.
- Even though `systemReport` received `report` via IPC, it exists as an instance of `SystemReport` with the `summarize()` method available.
- The usage of the `private` modifier has no effect on Electon Affinity. Instead, it is the `_` prefix that prevents members `_receiver` from being exposed as an IPC method.
- Exceptions thrown by any of these methods do not get returned to main.

The window makes the API available to main by calling `exposeWindowApi`:

```ts
import { exposeWindowApi } from "electron-affinity/window";

exposeWindowApi(new StatusApi(receiver), restorer);
```

`restorer` is an optional function-typed argument that takes responsibility for restoring the classes of transferred objects. It only restores those classes that the API requires be restored. Scroll down for an explanation of its use.

Main uses the API as follows:

```ts
import { bindWindowApi } from "electron-affinity/main";
import type { StatusApi } from "path/to/status_api";

async function doWork() {
  const statusApi = await bindWindowApi<StatusApi>(window, "StatusApi");

  /* ... */
  statusApi.progressUpdate(percentCompleted);
  /* ... */
  statusApi.systemReport(report);
  /* ... */
}
```

Note the following about calling the API:

- The code imports the _type_ `StatusApi` rather than the class `StatusApi`. This keeps main from pulling in window-side code.
- `bindWindowApi()` takes both the type parameter `StatusApi` and the string name of the API `"StatusApi"`. The names must agree.
- `bindWindowApi()` takes a reference to the `BrowserWindow` to which the API is bound. Each API is bound to a single window and messages only that window.
- The code calls an API method as if the method were local to the window.
- Main does not need to do anything special to wait for the window to finish loading. `bindWindowApi` will keep attempting to bind until timing out.

### Organizing Main APIs

TODO: Revise to explain a convenient way manage APIs.

There is no limitation on the number of APIs that main and windows can expose or bind to. Expose or bind each API in a separate call.

Here is an example of main exposing and binding multiple APIs:

```ts
import { exposeMainApi, bindWindowApi } from "electron-affinity/main";
import type { StatusApi } from "path/to/status_api";
import type { MessageApi } from "path/to/message_api";

exposeMainApi(new DataApi(dataSource), restorer);
exposeMainApi(new UploadApi()); // no restorer requried

async function doWork() {
  const statusApi = await bindWindowApi<StatusApi>(window, "StatusApi");
  const messageApi = await bindWindowApi<MessageApi>(window, "MessageApi");
}
```

### Organizing Window APIs

Each window API must be exposed and bound individually. A good practice is to define each API separately in its own file, exporting the API class. Your window script then imports them and exposes them one at a time. For example:

```ts
// src/frontend/init.ts

import { exposeWindowApi } from "electron-affinity/window";

import { StatusApi } from "./apis/status_api";
import { MessageApi } from "./apis/message_api";
import { ReportStatusApi } from "./apis/report_status_api";

exposeWindowApi(new StatusApi());
exposeWindowApi(new MessageApi());
exposeWindowApi(new ReportStatusApi());
/* ... */
```

It helps to create a module in main that binds the APIs for each different kind of window. In the following, `AwaitedType` extracts the type of value to which a promise resolves and prevents you from having to redeclare the API:

```ts
// src/backend/window_apis.ts

import type { BrowserWindow } from "electron";
import { AwaitedType, bindWindowApi } from "electron-affinity/main";

import type { StatusApi } from "../frontend/apis/status_api";
import type { MessageApi } from "../frontend/apis/message_api";

export type MainWindow = AwaitedType<typeof bindMainWindowApis>;
export type ReportWindow = AwaitedType<typeof bindReportWindowApis>;

export async function bindMainWindowApis(window: BrowserWindow) {
  return Object.assign(window, {
    apis: {
      statusApi: await bindWindowApi<StatusApi>(window, "StatusApi"),
      messageApi: await bindWindowApi<MessageApi>(window, "MessageApi"),
    },
  });
}

export async function bindReportWindowApis(window: BrowserWindow) {
  return Object.assign(window, {
    apis: {
      reportStatusApi: await bindWindowApi<ReportStatusApi>(window, "ReportStatusApi"),
    },
  });
}
```

These bind methods place APIs on `window.apis`. Here is how you might attach `apis` to the main window:

```ts
// src/backend/main.ts

import { MainWindow } from "./window_apis";

function createMainWindow(): MainWindow {
  const mainWindow = new BrowserWindow({/* ... */}) as MainWindow;
  mainWindow
    .loadURL(url)
    .then(async () => {
      await bindMainWindowApis(mainWindow);
      /* ... */
    })
  /* ... */
  return mainWindow;
}
```

Notice that (1) the window must exist in order to bind to any of its APIs, and (2) if you're going to wait for the binding to complete, you must have previously loaded the window script that exposes the APIs to be bound.

And now you can call the APIs as follows:

```ts
mainWindow.apis.statusApi.progressUpdate(progressPercent);
mainWindow.apis.messageApi.sendMessage(message);
```

> NOTE FOR SVELTE: If your window API needs to import from svelte modules, you'll want to put the API in a svelte file, but then you'll find your backend trying to `import type` from that svelte file. I found this doable with a little extra configuration. First, I added `"extends": "@tsconfig/svelte/tsconfig.json"` to the `tsconfig.json` for my backend code. Surprisingly, the only side-effect I encountered was having to `import type` everywhere in the backend that was only using the type. Second, I added a `.d.ts` file that declares the window APIs, such as the following (filename doesn't matter):

```ts
// backend/svelte.d.ts

declare module '*.svelte' { // don't change '*.svelte'
  export { StatusApi } from '../frontend/apis/status_api.svelte';
  export { MessageApi } from '../frontend/apis/message_api.svelte';
}
```

### Restoring Classes

### Managing Timeout

### Example repo

## TBD: Notes on problems addressed:

- Misspellings and name changes to IPC names break calls.
- There are two IPC names spaces, might define in one but call the other.
- Keeping argument and return types in sync between main and renderer.
- Custom mechanisms are required to convey structured errors over IPC.
- Classes become untyped objects when transmitted over IPC.
- Lots of boilerplate code required to implement IPC on both sides.
- Extra effort is required to make IPC functionality locally available.
- Causing thrown-errors to be passed on to the client.
- Distinguishing between coding errors and client/user errors.

## TBD: Other notes to include / caveats

- Drawback of having to ensure that IPC only used after async initialization.
- window.apis.apiName.method() may be preferrable to window.apiName.method() because upon typing "window." into VSCode, all available window properties are shown, whereas upon typing "window.apis.", only available APIs are shown.
- RelayedError is not an instance of Error, so don't extend it.
- Must take care to bind before all usage, because not static.
- Supports invoking APIs on ancestor classes of API class
- // see https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work
  Object.setPrototypeOf(this, CustomError.prototype);
- Electron strips everything but the error message from errors sent to or received from either main or renderer, and I'm not adding them back in.
- Electron auto-restores some classes (e.g. Date)

## TBD: Type considerations:

- Wrapping APIs in functions that reveal type mismatch
- Is void return enforced?
- Any way to require an argument to have the class name of a generic?
- Can't pass multiple different API types to binding

## TBD: To Do:

- Decide on an appropriate default binding timeout.
- Utility for getting in-place API type errors.
- Explain how to organize main and window API references.

## Reference

(Why is auto-save appending an empty code block?)
