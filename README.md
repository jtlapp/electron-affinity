# electron-affinity

IPC via simple method calls in Electron

## Introduction

Electron Affinity is a small TypeScript library that makes IPC as simple as possible in Electron. It has the following features:

- IPC services are merely methods on vanilla classes, callable both locally and remotely.
- Organizes IPC methods into distinct named APIs, each defined by its own class.
- Makes APIs remotely available merely by handing instances of their classes to a library function.
- Remotely binds APIs merely by passing their names to a library function.
- Changes made to the TypeScript signature of an API instantly change the remotely available signature.
- Optionally restores transferred objects back into classes via custom restoration functions, enabling APIs to have class instance parameters and return values.
- Allows main APIs to cause exceptions to be thrown in the calling window by wrapping the exception in an instance of `RelayedError` and throwing this instance.
- Main APIs are all asynchronous functions using Electron's `ipcRenderer.invoke`, while window APIs all use Electron's `window.webContents.send` and return no value.
- Uses context isolation and does not require node integration, maximizing security.

> NOTE ON JAVASCRIPT: The library should work with plain JavaScript, but I have not tried it, so I don't know what special considerations might require documentation.

## Problems Addressed

This library was designed to address many of the problems that can arise when using IPC in Electron. Every design decision was intended to either eliminate a problem or catch a problem and produce a helpful error message. Here are some of the problems addressed:

- Misspelled or inconsistently changed IPC channel names break calls.
- There are two channel name spaces, and an IPC can be handled in one but called in the other.
- Types for each IPC are managed in multiple places, allowing argument and return types to disagree between the main process and the renderer.
- Class instances become untyped objects when transmitted over IPC.
- Implementing IPC requires lots of boilerplate code on both sides.
- Extra effort is required to make local IPC functionality locally available.
- Exceptions are local, with no mechanism for transferring caller-caused errors back to the caller to be rethrown.
- Coding IPC with context isolation, without node integration is typically complex.

