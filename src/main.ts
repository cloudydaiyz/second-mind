import { buildSecondMindMenu } from "./utils";

function onOpen() {
  buildSecondMindMenu().addToUi();
}

Object.assign(globalThis, { onOpen });