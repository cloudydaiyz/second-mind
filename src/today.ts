const DAILY_BOOKMARK_TEXT = "Daily Bookmark";

/** 
 * Information for a elemenet at a point in time. 
 * This info may be stale if elemenet is modified after retrieving this object.
 */
interface ElementInfo {
  id: string;
  element: GoogleAppsScript.Document.Element;
  index: number;
}

function customBookmarkPrompt() {
  const ui = DocumentApp.getUi();
  const selectCustomBookmarkPrompt = "Enter the bookmark ID. "
    + "You can find it in the link to the bookmark.";
  const customBookmarkId = ui.prompt(selectCustomBookmarkPrompt).getResponseText();
  console.log(`The user said: ${customBookmarkId}`);
  return customBookmarkId;
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

/** 
 * Move the text at `srcElement` to the text at `dstElement` while preserving the `srcElement`'s 
 * bookmark, if it has one. 
 */
function moveToElement(
  srcElement: ElementInfo,
  dstElement: ElementInfo,
  replace = false,
) {
  console.log("srcElement text", srcElement.element.asText().getText());
  const body = DocumentApp.getActiveDocument().getBody();

  let srcIndex = srcElement.index;
  let dstIndex = dstElement.index;
  if (replace) {
    if (srcIndex < dstIndex) {
      dstIndex = dstIndex - 1;
    } else if (srcIndex > dstIndex) {
      srcIndex--;
    }
    dstElement.element.removeFromParent();
  }
  console.log('srcIndex', srcIndex, 'dstIndex', dstIndex);

  if (srcIndex < dstIndex) {
    while (srcIndex < dstIndex && srcIndex < body.getNumChildren()) {
      moveElement(body.getChild(srcIndex + 1), body, srcIndex);
      srcIndex++;
    }
  } else {
    const stopIndex = replace ? dstIndex : dstIndex + 1;
    while (srcIndex > stopIndex) {
      moveElement(body.getChild(srcIndex - 1), body, srcIndex + 1);
      srcIndex--;
    }
  }
  console.log("element moved");
}

function getAllBookmarks(
  body: GoogleAppsScript.Document.Body,
  documentTab: GoogleAppsScript.Document.DocumentTab
): ElementInfo[] {
  const allBookmarks: ElementInfo[] = documentTab.getBookmarks().map(bookmark => {
    const element = bookmark.getPosition().getElement();
    return {
      id: bookmark.getId(),
      element,
      index: body.getChildIndex(element),
    }
  });
  allBookmarks.sort((a, b) => a.index - b.index);
  return allBookmarks;
}

function getBookmarkInfoById(id?: string, fromElements?: ElementInfo[]): ElementInfo {
  if (!id) {
    const scriptProperties = PropertiesService.getScriptProperties();
    const todayId = scriptProperties.getProperty("todayId");
    if (!todayId) {
      throw new Error("Unable to perform action: todayId script property is not configured.");
    }
    id = todayId;
  }

  if (!fromElements) {
    const doc = DocumentApp.getActiveDocument();
    const body = doc.getBody();
    const documentTab = doc.getActiveTab().asDocumentTab();
    fromElements = getAllBookmarks(body, documentTab);
  }

  console.log(id, fromElements.map(b => b.id));
  const bookmark = fromElements.find(e => e.id == id);
  if (!bookmark) {
    throw new Error("Unable to perform action: unable to find today's bookmark.");
  }
  return bookmark;
}

// ======== //

function todayToDailyBookmark() {
  const doc = DocumentApp.getActiveDocument();
  const body = doc.getBody();

  const today = getBookmarkInfoById();
  const todayRange = doc.newRange()
    .addElement(today.element)
    .build();
  let searchResult = todayRange.getRangeElements()[0];
  console.log('init searchResult offset', searchResult?.getStartOffset().toString(), searchResult?.getEndOffsetInclusive().toString());

  // Search until the paragraph is found.
  let nextDailyBookmarkEle: GoogleAppsScript.Document.Element | null = null;
  while (
    (searchResult = body.findElement(
      DocumentApp.ElementType.PARAGRAPH,
      searchResult,
    ))) {
    const found = searchResult.getElement().asParagraph();
    if (found.getText() == DAILY_BOOKMARK_TEXT && found.getHeading() !== DocumentApp.ParagraphHeading.NORMAL) {
      nextDailyBookmarkEle = found;
      break;
    }
  }

  if (!nextDailyBookmarkEle) {
    throw new Error("Unable to perform action: unable to find the next daily bookmark.");
  }
  const nextDailyBookmark: ElementInfo = {
    id: "daily-bookmark",
    element: nextDailyBookmarkEle,
    index: body.getChildIndex(nextDailyBookmarkEle),
  }
  console.log(today.index, nextDailyBookmark.index);
  moveToElement(today, nextDailyBookmark);
}

function todayToNextBookmark(replace = false) {
  const doc = DocumentApp.getActiveDocument();
  const body = doc.getBody();
  const documentTab = doc.getActiveTab().asDocumentTab();

  const allBookmarks = getAllBookmarks(body, documentTab);
  const today = getBookmarkInfoById(undefined, allBookmarks);

  let nextBookmark: ElementInfo | null = null;
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
  moveToElement(today, nextBookmark, replace);
}

export function todayToCustomBookmark(customBookmarkId: string, replace = false) {
  const scriptProperties = PropertiesService.getScriptProperties();
  const todayId = scriptProperties.getProperty("todayId");
  if (!todayId) {
    console.error("Unable to perform action: todayId script property is not configured.");
    return;
  }

  const doc = DocumentApp.getActiveDocument();
  const documentTab = doc.getActiveTab().asDocumentTab();
  const body = doc.getBody();
  const fromElements = getAllBookmarks(body, documentTab);

  const today = getBookmarkInfoById(todayId, fromElements);
  const customBookmark = getBookmarkInfoById(customBookmarkId, fromElements);
  moveToElement(today, customBookmark, replace);
}

// ======== //

function moveTodayToNextDailyBookmark() {
  todayToDailyBookmark();
}

function moveTodayToNextBookmark() {
  todayToNextBookmark();
}

function replaceNextBookmarkWithToday() {
  todayToNextBookmark(true);
}

function moveTodayToCustomBookmark() {
  todayToCustomBookmark(customBookmarkPrompt());
}

function replaceCustomBookmarkWithToday() {
  todayToCustomBookmark(customBookmarkPrompt(), true);
}

// ======== //

Object.assign(globalThis, {
  moveTodayToNextDailyBookmark,
  moveTodayToNextBookmark,
  replaceNextBookmarkWithToday,
  moveTodayToCustomBookmark,
  replaceCustomBookmarkWithToday,
});

export function getTodayMenu(ui: GoogleAppsScript.Base.Ui) {
  return ui.createMenu('Today')
    .addItem('Move to next Daily Bookmark', 'moveTodayToNextDailyBookmark')
    .addItem('Move to next bookmark', 'moveTodayToNextBookmark')
    .addItem('Replace next bookmark', 'replaceNextBookmarkWithToday')
    .addItem('Move to custom bookmark', 'moveTodayToCustomBookmark')
    .addItem('Replace custom bookmark', 'moveTodayToCustomBookmark')
}