import "source-map-support/register";

import { BrowserWindow } from "electron";

import { exposeMainApi } from "../src";
import { createWindow, createResultCollector } from "./lib/main_util";
import { MainApi1 } from "./api/main_api_1";
import { recoverer } from "./lib/shared_util";

const resultCollector = createResultCollector(recoverer);
const mainApi1 = new MainApi1(resultCollector);

describe("window does not bind to main API", () => {
  let window1: BrowserWindow;

  before(async () => {
    window1 = await createWindow();
    // client never binds to the main API
    exposeMainApi(window1, mainApi1, recoverer);
  });

  it("main times out", async () => {
    await resultCollector.waitForResults();
  });

  after(() => {
    if (window1) window1.destroy();
  });
});
