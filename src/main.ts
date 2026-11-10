import { getTodayMenu } from "./today";
import { getWeekDatesMenu } from "./week-dates";

/**
 * Adds a custom menu to the Google Doc.
 */
function onOpen() {
  const ui = DocumentApp.getUi();
  ui.createMenu("Second Mind")
    .addSubMenu(getWeekDatesMenu(ui))
    .addSubMenu(getTodayMenu(ui))
    .addToUi();
}

Object.assign(globalThis, {
  onOpen
});