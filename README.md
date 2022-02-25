# electron-affinity

IPC via simple method calls in Electron

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

## Installation

```
npm install electron-affinity
```

or

```
yarn add electron-affinity
```

## Usage

Electron Affinity supports main APIs and window APIs. Main APIs are defined in main and callable from renderer windows. Window APIs are defined in renderer windows and callable from main. Window-to-window calling is not supported.

### Main APIs

A main API is an instance of a class defined in main. All methods of this class, including ancestor class methods, are treated as IPC methods except for those prefixed with underscore ('\_') or pound ('#'). You can use these prefixes to define private methods and properties on which the IPC methods rely.

Each main API method can take any number of parameters, including none, but must return a promise. The promise need not resolve to a value.

Here is an example defining an API called `DataApi`:

```ts
import { RelayedError } from "electron-affinity/main";

class DataApi {
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

- Nothing about this API definition ties it to Electron or IPC.
- All methods return promises even when they don't need to. This allows all IPC calls to main to use `ipcRenderer.invoke`, keeping Electron Affinity simple.
- Even though `writeData` received `data` via IPC, it exists as an instance of `Data` with the `format` method available.
- The usage of the `private` modifier has no effect on Electon Affinity. Instead, it is the '\_' prefix that prevents members `_dataSource`, `_dataset`, and `_checkforError` from being exposed as IPC methods.
- If the data source encounters an error, `_checkForError` returns the error to the window to be thrown from within the renderer.
- Exceptions thrown by `open()`, `read()`, or `write()` do not get returned to the window and instead cause exceptions within main.

Main makes this API available to windows by calling `exposeMainApi` before the windows attempt to use the API:

```ts
import { exposeMainApi } from "electron-affinity/main";

exposeMainApi(new DataApi(), restorer);
```

`restorer` is an optional function parameter that takes responsibility for restoring the classes of transferred objects. It only restores those classes that the API requires be restored. Scroll down for an explanation of its use.

A window gains access to the API as follows:

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

- The code imports the _type_ `DataApi` rather than the object `DataApi`. This keeps the renderer from pulling in main-side code.
- `bindMainApi()` takes both the type parameter `DataApi` and the string name of the API `"DataApi"`. The names must agree.
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

_WORK IN PROGRESS_

### Restoring Classes

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

## TBD: Other notes to include:

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
