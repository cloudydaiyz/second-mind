/** 
 * Information for a bookmark at a point in time. 
 * This info may be stale if bookmark is modified after retrieving this object.
 */
interface BookmarkInfo {
  id: string;
  bookmark: GoogleAppsScript.Document.Bookmark;
  element: GoogleAppsScript.Document.Element;
  index: number;
}

/**
 * Moves an arbitrary element to a target child index within a destination container.
 * 
 * @param {GoogleAppsScript.Document.Element} element The element to move.
 * @param {GoogleAppsScript.Document.Body|GoogleAppsScript.Document.TableCell} targetContainer The destination container.
 * @param {number} targetIndex The zero-based child index where the element should be inserted.
 * @return {} The newly inserted element.
 */
function moveElement(
  element: GoogleAppsScript.Document.Element,
  targetContainer: GoogleAppsScript.Document.Body,
  targetIndex: number
): GoogleAppsScript.Document.Element {
  const type = element.getType();
  const parent = element.getParent();

  // Adjust targetIndex if moving downward within the same container
  if (parent && parent.getType() === targetContainer.getType()) {
    const currentIndex = parent.getChildIndex(element);
    if (currentIndex < targetIndex) {
      targetIndex--;
    }
  }

  // Detach the element (or use element.copy() if moving across different documents)
  const detached = element.removeFromParent();
  let inserted;

  switch (type) {
    case DocumentApp.ElementType.PARAGRAPH:
      inserted = targetContainer.insertParagraph(targetIndex, detached.asParagraph());
      break;
    case DocumentApp.ElementType.LIST_ITEM:
      inserted = targetContainer.insertListItem(targetIndex, detached.asListItem());
      break;
    case DocumentApp.ElementType.TABLE:
      inserted = targetContainer.insertTable(targetIndex, detached.asTable());
      break;
    case DocumentApp.ElementType.PAGE_BREAK:
      inserted = targetContainer.insertPageBreak(targetIndex, detached.asPageBreak());
      break;
    case DocumentApp.ElementType.HORIZONTAL_RULE:
      inserted = targetContainer.insertHorizontalRule(targetIndex);
      break;
    case DocumentApp.ElementType.INLINE_IMAGE:
      inserted = targetContainer.insertImage(targetIndex, detached.asInlineImage());
      break;
    default:
      throw new Error("Unsupported element type for direct container insertion: " + type);
  }

  return inserted;
}

/** Move the text at srcBookmark to the text at dstBookmark while preserving the bookmark. */
function moveToBookmark(
  srcBookmark: BookmarkInfo,
  dstBookmark: BookmarkInfo,
) {
  console.log("bookmarks valid");
  console.log(srcBookmark.element.asText().getText());
  const body = DocumentApp.getActiveDocument().getBody();

  let srcIndex = srcBookmark.index;
  const dstIndex = dstBookmark.index - 1;
  dstBookmark.element.removeFromParent();

  while (srcIndex < dstIndex) {
    moveElement(body.getChild(srcIndex + 1), body, srcIndex);
    srcIndex++;
  }
  console.log("bookmark replaced");
}

function moveTodayToNextBookmark() {
  const scriptProperties = PropertiesService.getScriptProperties();
  const todayId = scriptProperties.getProperty("todayId");
  if (!todayId) {
    console.error("Unable to perform action: todayId script property is not configured.");
    return;
  }
  const doc = DocumentApp.getActiveDocument();
  const body = doc.getBody();
  const documentTab = doc.getActiveTab().asDocumentTab();

  const allBookmarks: BookmarkInfo[] = documentTab.getBookmarks().map(bookmark => {
    const element = bookmark.getPosition().getElement();
    return {
      id: bookmark.getId(),
      bookmark,
      element,
      index: body.getChildIndex(element),
    }
  });
  allBookmarks.sort((a, b) => a.index - b.index);
  const today = allBookmarks.find(b => b.id == todayId);
  if (!today) {
    console.error("Unable to perform action: unable to find today's bookmark.");
    return;
  }
  console.log(todayId, allBookmarks.map(b => b.id));

  let nextBookmark: BookmarkInfo | undefined = undefined;
  for (let i = 0; i < allBookmarks.length - 1; i++) {
    console.log(i);
    const currentBookmark = allBookmarks[i]!;
    if (currentBookmark.id == today.id) {
      console.log("bookmark found");
      nextBookmark = allBookmarks[i + 1]!;
      break;
    }
  }

  console.log("nextBookmark:", nextBookmark);
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
  // moveToBookmark(today, customBookmark);
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