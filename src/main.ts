import { getTodayMenu } from "./today";
import { getWeekTemplateMenu } from "./week-template";

/**
 * Adds a custom menu to the Google Doc.
 */
function onOpen() {
  const ui = DocumentApp.getUi();
  ui.createMenu("Second Mind")
    .addSubMenu(getWeekTemplateMenu(ui))
    .addSubMenu(getTodayMenu(ui))
    .addToUi();
}

Object.assign(globalThis, {
  onOpen
});