_Special thanks to **[Electron Mocha](https://github.com/jprichardson/electron-mocha)**, which made it possible for me to thoroughly test each iteration of the solution until everything worked as expected._

## Installation

`npm install electron-affinity`

or

`yarn add electron-affinity`

## Usage

Electron Affinity supports main APIs and window APIs. Main APIs are defined in the main process and callable from renderer windows. Window APIs are defined in renderer windows and callable from the main process. Window-to-window calling is not supported.

The first two sections on usage, "Main APIs" and "Window APIs", are all you need to read to get an understanding of this library.

### Main APIs

A main API is an instance of a class defined in the main process. All methods of this class, including ancestor class methods, are treated as IPC methods except for those prefixed with underscore (`_`) or pound (`#`). You can use these prefixes to define private methods and properties on which the IPC methods rely.

Each main API method can take any number of parameters, including none, but must return a promise. The promise need not resolve to a value.

Here is an example main API called `DataApi`:

```ts
import { ElectronMainApi, RelayedError } from "electron-affinity/main";

export class DataApi implements ElectronMainApi<DataApi> {
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

- The API must implement `ElectronMainApi<T>` to get enforcement of main API type constraints.
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
- The code calls a main API method as if it were local to the window.
- There is no need to wait on APIs, particularly those that technically didn't need to be declared asynchronous (but were to satisfy Electron Affinity).

Finally, include the following line in your `preload.js`:

```ts
import "electron-ipc-methods/preload";
```

Alternatively, preload directly from `node_modules` using the appropriate path:

```ts
// src/main.ts

const window = new BrowserWindow({
  webPreferences: {
    preload: path.join(
      __dirname,
      "../node_modules/electron-affinity/preload.js"
    ),
    nodeIntegration: false,
    contextIsolation: true,
  },
});
```

### Window APIs

Window APIs are analogous to main APIs, except that they are defined in the renderer and don't return a value. All methods of a window API class, including ancestor class methods, are treated as IPC methods except for those prefixed with underscore (`_`) or pound (`#`). As with main APIs, they can take any number of parameters, including none.

Here is an example window API called `StatusApi`:

```ts
import type { ElectronWindowApi } from 'electron-affinity/window';

export class StatusApi implements ElectronWindowApi<StatusApi> {
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

- The API must implement `ElectronWindowApi<T>` to get enforcement of window API type constraints.
- The methods are implemented as `window.webContents.send()` calls; the return values of window API methods are not returned. Code within the main process always shows their return values as void.
- Methods can by asynchronous, but the main process cannot wait for them to resolve.
- Even though `systemReport` received `report` via IPC, it exists as an instance of `SystemReport` with the `generateSummary()` method available.
- The usage of the `private` modifier has no effect on Electon Affinity. Instead, it is the `_` prefix that prevents the member `_receiver` from being exposed as an IPC method.
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
- The code calls a window API method as if it were local to the main process.
- The main process does not need to do anything special to wait for the window to finish loading. `bindWindowApi` will keep attempting to bind until timing out.

Window APIs also require that you preload `electron-ipc-methods/preload`.

### Organizing Main APIs

Each main API must be exposed and bound individually. A good practice is to define each API in its own file, exporting the API class. Your main process code then imports them and exposes them one at a time. For example:

```ts
// src/main.ts

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

This approach doesn't give us type-checking on calls to the APIs made from within the main process. To get this, put the following in a `global.d.ts` file:

```ts
// src/backend/global.d.ts

import { MainApis } from "./backend/apis/main_apis";

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

Windows are able to bind to main APIs after the main process has installed them, but a window must wait for each binding to complete before using the API. This requires API bindings to occur within asynchronous functions. One way to do this is to create a function for just this purpose:

```ts
// src/frontend/main_apis.ts

import { bindMainApi, AwaitedType } from "electron-affinity/window";

import type { DataApi } from "path/to/status_api";
import type { UploadApi } from "path/to/message_api";

export type MainApis = AwaitedType<typeof bindMainApis>;

export async function bindMainApis() {
  return {
    dataApi: await bindMainApi<DataApi>("DataApi"),
    uploadApi: await bindMainApi<UploadApi>("UploadApi"),
    /* ... */
  };
}
```

However, if you want to allow API classes that inherit from other API classes, you'll want a more typesafe solution. See [Inheriting API Classes](#inheriting-api-classes).

During initialization, have the window script call `bindMainApis`:

```ts
// src/frontend/init.ts

window.apis = await bindMainApis();
```

To get type-checking on calls to these APIs, add the following to `global.d.ts`:

```ts
// src/frontend/global.d.ts

import type { MainApis } from "./lib/main_apis";

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
      reportStatusApi: await bindWindowApi<ReportStatusApi>(
        window,
        "ReportStatusApi"
      ),
    },
  });
}
```

These bind methods place APIs on `window.apis`. Here is how you might attach `apis` to the main window:

```ts
// src/main.ts

import { MainWindow } from "./window_apis";

