import "source-map-support/register";

import { exposeMainApi } from "../src";
import { createWindow, createResultCollector } from "./lib/main_util";
import { MainApi1 } from "./api/main_api_1";
import { recoverer, sleep } from "./lib/shared_util";

const DURATION_MILLIS = 5000;

const resultCollector = createResultCollector(recoverer);
const mainApi1 = new MainApi1(resultCollector);

it("waits for main to timeout", async () => {
  const window1 = await createWindow();
  // client never binds to the main API
  exposeMainApi(window1, mainApi1, recoverer);

  await sleep(DURATION_MILLIS);

  if (window1) window1.destroy();
});
