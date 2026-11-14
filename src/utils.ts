import { getTodayMenu } from "./today";
import { getWeekTemplateMenu } from "./week-template";

export function buildSecondMindMenu() {
  const ui = DocumentApp.getUi();
  return ui.createMenu("Second Mind")
    .addSubMenu(getWeekTemplateMenu(ui))
    .addSubMenu(getTodayMenu(ui));
}