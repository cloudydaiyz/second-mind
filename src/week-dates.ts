const DAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday'
];

const UPPER_DAY_NAMES = [
  'SUNDAY',
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY'
];

const MONTH_NAMES = [
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

const PREFIX = "CUSTOM";

/**
 * Formats a date as:
 *
 * Monday, August 17th, 2026 (8/17/2026)
 */
function formatDate(date: Date) {
  const dayName = DAY_NAMES[date.getDay()];
  const monthName = MONTH_NAMES[date.getMonth()];
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
function formatShortDate(date: Date) {
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
function getOrdinal(day: number) {
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
 * Updates all `{PREFIX}_*` date placeholders in the Google Doc
 * based on the given reference date (`refDate`).
 * 
 * For example,
 * if `PREFIX = "CURRENT"` and the reference date was 8/11/26.
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
 * {{CURRENT_WEEK}}
 * -> Week of 8/9/26 - 8/15/26
 *
 * {{CURRENT_MONDAY}}
 * -> Monday, August 10th, 2026 (8/10/2026)
 * 
 * etc.
 */
function updateWeekDates(refDate: Date) {
  const doc = DocumentApp.getActiveDocument();
  const body = doc.getBody();

  // JavaScript:
  // Sunday = 0
  // Monday = 1
  // ...
  // Saturday = 6
  const refDay = refDate.getDay();

  // Find Sunday of the current week.
  const sunday = new Date(refDate);
  sunday.setDate(refDate.getDate() - refDay);

  // Find Saturday of the current week.
  const saturday = new Date(sunday);
  saturday.setDate(sunday.getDate() + 6);

  // ------------------------------------------
  // Update {{CURRENT_WEEK}}
  // ------------------------------------------

  const weekText =
    `Week of ${formatShortDate(sunday)} - ${formatShortDate(saturday)}`;

  body.replaceText(
    `\\{\\{${PREFIX}_WEEK\\}\\}`,
    weekText
  );

  // ------------------------------------------
  // Update all seven days
  // ------------------------------------------

  for (let i = 0; i < 7; i++) {
    const weekDate = new Date(sunday);
    weekDate.setDate(sunday.getDate() + i);

    const placeholder =
      `\\{\\{${PREFIX}_${UPPER_DAY_NAMES[i]}\\}\\}`;

    const formattedDate = formatDate(weekDate);
    console.log(`Updated ${placeholder} to ${formattedDate}`);

    body.replaceText(
      placeholder,
      formattedDate
    );
  }

  doc.saveAndClose();
}

export function updateCurrentWeekDates() {
  updateWeekDates(new Date());
}

export function updateUpcomingWeekDates() {
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  updateWeekDates(nextWeek);
}

export function updateCustomWeekDates() {
  const ui = DocumentApp.getUi();
  const selectWeekPrompt = "Enter a date within the week you plan to use. "
    + "For best results use the date time string format (DTSF). "
    + 'e.g. for September 8th, 2026, you can enter "9/8/2026" '
    + "or '2026-09-08' in DTSF."
  const response = ui.prompt(selectWeekPrompt).getResponseText();
  console.log(`The user said: ${response}`);

  const refDate = new Date(response);
  if (isNaN(refDate.getTime())) {
    ui.alert("Invalid date. Unable to perform operation.");
    return;
  }
  updateWeekDates(refDate);
}