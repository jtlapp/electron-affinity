import { join } from "path";
import { exec } from "child_process";
import assert from "assert";

const EXEC_TIMEOUT_MILLIS = 4000;
const test = it;

const rootPath = join(__dirname, "../../");
const mochaPath = join(rootPath, "node_modules/.bin/electron-mocha");
const testScript = join(rootPath, "build/test/_test_main_timeout.js");
const command = `node ${mochaPath} ${testScript} --timeout 8000`;

describe("window does not bind to main API", () => {
  test("main times out", (done) => {
    const timer = setTimeout(
      () => assert.fail("Timed out waiting on child process"),
      EXEC_TIMEOUT_MILLIS
    );
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
