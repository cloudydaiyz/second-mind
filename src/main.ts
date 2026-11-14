import { buildSecondMindMenu } from "./utils";

/**
 * Adds a custom menu to the Google Doc.
 */
function onOpen() {
  buildSecondMindMenu().addToUi();
}

Object.assign(globalThis, { onOpen });