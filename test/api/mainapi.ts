import { ElectronMainApi } from "../../src/main";
import { ResultCollector } from "../lib/main_util";

export abstract class MainApi implements ElectronMainApi<MainApi> {
  // use 'private' designator to make sure it can be used
  private _collector: ResultCollector;

  constructor(collector: ResultCollector) {
    this._collector = collector;
  }

  // Convenience method that also happens to test invoking APIs of
  // ancestor classes of the API class and returning a provied object.
  // (Returning certain provided objects failed some early tests.)
  async echoBack(data: any): Promise<any> {
    this._setRequestData(data);
    return data;
  }

  // private, but don't designate with TypeScript, so that compilation
  // guarantees that the 'private' designator is not required.
  _setRequestData(...args: any[]) {
    this._collector.setRequestData(args);
  }
}
