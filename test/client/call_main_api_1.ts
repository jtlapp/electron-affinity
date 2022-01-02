import { bindMainApi } from "../../src";
import { MainApi1 } from "../api/main_api_1";
import { Catter, recoverer } from "../lib/shared_util";
import { testInvoke } from "../lib/renderer_util";

export async function callMainApi1(winTag: string) {
  winTag = winTag + " ";

  const mainApi1 = await bindMainApi<MainApi1>("MainApi1", recoverer);

  await testInvoke(winTag + "no reply no error (api1)", () => {
    return mainApi1.noReplyNoError();
  });
  await testInvoke(winTag + "single param (api1)", () => {
    return mainApi1.doubleNumber(21);
  });
  await testInvoke(winTag + "multi param (api1)", () => {
    return mainApi1.sumNumbers(5, 10);
  });
  await testInvoke(winTag + "send class instance (api1)", () => {
    return mainApi1.sendCatter1(new Catter("this", "that"));
  });
  await testInvoke(winTag + "get class instance (api1)", () => {
    return mainApi1.makeCatter1("this", "that");
  });
  await testInvoke(winTag + "all good (api1)", () => {
    return mainApi1.allGoodOrNot1(true);
  });
  await testInvoke(winTag + "plain error (api1)", () => {
    return mainApi1.allGoodOrNot1(false);
  });
  await testInvoke(winTag + "same method (api1)", () => {
    return mainApi1.sameMethodUniqueReply();
  });
  await testInvoke(winTag + "structured error (api1)", () => {
    return mainApi1.throwFSError();
  });
  await testInvoke(winTag + "custom error (api1)", () => {
    return mainApi1.throwCustomError("bad thing", 99);
  });
}
