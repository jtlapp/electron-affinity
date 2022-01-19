import { ipcMain, BrowserWindow } from "electron";
import * as path from "path";
import * as fs from "fs";

import { Restorer, RestorerFunction } from "../../src/restorer";
import { setIpcErrorLogger } from "../../src/server_ipc";

const COMPLETION_CHECK_INTERVAL_MILLIS = 100;
const TEST_TIMEOUT_MILLIS = 5000;

export async function createWindow(): Promise<BrowserWindow> {
  const window = new BrowserWindow({
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "../../src/preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  await window.loadFile(path.join(__dirname, "../client/dummy.html"));
  return window;
}

export class Result {
  testName = "unknown";
  requestData: any;
  replyData: any;
  error: any = null;
  verified = false;
}

export class ResultCollector {
  currentResult = new Result();
  results: Result[] = [];
  abortError: any = null;
  completedAll = false;

  waitForResults(): Promise<void> {
    const self = this;
    const _waitForResults = (
      time: number,
      resolve: () => void,
      reject: (error: any) => void
    ) => {
      setTimeout(() => {
        time += COMPLETION_CHECK_INTERVAL_MILLIS;
        if (self.abortError !== null) {
          reject(self.abortError);
        } else if (self.completedAll) {
          resolve();
        } else if (time >= TEST_TIMEOUT_MILLIS) {
          reject(Error(`Timed out waiting for results`));
        } else {
          _waitForResults(time, resolve, reject);
        }
      }, COMPLETION_CHECK_INTERVAL_MILLIS);
    };

    return new Promise((resolve, reject) =>
      _waitForResults(0, resolve, reject)
    );
  }

  reset() {
    this.currentResult = new Result();
    this.results = [];
    this.abortError = null;
    this.completedAll = false;
  }

  async runScripFiletInWindow(window: BrowserWindow, scriptName: string) {
    this.reset();
    const scriptPath = path.join(
      __dirname,
      "../../test/bundle",
      scriptName + ".js"
    );
    const script = fs.readFileSync(scriptPath, { encoding: "utf-8" });
    await window.webContents.executeJavaScript(script);
  }

  setRequestData(data: any) {
    this.currentResult.requestData = data;
  }

  verifyTest(testName: string, assertFunc: (result: Result) => void): void {
    for (const result of this.results) {
      if (result.testName == testName) {
        assertFunc(result);
        result.verified = true;
        return;
      }
    }
    throw Error(
      `No result found for test '${testName}' among ${this.results.length} tests`
    );
  }

  verifyAllDone(): void {
    let testNumber = 0;
    for (const result of this.results) {
      ++testNumber;
      if (!result.verified) {
        throw Error(
          `Failed to verify test #${testNumber} '${result.testName}'`
        );
      }
    }
  }
}

// Only one result collector for each Electron instance.
let resultCollector: ResultCollector;

export function createResultCollector(restorer: RestorerFunction) {
  if (resultCollector !== undefined) {
    throw Error("Only call createResultCollector() once");
  }
  resultCollector = new ResultCollector();

  ipcMain.on("started_test", (_event, testName: string) => {
    resultCollector.currentResult.testName = testName;
  });
  ipcMain.on("request_data", (_event, data: any) => {
    resultCollector.currentResult.requestData = Restorer.restoreValue(
      data,
      restorer
    );
  });
  ipcMain.on("reply_data", (_event, data: any) => {
    resultCollector.currentResult.replyData = Restorer.restoreValue(
      data,
      restorer
    );
  });
  ipcMain.on("completed_test", (_event, error: any) => {
    resultCollector.currentResult.error = null;
    if (error) {
      resultCollector.currentResult.error = Restorer.restoreThrownError(
        error,
        restorer
      );
    }
    resultCollector.results.push(resultCollector.currentResult);
    resultCollector.currentResult = new Result();
  });
  ipcMain.on("completed_all", () => {
    resultCollector.completedAll = true;
  });
  ipcMain.on("test_aborted", (_event, error: any) => {
    resultCollector.abortError = error;
  });

  return resultCollector;
}

export function dumpMainApiErrors() {
  setIpcErrorLogger((err) => console.log("\n(MAIN API ERROR) " + err.stack));
}
