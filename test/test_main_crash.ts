/**
 * Test scenarious that should cause Electron to crash with an exception.
 */

import * as path from "path";
import * as assert from "assert";
import { exec } from "child_process";

const EXEC_TIMEOUT_MILLIS = 8000;
const test = it;

const rootPath = path.join(__dirname, "../../");
const mochaPath = path.join(rootPath, "node_modules/.bin/electron-mocha");

describe("when main should crash with an error", () => {
  test("main times out waiting to bind to first window (default timeout)", (done) => {
    verifyCrash(
      "main_win1_timeout1",
      "Main timed out waiting to bind to window API 'WinApi1'",
      done
    );
  });

  test("main times out waiting to bind to first window (custom timeout)", (done) => {
    verifyCrash(
      "main_win1_timeout2",
      "Main timed out waiting to bind to window API 'WinApi1'",
      done
    );
  });

  test("main times out waiting to bind to second window with same API", (done) => {
    verifyCrash(
      "main_win2_timeout",
      "Main timed out waiting to bind to window API 'WinApi1'",
      done
    );
  });

  test("main throws when calling API of a window that closed", (done) => {
    verifyCrash("main_window_closed", "Window has closed", done);
  });

  test("main throws when API throws an non-relayed error", (done) => {
    verifyCrash("main_nonrelayed_error", "Expected crash", done);
  });
});

function verifyCrash(
  scriptName: string,
  expectedErrorText: string,
  done: Mocha.Done
): void {
  // I was unable to override the uncaught exception in electron-mocha,
  // neither via process.removeAllListeners() + process.on() nor via
  // process.prependOnceListener(), so I test the output of electron-mocha.

  const timer = setTimeout(
    () => assert.fail("Timed out waiting on child process"),
    EXEC_TIMEOUT_MILLIS
  );
  const scriptPath = path.join(
    rootPath,
    "build/test/main-scripts",
    scriptName + ".js"
  );
  const command = `node ${mochaPath} ${scriptPath} --timeout 8000`;
  exec(command, (err, stdout, stderr) => {
    clearTimeout(timer);
    if (
      stdout.includes(expectedErrorText) ||
      stderr.includes(expectedErrorText)
    ) {
      done();
    } else if (err) {
      done(Error(err + "..." + stdout));
    } else {
      assert.fail("Child process unexpectedly completed..." + stdout);
    }
  });
}
