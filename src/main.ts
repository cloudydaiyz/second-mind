import { addWeekDatesToDoc } from "./week-dates";

/**
 * Adds a custom menu to the Google Doc.
 */
function onOpen() {
  const ui = DocumentApp.getUi();
  addWeekDatesToDoc(ui);
}

Object.assign(globalThis, {
  onOpen
});