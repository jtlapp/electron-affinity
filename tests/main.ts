import { ipcMain, BrowserWindow } from "electron";
import { join } from "path";

const COMPLETION_CHECK_INTERVAL_MILLIS = 100;
const TEST_TIMEOUT_MILLIS = 5000;

export async function createWindow(): Promise<BrowserWindow> {
  const window = new BrowserWindow({
    show: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  await window.loadFile(join(__dirname, "dummy.html"));
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
  private currentResult = new Result();
  private results: Result[] = [];
  private abortError: any = null;
  private completedAll = false;

  constructor() {
    ipcMain.on("startingTest", (_event, testName: string) => {
      this.currentResult.testName = testName;
    });
    ipcMain.on("requestData", (_event, data: any) => {
      this.currentResult.requestData = data;
    });
    ipcMain.on("replyData", (_event, data: any) => {
      this.currentResult.replyData = data;
    });
    ipcMain.on("completedTest", (_event, error: any) => {
      this.currentResult.error = error || null;
      this.results.push(this.currentResult);
      this.currentResult = new Result();
    });
    ipcMain.on("terminate", (_event, error: any) => {
      if (error) {
        this.abortError = error;
      } else {
        this.completedAll = true;
      }
    });
  }

  async collectResults(): Promise<void> {
    const self = this;
    const waitForResult = (
      time: number,
      resolve: () => void,
      reject: (error: any) => void
    ) => {
      setTimeout(() => {
        time += COMPLETION_CHECK_INTERVAL_MILLIS;
        if (self.abortError) {
          reject(self.abortError);
        } else if (self.completedAll) {
          resolve();
        } else if (time >= TEST_TIMEOUT_MILLIS) {
          reject(Error(`Timed out waiting for results`));
        } else {
          waitForResult(time, resolve, reject);
        }
      }, COMPLETION_CHECK_INTERVAL_MILLIS);
    };

    return new Promise((resolve, reject) => waitForResult(0, resolve, reject));
  }

  async runScript(window: BrowserWindow, scriptName: string) {
    this.currentResult = new Result();
    this.results = [];
    this.abortError = null;
    this.completedAll = false;

    const scriptPath = join(
      __dirname,
      "../../build/tests/scripts",
      scriptName + ".js"
    );
    await window.webContents.executeJavaScript(`
      try {
        require('${scriptPath}');
      } catch (err) {
        require('electron').ipcRenderer.send('terminate', err);
      }`);
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

  verifyDone(): void {
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

  destroy() {
    [
      "startingTest",
      "requestData",
      "replyData",
      "completedTest",
      "terminate",
    ].forEach((eventName) => ipcMain.removeAllListeners(eventName));
  }
}
