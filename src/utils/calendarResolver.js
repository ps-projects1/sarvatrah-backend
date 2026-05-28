const { RRule } = require("rrule");

const weekdayMap = {
  mo: RRule.MO,
  tu: RRule.TU,
  we: RRule.WE,
  th: RRule.TH,
  fr: RRule.FR,
  sa: RRule.SA,
  su: RRule.SU,
};

const buildRule = (rruleData) => {
  if (!rruleData?.freq) {
    return null;
  }

  const freqMap = {
    daily: RRule.DAILY,
    weekly: RRule.WEEKLY,
    monthly: RRule.MONTHLY,
  };

  return new RRule({
    freq: freqMap[rruleData.freq],

    interval:
      rruleData.interval || 1,

    byweekday:
      rruleData.byweekday?.map(
        (d) => weekdayMap[d]
      ) || [],

    dtstart: new Date(
      rruleData.dtstart
    ),

    until: rruleData.until
      ? new Date(
          rruleData.until
        )
      : undefined,
  });
};

const formatDate = (date) => {
  return new Date(date)
    .toISOString()
    .split("T")[0];
};

const resolveCalendarRange = async (
  events,
  totalDays = 365
) => {

  const startDate = new Date();

  const endDate = new Date();

  endDate.setDate(
    endDate.getDate() + totalDays
  );

  const resolvedMap = {};

  // INITIALIZE DATES
  for (
    let d = new Date(startDate);
    d <= endDate;
    d.setDate(d.getDate() + 1)
  ) {

    const key = formatDate(d);

    resolvedMap[key] = {
      available: true,

      blackout: false,

      price: null,

      events: [],
    };
  }

  for (const event of events) {

    // SPECIFIC DATES
    if (
      event.specificDates?.length
    ) {

      for (const date of event.specificDates) {

        const key =
          formatDate(date);

        if (resolvedMap[key]) {

          applyEvent(
            resolvedMap[key],
            event
          );
        }
      }
    }

    // RRULE EVENTS
    if (event.rrule?.freq) {

      const rule = buildRule(
        event.rrule
      );

      if (rule) {

        const occurrences =
          rule.between(
            startDate,
            endDate,
            true
          );

        for (const occ of occurrences) {

          const key =
            formatDate(occ);

          if (resolvedMap[key]) {

            applyEvent(
              resolvedMap[key],
              event
            );
          }
        }
      }
    }

    // WEEKEND SUPPORT
    if (event.includeWeekends) {

      for (
        let d = new Date(startDate);
        d <= endDate;
        d.setDate(d.getDate() + 1)
      ) {

        const day = d.getDay();

        if (day === 0 || day === 6) {

          const key =
            formatDate(d);

          applyEvent(
            resolvedMap[key],
            event
          );
        }
      }
    }
  }

  return resolvedMap;
};

const applyEvent = (
  dayData,
  event
) => {

  dayData.events.push({
    id: event._id,

    type: event.eventType,

    title: event.title,
  });

  if (event.isBlackout) {

    dayData.blackout = true;

    dayData.available = false;
  }

  if (
    event.isAvailable === false
  ) {

    dayData.available = false;
  }

  if (
    event.priceOverride?.enabled
  ) {

    dayData.price =
      event.priceOverride.amount;
  }
};

module.exports = {
  resolveCalendarRange,
};