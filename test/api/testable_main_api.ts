import { ResultCollector } from "../lib/main_util";

export abstract class TestableMainApi {
  _collector: ResultCollector;

  constructor(collector: ResultCollector) {
    this._collector = collector;
  }

  _setRequestData(...args: any[]) {
    this._collector.setRequestData(args);
  }
}
