/**
 * Updates all CURRENT_* date placeholders in the Google Doc.
 *
 * Placeholders:
 *
 * {{CURRENT_WEEK}}
 * {{CURRENT_SUNDAY}}
 * {{CURRENT_MONDAY}}
 * {{CURRENT_TUESDAY}}
 * {{CURRENT_WEDNESDAY}}
 * {{CURRENT_THURSDAY}}
 * {{CURRENT_FRIDAY}}
 * {{CURRENT_SATURDAY}}
 *
 * Examples:
 *
 * {{CURRENT_WEEK}}
 * -> Week of 8/9/26 - 8/15/26
 *
 * {{CURRENT_MONDAY}}
 * -> Monday, August 10th, 2026 (8/10/2026)
 */

function updateCurrentWeekDates() {
  const doc = DocumentApp.getActiveDocument();
  const body = doc.getBody();

  const today = new Date();

  // JavaScript:
  // Sunday = 0
  // Monday = 1
  // ...
  // Saturday = 6
  const todayDay = today.getDay();

  // Find Sunday of the current week.
  const sunday = new Date(today);
  sunday.setDate(today.getDate() - todayDay);

  // Find Saturday of the current week.
  const saturday = new Date(sunday);
  saturday.setDate(sunday.getDate() + 6);

  const dayNames = [
    'SUNDAY',
    'MONDAY',
    'TUESDAY',
    'WEDNESDAY',
    'THURSDAY',
    'FRIDAY',
    'SATURDAY'
  ];

  // ------------------------------------------
  // Update {{CURRENT_WEEK}}
  // ------------------------------------------

  const weekText =
    `Week of ${formatShortDate(sunday)} - ${formatShortDate(saturday)}`;

  body.replaceText(
    '\\{\\{CURRENT_WEEK\\}\\}',
    weekText
  );

  // ------------------------------------------
  // Update all seven days
  // ------------------------------------------

  for (let i = 0; i < 7; i++) {
    const date = new Date(sunday);
    date.setDate(sunday.getDate() + i);

    const placeholder =
      `\\{\\{CURRENT_${dayNames[i]}\\}\\}`;

    const formattedDate = formatDate(date);

    body.replaceText(
      placeholder,
      formattedDate
    );
  }

  doc.saveAndClose();
}


/**
 * Formats a date as:
 *
 * Monday, August 17th, 2026 (8/17/2026)
 */
function formatDate(date) {
  const dayNames = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday'
  ];

  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December'
  ];

  const dayName = dayNames[date.getDay()];
  const monthName = monthNames[date.getMonth()];
  const day = date.getDate();
  const year = date.getFullYear();

  const ordinal = getOrdinal(day);

  return `${dayName}, ${monthName} ${day}${ordinal}, ${year} (${date.getMonth() + 1}/${day}/${year})`;
}


/**
 * Formats a date as:
 *
 * 8/9/26
 */
function formatShortDate(date) {
  const month = date.getMonth() + 1;
  const day = date.getDate();

  // Get the last two digits of the year.
  const year = date.getFullYear().toString().slice(-2);

  return `${month}/${day}/${year}`;
}


/**
 * Returns the correct ordinal suffix:
 *
 * 1st
 * 2nd
 * 3rd
 * 4th
 * ...
 * 11th
 * 12th
 * 13th
 */
function getOrdinal(day) {
  if (day >= 11 && day <= 13) {
    return 'th';
  }

  switch (day % 10) {
    case 1:
      return 'st';

    case 2:
      return 'nd';

    case 3:
      return 'rd';

    default:
      return 'th';
  }
}


/**
 * Adds a custom menu to the Google Doc.
 */
function onOpen() {
  DocumentApp.getUi()
    .createMenu('Dates')
    .addItem('Update Current Week', 'updateCurrentWeekDates')
    .addToUi();
}