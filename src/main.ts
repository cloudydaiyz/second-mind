import {
  updateCurrentWeekDates,
  updateUpcomingWeekDates,
  updateCustomWeekDates,
} from "./week-dates";

/**
 * Adds a custom menu to the Google Doc.
 */
function onOpen() {
  DocumentApp.getUi()
    .createMenu('Dates')
    .addItem('Update Current Week', 'updateCurrentWeekDates')
    .addItem('Update Upcoming Week', 'updateUpcomingWeekDates')
    .addItem('Update Custom Week', 'updateCustomWeekDates')
    .addToUi();
}

Object.assign(globalThis, {
  onOpen,
  updateCurrentWeekDates,
  updateUpcomingWeekDates,
  updateCustomWeekDates,
});
