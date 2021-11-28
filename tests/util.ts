import { BrowserWindow } from "electron";
import { join } from "path";

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

export function runScript(window: BrowserWindow, scriptName: string): void {
  const scriptPath = join(
    __dirname,
    "../../build/tests/scripts",
    scriptName + ".js"
  );
  window.webContents.executeJavaScript(`
    try {
      require('${scriptPath}');
    } catch (err) {
      require('electron').ipcRenderer.send('error', err);
    }`);
}
