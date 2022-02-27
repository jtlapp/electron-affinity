# electron-affinity

IPC via simple method calls in Electron

_WORK IN PROGRESS_

This documentation should be enough to use the module, but I'm still fleshing it out.

## Introduction

Electron Affinity is a small TypeScript library that makes IPC as simple as possible in Electron. It has the following features:

- IPC services are merely methods on vanilla classes, callable both locally and remotely.
- Organizes IPC methods into distinct named APIs, each defined by its own class.
- Makes APIs remotely available by handing instances of their classes to the library function for exposing them.
- Remotely binds APIs by passing their names to the library function for binding them.
- Changes made to the TypeScript signature of an IPC method to instantly change the remotely available signature.
- Optionally restores transferred objects back into classes via custom restoration functions, enabling APIs to have class instance parameters and return values.
- Allows main APIs to cause exceptions to be thrown in the calling window by wrapping the exception in an instance of `RelayedError` and throwing this instance.
- Main APIs are all asynchronous functions using Electron's `ipcRenderer.invoke`, while window APIs all use Electron's `window.webContents.send` and return no value.
- Uses context isolation and does not require node integration, maximizing security.

Note: The library should work with plain JavaScript, but I have not tried it, so I don't know what special considerations might require documentation.

## Problems Addressed

This library was designed to address many of the problems that can arise when using IPC in Electron. Every design decision was intended to either eliminate a problem or catch a problem and produce a helpful error message. Here are some of the problems addressed:

- Misspelled or inconsistently changed IPC channel names break calls.
- There are two channel name spaces, and an IPC can be handled in one but called in the other.
- Types for each IPC are managed in multiple places, allowing argument and return types to disagree between the main process and the renderer.
- Class instances become untyped objects when transmitted over IPC.
- Implementing IPC requires lots of boilerplate code on both sides.
- Extra effort is required to make local IPC functionality locally available.
- Exceptions are local, with no mechanism for transferring caller-caused errors back to the caller in IPCs that normally return values.
- Coding IPC with context isolation and without node integration is typically complex.

## Installation

`npm install electron-affinity`

or

`yarn add electron-affinity`

## Usage

Electron Affinity supports main APIs and window APIs. Main APIs are defined in the main process and callable from renderer windows. Window APIs are defined in renderer windows and callable from the main process. Window-to-window calling is not supported.

The first two sections on usage, "Main APIs" and "Window APIs" are all you need to read to get an understanding of this library.

### Main APIs

A main API is an instance of a class defined in the main process. All methods of this class, including ancestor class methods, are treated as IPC methods except for those prefixed with underscore (`_`) or pound (`#`). You can use these prefixes to define private methods and properties on which the IPC methods rely.

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

- All methods return promises even when they don't need to. This allows all IPC calls to the main process to use `ipcRenderer.invoke()`, keeping Electron Affinity simple.
- Even though `writeData()` received `data` via IPC, it exists as an instance of class `Data` with the `format()` method available.
- The usage of the `private` modifier has no effect on Electon Affinity. Instead, it is the `_` prefix that prevents members `_dataSource`, `_dataset`, and `_checkforError()` from being exposed as IPC methods.
- If the data source encounters an error, `_checkForError()` returns the error (sans stack trace) to the window to be thrown from within the renderer.
- Exceptions thrown by `open()`, `read()`, or `write()` do not get returned to the window and instead cause exceptions within the main process.

The main process makes this API available to windows by calling `exposeMainApi` before the windows attempt to use the API:

```ts
import { exposeMainApi } from "electron-affinity/main";

exposeMainApi(new DataApi(dataSource), restorer);
```

