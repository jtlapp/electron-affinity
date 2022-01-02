import * as path from "path";
import * as assert from "assert";
import { exec } from "child_process";

const EXEC_TIMEOUT_MILLIS = 4000;
const test = it;

const rootPath = path.join(__dirname, "../../");
const mochaPath = path.join(rootPath, "node_modules/.bin/electron-mocha");
const testScript = path.join(rootPath, "build/test/_test_main_timeout.js");
const command = `node ${mochaPath} ${testScript} --timeout 8000`;

describe("window does not bind to main API", () => {
  test("main times out", (done) => {
    const timer = setTimeout(
      () => assert.fail("Timed out waiting on child process"),
      EXEC_TIMEOUT_MILLIS
    );

    // I was unable to override the uncaught exception in electron-mocha,
    // neither via process.removeAllListeners() + process.on() nor via
    // process.prependOnceListener(), so I test the output of electron-mocha.

    exec(command, (err, stdout, _stderr) => {
      clearTimeout(timer);
      if (err) {
        if (stdout.includes("Timed out waiting for bound IPC API 'MainApi1'")) {
          done();
        } else {
          done(err);
        }
      } else {
        assert.fail("Child process unexpectedly completed");
      }
    });
  });
});
