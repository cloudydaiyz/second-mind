// From https://github.com/cloudydaiyz/second-mind/issues/1
// Will delete before PR gets merged
function sample() {
  // Google Apps Script Example
  const body = DocumentApp.getActiveDocument().getBody();

  // Grab the paragraph element you want to move
  const paragraph = body.getParagraphs()[0];

  // Detach it from its current structural location
  paragraph!.removeFromParent();

  // Insert it cleanly as an unbroken block lower down in the DOM
  body.insertParagraph(2, paragraph!);
}

function moveToBookmark(
  srcBookmark: GoogleAppsScript.Document.Bookmark,
  dstBookmark: GoogleAppsScript.Document.Bookmark
) {

}

function moveTodayToNextBookmark() {
  const scriptProperties = PropertiesService.getScriptProperties();
  const todayId = scriptProperties.getProperty("todayId");
  if (!todayId) {
    console.error("Unable to perform action: todayId script property is not configured.");
    return;
  }

  const doc = DocumentApp.getActiveDocument();
  const documentTab = doc.getActiveTab().asDocumentTab();

  const today = documentTab.getBookmark(todayId);
  const allBookmarks = documentTab.getBookmarks();
  let nextBookmark: GoogleAppsScript.Document.Bookmark | undefined = undefined;
  for (let i = 0; i < allBookmarks.length - 1; i++) {
    const currentBookmark = allBookmarks[i]!;
    if (currentBookmark.getId() == today.getId()) {
      nextBookmark = allBookmarks[i + 1]!;
      break;
    }
  }

  if (!nextBookmark) {
    console.error("Unable to perform action: next bookmark not found");
    return;
  }
  moveToBookmark(today, nextBookmark);
}

function moveTodayToCustomBookmark() {
  const ui = DocumentApp.getUi();

  const selectCustomBookmarkPrompt = "Enter the bookmark ID. "
    + "You can find it in the link to the bookmark.";
  const customBookmarkId = ui.prompt(selectCustomBookmarkPrompt).getResponseText();
  console.log(`The user said: ${customBookmarkId}`);

  const scriptProperties = PropertiesService.getScriptProperties();
  const todayId = scriptProperties.getProperty("todayId");
  if (!todayId) {
    console.error("Unable to perform action: todayId script property is not configured.");
    return;
  }

  const doc = DocumentApp.getActiveDocument();
  const documentTab = doc.getActiveTab().asDocumentTab();

  const today = documentTab.getBookmark(todayId);
  const customBookmark = documentTab.getBookmark(customBookmarkId);
  moveToBookmark(today, customBookmark);
}

Object.assign(globalThis, {
  moveTodayToNextBookmark,
  moveTodayToCustomBookmark,
});

export function getTodayMenu(ui: GoogleAppsScript.Base.Ui) {
  return ui.createMenu('Today')
    .addItem('Replace next bookmark', 'moveTodayToNextBookmark')
    .addItem('Replace custom bookmark', 'moveTodayToCustomBookmark')
}