`restorer` is an optional function-typed argument that takes responsibility for restoring the classes of transferred objects. It only restores those classes that the API requires be restored. [See below](#restoring-classes) for an explanation of its use.

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

- The code imports the _type_ `DataApi` rather than the class `DataApi`. This keeps the renderer from pulling in main process code.
- `bindMainApi()` takes both the type parameter `DataApi` and the string name of the API `"DataApi"`. The names must agree.
- The main process must have previously exposed the API. The window will not wait for the main process to subsequently expose it.
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

Window APIs are analogous to main APIs, except that they are defined in the renderer and don't return a value. All methods of a window API class, including ancestor class methods, are treated as IPC methods except for those prefixed with underscore (`_`) or pound (`#`). As with main APIs, they can take any number of parameters, including none.

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

- The methods are implemented as `window.webContents.send()` calls; the return values of window API methods are not returned. Code within the main process always shows their return values as void.
- Methods can by asynchronous, but the main process cannot wait for them to resolve.
- Even though `systemReport` received `report` via IPC, it exists as an instance of `SystemReport` with the `summarize()` method available.
- The usage of the `private` modifier has no effect on Electon Affinity. Instead, it is the `_` prefix that prevents members `_receiver` from being exposed as an IPC method.
- Exceptions thrown by any of these methods do not get returned to the main process.

The window makes the API available to the main process by calling `exposeWindowApi`:

```ts
import { exposeWindowApi } from "electron-affinity/window";

exposeWindowApi(new StatusApi(receiver), restorer);
```

`restorer` is an optional function-typed argument that takes responsibility for restoring the classes of transferred objects. It only restores those classes that the API requires be restored. [See below](#restoring-classes) for an explanation of its use.

The main process uses the API as follows:

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

- The code imports the _type_ `StatusApi` rather than the class `StatusApi`. This keeps the main process from pulling in window-side code.
- `bindWindowApi()` takes both the type parameter `StatusApi` and the string name of the API `"StatusApi"`. The names must agree.
- `bindWindowApi()` takes a reference to the `BrowserWindow` to which the API is bound. Each API is bound to a single window and messages only that window.
- The code calls an API method as if the method were local to the window.
- The main process does not need to do anything special to wait for the window to finish loading. `bindWindowApi` will keep attempting to bind until timing out.

### Organizing Main APIs

Each main API must be exposed and bound individually. A good practice is to define each API in its own file, exporting the API class. Your main process code then imports them and exposes them one at a time. For example:

```ts
// src/backend/main.ts

import { exposeMainApi } from "electron-affinity/main";
import type { DataApi } from "path/to/status_api";
import type { UploadApi } from "path/to/message_api";

exposeMainApi(new DataApi());
exposeMainApi(new UploadApi());
```

However, the main process may want to call these APIs itself. In this case, it's useful to attach them to the `global` variable. We might do so as follows:

```ts
// src/backend/apis/main_apis.ts

import { exposeMainApi } from "electron-affinity/main";
import { DataApi } from "path/to/status_api";
import { UploadApi } from "path/to/message_api";

export type MainApis = ReturnType<typeof installMainApis>;

export function installMainApis() {
  const apis = {
    dataApi: new DataApi(),
    uploadApi: new UploadApi(),
    /* ... */
  };
  for (const api of Object.values(apis)) {
    exposeMainApi(api as any);
  }
  global.mainApis = apis as any;
}
```

Because this solution requires passing each API to `exposeMainApi` as type `any`, it loses the type-checking that makes sure the APIs are valid. The `checkMainApi` function remedies this:

```ts
// src/backend/apis/main_apis.ts

import { exposeMainApi, checkMainApi } from "electron-affinity/main";
import { DataApi } from "path/to/status_api";
import { UploadApi } from "path/to/message_api";

export type MainApis = ReturnType<typeof installMainApis>;

export function installMainApis() {
  const apis = {
    dataApi: checkMainApi(new DataApi()),
    uploadApi: checkMainApi(new UploadApi()),
    /* ... */
  };
  for (const api of Object.values(apis)) {
    exposeMainApi(api as any);
  }
  global.mainApis = apis as any;
}
```

We'd also like type-checking on calls made to these APIs from within the main process. To accomplish this, put the following in a `global.d.ts` file:

```ts
// src/backend/global.d.ts

import { MainApis } from './backend/apis/main_apis';

declare global {
  var mainApis: MainApis;
}
```

Finally, call `installMainApis` when initializing the main process. Now any main process code can call the APIs:

```ts
global.mainApis.dataApi.openDataset("weather-data", 500);
let data = await global.mainApis.dataApi.readData();
await global.mainApis.uploadApi.upload(filename);
```

Windows are able to bind to main APIs after the main process has installed them, but a window must wait for each binding to complete before using the binding. This requires the bindings to occur within asynchronous functions. One way to do this is to create a function for just this purpose:

```ts
// src/frontend/main_apis.ts

import { bindMainApi, AwaitedType } from 'electron-affinity/window';

import type { DataApi } from "path/to/status_api";
import type { UploadApi } from "path/to/message_api";

export type MainApis = AwaitedType<typeof bindMainApis>;

export async function bindMainApis() {
  return {
    dataApi: await bindMainApi<DataApi>('DataApi'),
    uploadApi: await bindMainApi<UploadApi>('UploadApi'),
    /* ... */
  };
}
```

During initialization, have the window script call `bindMainApis`:

```ts
// src/frontend/init.ts

window.apis = await bindMainApis();
```

To get type-checking on these APIs, add the following to `global.d.ts`:

```ts
// src/frontend/global.d.ts

import type { MainApis } from './lib/main_client';

declare global {
  interface Window {
    apis: MainApis;
  }
}
```

Assuming all windows bind to all main APIs, you can use `window.apis` to call any of the main APIs:

```ts
window.apis.dataApi.openDataset("weather-data", 500);
let data = await window.apis.dataApi.readData();
await window.apis.uploadApi.upload(filename);
```

### Organizing Window APIs

Each window API must be exposed and bound individually. A good practice is to define each API in its own file, exporting the API class. Your window script then imports them and exposes them one at a time. For example:

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

It helps to create a module in the main process that binds the APIs for each different kind of window. In the following, `AwaitedType` extracts the type of value to which a promise resolves and prevents you from having to redeclare the API:

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

> NOTE FOR SVELTE: If your window API needs to import from svelte modules, you'll want to put the API within `<script lang="ts" context="module">` of a svelte file, but then you'll find your backend trying to `import type` from that svelte file. I found this doable with a little extra configuration. First, I added `"extends": "@tsconfig/svelte/tsconfig.json"` to the `tsconfig.json` for my backend code. Surprisingly, the only side-effect I encountered was having to `import type` everywhere in the backend that was only using the type. Second, I added a `.d.ts` file that declares the window APIs, such as the following (filename doesn't matter):

```ts
// src/backend/svelte.d.ts

declare module '*.svelte' { // don't change '*.svelte'
  export { StatusApi } from '../frontend/apis/status_api.svelte';
  export { MessageApi } from '../frontend/apis/message_api.svelte';
}
```

### Restoring Classes

Electron Affinity allows class instances to be sent and received via IPC so that they arrive as class instances instead of as untyped, methodless objects. Electron already provides this functionality for basic, built-in classes, such as `Date`, but you can use this library's class restoration mechanism to restore any custom class.

You only restore the classes you want to restore, letting all other class instances transfer as untyped objects. Do so by defining a restorer function conforming to the `RestorerFunction` type (available to both the main process and windows):

```ts
type RestorerFunction = (className: string, obj: Record<string, any>) => any;
```

The function takes the name of a class and the untyped object into which the instance was converted during transfer, and it returns an instance of the class reconstructed from the object. If it does not recognize the class name or does not wish to restore the particular class, it simply returns the provide object. Here's an example:

```ts
class Catter {
  s1: string;
  s2: string;
  
  constructor(s1: string, s2: string) {
    this.s1 = s1;
    this.s2 = s2;
  }
  
  // this method will be available after restoration
  cat() {
    return s1 + s2;
  }
}

const restorer = (className: string, obj: Record<string, any>) {
  if (className == "Catter") {
    return new Catter1(obj.s1, obj.s2);
  }
  return obj;
}
```

Proper encapsulation would have us put the restoration functionality on the class itself. You can hardcode this per class, if you like, but the library provides tools that make this easier. It uses the `RestorableClass` type (available to both the main process and windows). This type defines a static method on the class called `restoreClass`:

```ts
type RestorableClass<C> = {
  // static method of the class returning an instance of the class
  restoreClass(obj: Record<string, any>): C;
};
```

Now we can generically restore any number of classes, as follows:

```ts
import type { RestorableClass } from "electron-affinity/main";

class Catter {
  /* ...same as above... */
  
  static restoreClass(obj: any): Catter {
    return new Catter(obj.s1, obj.s2);
  }
}

class Joiner {
  list: string[];
  delim: string;
  
  constructor(list: string[], delim: string) {
    this.list = list;
    this.delim = delim;
  }
  
  // this method will be available after restoration
  join() {
    return this.list.join(this.delim);
  }
  
  static restoreClass(obj: any): Joiner {
    return new Joiner(obj.list, obj.delim);
  }
}

const restorationMap: Record<string, RestorableClass<any>> = {
  Catter,
  Joiner,
};

export function restorer(className: string, obj: Record<string, any>) {
  const restorableClass = restorationMap[className];
  return restorableClass === undefined
    ? obj
    : restorableClass["restoreClass"](obj);
}
```

You can restore API arguments and return values. Arguments are restored by the method that exposes the API, and return values are restored by the method that binds the API. To employ a restorer function, just pass the function as the last parameter of the exposing or binding method. For example:

```ts
// main process
exposeMainApi(new DataApi(dataSource), restorer);
const statusApi = await bindWindowApi<StatusApi>(window, 'StatusApi', restorer);

// window
exposeWindowApi(new StatusApi(), restorer);
const uploadApi = await bindMainApi<UploadApi>('UploadApi', restorer);
```

The restorer function need not be the same for all APIs; each can use its own restorer, or it can opt to use no restorer at all.

You can also use the restorer function to restore exceptions that are relayed to the window for rethrowing in the window.

### Relaying Exceptions

Main APIs can cause exceptions to be thrown in the calling window. This is useful for communicating errors for which the window is the cause, such as incorrect login credentials or incorrect file format for a user-selected file.

The mechanism is simple:

1. Create the object that is to be thrown in the window.
2. Wrap that object in an instance of `RelayedError`.
3. Throw the instance of `RelayedError`.

If the wrapped object is an instance of a `Error` and you're okay with the window receiving an instance of `Error`, then there is no need to do anything more. However, if you wish to restore the original class, such as for use in `instanceof` checks within a `catch`, you'll need to have a restorer function restore the class. (This is the restorer function passed to `bindMainApi`.)

Here is an example:

```ts
// src/backend/apis/login_api.ts

import { RelayedError } from 'electron-affinity/main';

export class LoginApi {
  private _site: SiteClient;
  
  constructor(site: SiteClient) {
    this._site = site;
  }
  
  async loginUser(username: string, password: string) {
    try {
      await this._site.login(username, password);
    } catch (err: any) {
      if (err.code == 'BAD_CREDS') {
        throw new RelayedError(err);
      }
      throw err;
    }
  }
}
```

```ts
// src/frontend/login_form.ts

async function onSubmit() {
  try {
    await window.apis.loginApi.loginUser(username, password);
  } catch (err: any) {
    if (err.code == 'BAD_CREDS') {
      showMessage('Incorrect credentials');
    } else {}
      showMessage('UNEXPECTED ERROR: ' + err.message);
    }
  }
}
```

Whenever an instance (or subclass) of `Error` is created in the one process and transferred via IPC to another process, by any means, the stack trace is removed prior to transfer. Electron does this, and the library does not obviate it.

A main API that throws an error not wrapped in `RelayedError` results in an uncaught exception within the main process. Main APIs can return error objects, but Electron strips them of everything but the message.

Exceptions thrown within window APIs are never returned to the main process.

### Managing Timeout

The library will time out if it takes too long for the main process to bind to a window API or if it takes too long for a window to bind to a main API. The former can happen if the main process attempts to bind before a window has finished initializing and it takes a long time for the window to initialize. The latter can happen if the main process is too busy to respond or has gone unresponsive.

The default timeout is 4 seconds, which should be long enough for either of these bindings; if it takes more than 4 seconds, it's likely that there's another problem requiring correction. Even so, there may be scenarios I haven't anticipated requiring a longer timeout, and possibly scenerios where a shorter timeout is desirable. The main process and each window sets its own timeout via the `setIpcBindingTimeout()` function, as follows:

```ts
// main process
import { setIpcBindingTimeout } from 'electron-affinity/main';

setIpcBindingTimeout(8000); // 8 seconds
```

```ts
// window
import { setIpcBindingTimeout } from 'electron-affinity/window';

setIpcBindingTimeout(500); // 500 milliseconds
```

The timeout applies to all bindings, including in-progress bindings.

The library does not at present provide a timeout for the duration of a main API, and it appears that Electron provides no timeout on `ipcRenderer.invoke` either.

### Example Repo

The library was developed for the [ut-entomology/spectool](https://github.com/ut-entomology/spectool) repo, where you'll find plenty of code exmplifying how to use it. See the following files and directories:

- [Installing main APIs and binding window APIs to the main window](https://github.com/ut-entomology/spectool/blob/main/src/electron.ts)
- [Main process global.d.ts providing the main process with access to main APIs](https://github.com/ut-entomology/spectool/blob/main/src/global.d.ts)
- [Backend main API classes](https://github.com/ut-entomology/spectool/tree/main/src/backend/api)
- [Window binding to main APIs](https://github.com/ut-entomology/spectool/blob/main/src/frontend/lib/main_client.ts)
- [Attaching main APIs to the window and exposing a window API](https://github.com/ut-entomology/spectool/blob/main/src/frontend/App.svelte)
- [Frontend global.d.ts providing windows with access to main APIs](https://github.com/ut-entomology/spectool/blob/main/src/frontend/global.d.ts)
- [Window API class](https://github.com/ut-entomology/spectool/blob/main/src/frontend/api/app_event_api.svelte)
- [Calls from the window to main APIs](https://github.com/ut-entomology/spectool/search?q=window.apis)
- [Calls from the main process to the main window APIs](https://github.com/ut-entomology/spectool/blob/main/src/app/app_menu.ts)

## TBD: Other notes to include / caveats

- Drawback of having to ensure that IPC only used after async initialization.
- window.apis.apiName.method() may be preferrable to window.apiName.method() because upon typing "window." into VSCode, all available window properties are shown, whereas upon typing "window.apis.", only available APIs are shown.
- RelayedError is not an instance of Error, so don't extend it.
- Must take care to bind before all usage, because not static.
- Supports invoking APIs on ancestor classes of API class
- // see https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work
  Object.setPrototypeOf(this, CustomError.prototype);
- Electron strips everything but the error message from errors sent to or received from either the main process or the renderer, and I'm not adding them back in.
- Electron auto-restores some classes (e.g. Date)
- Installs `window.__ipc`.

## TBD: Type considerations:

- Utility for getting in-place API type errors.
- Wrapping APIs in functions that reveal type mismatch
- Is void return enforced?
- Any way to require an argument to have the class name of a generic?
- Can't pass multiple different API types to binding

## Reference

TBD
