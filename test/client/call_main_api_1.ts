import { bindMainApi } from "../../src/window";
import type { MainApi1 } from "../api/main_api_1";
import { Catter, restorer } from "../lib/shared_util";
import { testInvoke } from "../lib/renderer_util";

export async function callMainApi1(winTag: string) {
  winTag = winTag + " ";

  const mainApi1 = await bindMainApi<MainApi1>("MainApi1", restorer);

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
  // await testInvoke(winTag + "send/receive Date (api1)", () => {
  //   return mainApi1.sendReceiveDate(new Date("January 1, 2021"));
  // });
  await testInvoke(winTag + "structured error (api1)", () => {
    return mainApi1.throwFSError();
  });
  await testInvoke(winTag + "custom error (api1)", () => {
    return mainApi1.throwCustomError("bad thing", 99);
  });
  await testInvoke(winTag + "string error (api1)", () => {
    return mainApi1.throwStringError();
  });
  await testInvoke(winTag + "no-message error (api1)", () => {
    return mainApi1.throwNoMessageError();
  });
  await testInvoke(winTag + "non-error object error (api1)", () => {
    return mainApi1.throwNonErrorObject();
  });
  await testInvoke(winTag + "non-restored custom error (api1)", () => {
    return mainApi1.throwNonRestoredCustomError();
  });
}