function createMainWindow(): MainWindow {
  const mainWindow = new BrowserWindow({
    /* ... */
  }) as MainWindow;
  mainWindow.loadURL(url).then(async () => {
    await bindMainWindowApis(mainWindow);
    /* ... */
  });
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

declare module "*.svelte" {
  // don't change '*.svelte'
  export { StatusApi } from "../frontend/apis/status_api.svelte";
  export { MessageApi } from "../frontend/apis/message_api.svelte";
}
```

### Restoring Classes

Electron Affinity allows class instances to be sent and received via IPC so that they arrive as class instances instead of as untyped, methodless objects. Electron already provides this functionality for basic, built-in classes, such as `Date`, but you can use this library's class restoration mechanism to restore any custom class.

You only restore the classes you want to restore, letting all other class instances transfer as untyped objects. Do so by defining a restorer function conforming to the `RestorerFunction` type, available to both the main process and windows:

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

Proper encapsulation would have us put the restoration functionality on the class itself. Fortunately, Electron Affinity makes this easy to do. First, add a static method called `restoreClass` to each class that is to be restorable, having it take an untyped object and return an instance of the class sourced from that object. Second, bind a class-name-to-class mapping of these classes to the library function `genericRestorer`, and use this bound function as your restoration function. Here's an example:

```ts
import type { genericRestorer } from "electron-affinity/main";

export class Catter {
  /* ...same as above... */

  static restoreClass(obj: any): Catter {
    return new Catter(obj.s1, obj.s2);
  }
}

export class Joiner {
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

// Use this bound restorer function.
export const restorer = genericRestorer.bind(null, {
  Catter,
  Joiner,
});
```

You can restore both API arguments and return values. Arguments are restored by the method that exposes the API, and return values are restored by the method that binds the API. To employ a restorer function, just pass the function as the last parameter of the exposing or binding method. For example:

```ts
// main process
exposeMainApi(new DataApi(dataSource), restorer);
const statusApi = await bindWindowApi<StatusApi>(window, "StatusApi", restorer);

// window
exposeWindowApi(new StatusApi(), restorer);
const uploadApi = await bindMainApi<UploadApi>("UploadApi", restorer);
```

The restorer function need not be the same for all APIs; each can use its own restorer, or it can opt to use no restorer at all.

You can also use the restorer function to restore the classes of exceptions that are relayed to the window for rethrowing in the window.

### Relaying Exceptions

Main APIs can cause exceptions to be thrown in the calling window. This is useful for communicating errors for which the window is the cause, such as incorrect login credentials or incorrect file format for a user-selected file.

The mechanism is simple. From within the main API:

1. Create the object that is to be thrown in the window.
2. Wrap that object in an instance of `RelayedError`.
3. Throw the instance of `RelayedError`.

If the wrapped object is an instance of a `Error` and you're okay with the window receiving an instance of `Error`, then there is no need to do anything more. However, if you wish to restore the original class, such as for use in `instanceof` checks within a `catch`, you'll need to have a restorer function restore the class. (This is the restorer function passed to `bindMainApi`.)

Here is an example, showing a main API and a window calling that main API:

```ts
// src/backend/apis/login_api.ts

import { ElectronMainApi, RelayedError } from "electron-affinity/main";

export class LoginApi implements ElectronMainApi<LoginApi> {
  private _site: SiteClient;

  constructor(site: SiteClient) {
    this._site = site;
  }

  async loginUser(username: string, password: string) {
    try {
      await this._site.login(username, password);
    } catch (err: any) {
      if (err.code == "BAD_CREDS") {
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

Whenever an instance (or subclass) of `Error` is created in the one process and transferred via IPC to another process, by any means, the stack trace and error code (if any) is removed prior to transfer. Electron does this, and the library does not obviate it.

A main API that throws an error not wrapped in `RelayedError` results in an uncaught exception within the main process. Main APIs can return error objects as return values, but Electron strips them of everything but the message.

Exceptions thrown within window APIs are never returned to the main process.

### Managing Timeout

The library will time out if it takes too long for the main process to bind to a window API or if it takes too long for a window to bind to a main API. The former can happen if the main process attempts to bind before a window has finished initializing and it takes a long time for the window to initialize. The latter can happen if the main process is too busy to respond or has gone unresponsive. An attempt to bind a main API will also time out if the main process never exposed the API.

The default timeout is 4 seconds, which should be long enough for either of these bindings; if it takes more than 4 seconds, there's likely another problem requiring correction. Even so, there may be scenarios I haven't anticipated requiring a longer timeout, and possibly scenerios where a shorter timeout is desirable. The main process and each window sets its own timeout via the `setIpcBindingTimeout()` function, as follows:

```ts
// main process
import { setIpcBindingTimeout } from "electron-affinity/main";

setIpcBindingTimeout(8000); // 8 seconds
```

```ts
// window
import { setIpcBindingTimeout } from "electron-affinity/window";

setIpcBindingTimeout(500); // 500 milliseconds
```

The timeout applies to all bindings, including in-progress bindings.

The library does not provide a timeout for the duration of a main API call, and it appears that Electron provides no timeout on the underlying `ipcRenderer.invoke` either.

### Inheriting API Classes

Electron Affinity also exposes and binds the methods of ancestor API classes of an API class, but it does not provide type checking directly on the descendant API classes. Instead, you you'll need to use one of the following utility functions:

```ts
checkMainApiClass(classObject)
checkWindowApiClass(classObject)
checkMainApi(instanceObject)
checkWindowApi(instanceObject)
```

The first two&mdash;the class checkers&mdash;take the API class as an argument and return no value. The last two&mdash;the instance checkers&mdash;take an instance of the API class as an argument and return that instance.

The class checkers are useful for type-checking the API class in the file that defines the class. They allow you to get your type errors next to the code that has the errors. Unfortunately, you have to remember to add the class check to the code. If you forget, and if you aren't passing the API directly to an API-exposing method, then you could get type-related errors at runtime when using the API.

Here's how you can use a class checker:

```ts
import { checkMainApiClass } from 'electron-affinity/main';

export class ExtendedDataApi extends DataApi {
  async readData() {
    /* ... */
  }
  /* ... */
}
checkMainApiClass(DataApi);
```

(It is not helpful to define the API class within the call to the class checker and then return the class argument, because the remote process must import type to get the type without pulling in runtime code.)

The instance checkers are useful for checking the API instance at the time you use the instance. You can't use them to show your errors alongside the code that has the errors, but when it comes time to add a binding for any API after the first API, you'll see that you used the instance checker for prior APIs and will be reminded to use the instance checker for your next API. Here's how you might use `checkMainApi` when installing a collection of main APIs:

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

If the purpose of type-checking is to eliminate runtime errors that could have been eliminated at compile time, then the instance checkers are a surer way to have confidence that you've done so. Of course, you can use both class checkers and instance checkers to get the benefit of both approaches, perhaps adding the class checkers when the instance checkers indicate type errors.

### Example Repo

The library was developed for the [ut-entomology/spectool](https://github.com/ut-entomology/spectool) repo, where you'll find plenty of code exmplifying how to use it. See the following files and directories:

- [Installing main APIs and binding window APIs to the main window](https://github.com/ut-entomology/spectool/blob/main/src/app_main.ts)
- [Main process global.d.ts providing the main process with access to main APIs](https://github.com/ut-entomology/spectool/blob/main/src/global.d.ts)
- [Backend main API classes](https://github.com/ut-entomology/spectool/tree/main/src/backend/api)
- [Main window binding to main APIs](https://github.com/ut-entomology/spectool/blob/main/src/frontend/lib/main_client.ts)
- [Attaching main APIs to the main window and exposing a window API](https://github.com/ut-entomology/spectool/blob/main/src/frontend/App.svelte)
- [Frontend global.d.ts providing windows with access to main APIs](https://github.com/ut-entomology/spectool/blob/main/src/frontend/global.d.ts)
- [Window API class](https://github.com/ut-entomology/spectool/blob/main/src/frontend/api/app_event_api.svelte)
- [Calls from the main window to main APIs](https://github.com/ut-entomology/spectool/search?q=window.apis)
- [Calls from the main process to the main window APIs](https://github.com/ut-entomology/spectool/blob/main/src/backend/app/app_menu.ts)

## Miscellaneous Notes and Caveats

- In order to keep the library simple, I require that all main API methods be asynchronous. A drawback of doing this is that, if you need to wait on the return value, the API can only be called from within an asynchronous method.
- Being asynchronous, API methods are also prone to the mistake where they are called without using `await`. Unfortunately, that's one problem I couldn't help alleviate.
- Another drawback of this approach is that APIs are only available after waiting for the binding promise to complete. Fortunately, prior to binding, API methods are undefined, so at least you'll get an error message that makes the issue clear.
- It may seem excessive to place main APIs on `window.apis` instead of directly on `window`, but the former is more helpful for code completion. If you put each API on `window` directly, not only do you increase the risk of name conflicts, but on VS Code, after typing `window.` you'll be staring at a long list of window properties, not just the APIs. On the other hand, typing `window.apis.` on VS Code will show you all the available APIs, providing a handy reference.
- The library installs its own internal APIs on `window._affinity_ipc`, and it sends and receives IPCs over channels `_affinity_api_request` and `_affinity_api_response`.

## Reference

### import from 'electron-affinity/main'

See also [the library common to '/main' and '/window'](#import-from-electron-affinitymain-or-electron-affinitywindow).

#### type ElectronMainApi<T>

```ts
/**
 * Type that main API classes must implement. It requires each API method
 * to return a promise. All properties of the method not beginning with `_`
 * or `#` will be exposed as API methods. All properties beginning with `_` or
 * `#` are ignored, which allows the API class to have internal structure on
 * which the APIs rely.
 *
 * @param <T> The type of the API class itself, typically inferred from a
 *    function that accepts an argument of type `ElectronMainApi`.
 */
type ElectronMainApi<T> = {
  [K in keyof T]: K extends PublicProperty<K>
    ? (...args: any[]) => Promise<any>
    : any;
}
```

#### type WindowApiBinding<T>

```ts
/**
 * Type to which a bound window API conforms within the main process, as
 * determined from the provided window API class. This type only exposes the
 * methods of the class not starting with `_` or `#`, and regardless of what
 * the method returns, the API returns void.
 *
 * @param <T> Type of the window API class
 */
type WindowApiBinding<T> = {
  [K in Extract<keyof T, PublicProperty<keyof T>>]: T[K] extends (
    ...args: infer A
  ) => any
    ? (...args: A) => void
    : never;
}
```

#### function bindWindowApi()

```ts
/**
 * Returns a main-side binding for a window API of a given class, restricting
 * the binding to the given window. Failure of the window to expose the API
 * before timeout results in an exception. There is a default timeout, but
 * you can override it with `setIpcBindingTimeout()`. (The function takes no
 * restorer parameter because window APIs do not return values.)
 *
 * @param <T> Type of the window API class to bind
 * @param window Window to which to bind the window API
 * @param apiClassName Name of the class being bound. Must be identical to
 *    the name of class T. Provides runtime information that <T> does not.
 * @returns An API of type T that can be called as if T were local to the
 *    main process.
 * @see setIpcBindingTimeout
 */
function bindWindowApi<T>(
  window: BrowserWindow,
  apiClassName: string
): Promise<WindowApiBinding<T>>
```

#### function checkMainApi()

```ts
/**
 * Type checks the argument to ensure it conforms to the expectaions of a
 * main API (which is an instance of the API class). All properties not
 * beginning with `_` or `#` must be methods returning promises and will be
 * interpreted as API methods. Returns the argument to allow type-checking
 * of APIs in their exact place of use.
 *
 * @param <T> (inferred type, not specified in call)
 * @param api Instance of the main API class to type check
 * @return The provided main API
 * @see checkMainApiClass
 */
function checkMainApi<T extends ElectronMainApi<T>>(api: T)
```

#### function checkMainApiClass()

```ts
/**
 * Type checks the argument to ensure it conforms to the expectations of a
 * main API class. All properties not beginning with `_` or `#` must be
 * methods returning promises and will be interpreted as API methods. Useful
 * for getting type-checking in the same file as the one having the API class.
 * (Does not return the class, because the returned class would not be
 * available for `import type`.)
 *
 * @param <T> (inferred type, not specified in call)
 * @param _class The main API class to type check
 * @see checkMainApi
 */
function checkMainApiClass<T extends ElectronMainApi<T>>(_class: {
  new (...args: any[]): T;
}): void {}
```

#### function exposeMainApi()

```ts
/**
 * Exposes a main API to all windows for possible binding.
 *
 * @param <T> (inferred type, not specified in call)
 * @param mainApi The API to expose to all windows, which must be an
 *    instance of a class conforming to type `ElectronMainApi`
 * @param restorer Optional function for restoring the classes of
 *    arguments passed to APIs from the window. Arguments not
 *    restored to original classes arrive as untyped objects.
 */
function exposeMainApi<T>(
  mainApi: ElectronMainApi<T>,
  restorer?: RestorerFunction
): void
```

#### class RelayedError

```ts
/**
 * Class that wraps exceptions occurring in a main API that are to be
 * relayed as errors back to the calling window. A main API wishing to
 * have an exception thrown in the calling window wraps the error object
 * in an instance of this class and throws the instance. The main process
 * will ignore the throw except for transferring it to the calling window.
 * Exceptions thrown within a main API not wrapped in `RelayedError` are
 * thrown within the main process as "uncaught" exceptions.
 *
 * @param errorToRelay The error to throw within the calling window,
 *    occurring within the window's call to the main API
 */
export class RelayedError {
  constructor(errorToRelay: any);
}
```

### import from 'electron-affinity/window'

See also [the library common to '/main' and '/window'](#import-from-electron-affinitymain-or-electron-affinitywindow).

#### type ElectronWindowApi<T>

```ts
/**
 * Type that window API classes must implement. It requires that all
 * properties of the class not beginning with `_` or `#` be functions, which
 * will be exposed as API methods. All properties beginning with `_` or `#`
 * are ignored, which allows the API class to have internal structure on
 * which the APIs rely.
 *
 * @param <T> The type of the API class itself, typically inferred from a
 *    function that accepts an argument of type `ElectronWindowApi`.
 */
type ElectronWindowApi<T> = {
  [K in keyof T]: K extends PublicProperty<K> ? (...args: any[]) => void : any;
}
```

#### type MainApiBinding

```ts
/**
 * Type to which a bound main API conforms within a window, as determined by
 * the provided main API class. The type only exposes the methods of the
 * class not starting with `_` or `#`, and it returns the exact
 * return types of the individual methods, which are necessarily promises.
 *
 * @param <T> Type of the main API class
 */
type MainApiBinding<T> = {
  [K in Extract<keyof T, PublicProperty<keyof T>>]: T[K];
}
```

#### function bindMainApi()

```ts
/**
 * Returns a window-side binding for a main API of a given class. Main must
 * have previously exposed the API. Failure of the main process to expose the
 * API before timeout results in an exception. There is a default timeout, but
 * you can override it with `setIpcBindingTimeout()`.
 *
 * @param <T> Type of the main API class to bind
 * @param apiClassName Name of the class being bound. Must be identical to
 *    the name of class T. Provides runtime information that <T> does not.
 * @param restorer Optional function for restoring the classes of API return
 *    values. Return values not restored arrive as untyped objects.
 * @returns An API of type T that can be called as if T were local to
 *    the window.
 * @see setIpcBindingTimeout
 */
function bindMainApi<T>(
  apiClassName: string,
  restorer?: RestorerFunction
): Promise<MainApiBinding<T>>
```

#### function checkWindowApi()

```ts
/**
 * Type checks the argument to ensure it conforms to the expectaions of a
 * window API (which is an instance of the API class). All properties not
 * beginning with `_` or `#` must be methods and will be interpreted as API
 * methods. Returns the argument to allow type-checking of APIs in their
 * exact place of use.
 *
 * @param <T> (inferred type, not specified in call)
 * @param api Instance of the window API class to type check
 * @return The provided window API
 * @see checkWindowApiClass
 */
function checkWindowApi<T extends ElectronWindowApi<T>>(api: T)
```

#### function checkWindowApiClass()

```ts
/**
 * Type checks the argument to ensure it conforms to the expectations of a
 * window API class. All properties not beginning with `_` or `#` must be
 * methods and will be interpreted as API methods. Useful for getting type-
 * checking in the same file as the one having the API class. (Does not
 * return the class, because this would not be available for `import type`.)
 *
 * @param <T> (inferred type, not specified in call)
 * @param _class The window API class to type check
 * @see checkWindowApi
 */
function checkWindowApiClass<T extends ElectronWindowApi<T>>(_class: {
  new (...args: any[]): T;
}): void {}
```

#### function exposeWindowApi()

```ts
/**
 * Exposes a window API to the main process for possible binding.
 *
 * @param <T> (inferred type, not specified in call)
 * @param windowApi The API to expose to the main process, which must be
 *    an instance of a class conforming to type `ElectronWindowApi`
 * @param restorer Optional function for restoring the classes of
 *    arguments passed to APIs from the main process. Arguments not
 *    restored to original classes arrive as untyped objects.
 */
function exposeWindowApi<T>(
  windowApi: ElectronWindowApi<T>,
  restorer?: RestorerFunction
): void
```

### import from 'electron-affinity/main' or 'electron-affinity/window'

#### type AwaitedType<F>

```ts
/**
 * Utility type for providing the value to which an asynchronous function
 * resolves. That is, if a function F returns Promise<R>, then AwaitedType<T>
 * evaluates to type R. Use for extracting the types of bound APIs.
 *
 * @param <F> Function for which to determine the resolving type.
 */
type AwaitedType<F> = F extends (...args: any[]) => Promise<infer R>
  ? R
  : never
```

#### type RestorableClass<C>

```ts
/**
 * Type of a class that can be called to restore class values. It defines
 * the static class method `restoreClass`, which takes the unstructured
 * object received via IPC and returns an instance of class C. Use for
 * creating generic restorer functions, as explained in the documentation.
 *
 * @param <C> The class that conforms to this type.
 */
type RestorableClass<C> = {
  // static method of the class returning an instance of the class
  restoreClass(obj: Record<string, any>): C;
}
```

#### type RestorerFunction

```ts
/**
 * Type for a function that restores the classes of arguments and return
 * values. This function is optionally the last parameter passed when
 * exposing a main API, binding to a main API, or exposing a window API.
 * The function need not restore the class of a provided object, in which
 * case it returns the provided object.
 *
 * @param className The name of the class at the time its instance was
 *    transferred via IPC
 * @param obj The unstructured object to which the class instance was
 *    converted for transmission via IPC
 * @return Either the provided object `obj` if it was not converted into
 *    a class instance, or an instance of class `className` sourced from
 *    the data in `obj`
 */
type RestorerFunction = (className: string, obj: Record<string, any>) => any
```

#### function genericRestorer()

```ts
/**
 * A generic implementation of a restorer function, which becomes an instance
 * of `RestorerFunction` when bound to a map of restorable classes (each
 * conforming to type `RestorableClass`). See the example in the docs.
 *
 * @param restorableClassMap An object whose properties map the names of
 *    restorable classes to the restorable classes themselves
 * @param className The name of the class at the time its instance was
 *    transferred via IPC
 * @param obj The unstructured object to which the class instance was
 *    converted for transmission via IPC
 * @return An instance of a class in `restorableClassMap` if `className` is in
 *    this map, sourced from the provided `obj`, or the provided `obj` itself
 *    if `className` is not in `restorableClassMap`
 */
function genericRestorer(
  restorableClassMap: Record<string, RestorableClass<any>>,
  className: string,
  obj: Record<string, any>
): any
```

#### function setIpcBindingTimeout()

```ts
/**
 * Sets the binding timeout. This is the maximum time allowed for the main
 * process to bind to any window API and the maximum time allowed for a
 * window to bind to a main API. Also applies to any bindings in progress.
 *
 * @param millis Duration of timeout in milliseconds
 */
function setIpcBindingTimeout(millis: number): void
```

### import 'electron-affinity/preload'

This is the JavaScript to preload into each window in order to enable the window to support IPC. Either include the following line in your `preload.js`:

```ts
import "electron-ipc-methods/preload";
```

... or preload directly from `node_modules` using the appropriate path:

```ts
const window = new BrowserWindow({
  webPreferences: {
    preload: path.join(
      __dirname,
      "../node_modules/electron-affinity/preload.js"
    ),
    nodeIntegration: false,
    contextIsolation: true,
  },
});
```
