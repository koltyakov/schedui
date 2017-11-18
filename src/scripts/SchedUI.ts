import * as $ from 'jquery';
import 'jqueryui';
import * as moment from 'moment';
// tslint:disable-next-line:no-duplicate-imports
import { Moment } from 'moment';

import './../styles/index.scss';

import {
  IOptions, ISection, IHashes,
  IPeriod, IItem, IEvent
} from './interfaces';

export class SchedUI {
  public options: IOptions;

  private handlers: {
    gotoTimeShiftClicked: Function;
    timeShiftClicked: Function;
    periodClicked: Function;
  };
  private wrapper: JQuery = null;
  private headerWrap: JQuery = null;
  private tableWrap: JQuery = null;
  private contentHeaderWrap: JQuery = null;
  private contentWrap: JQuery = null;
  private tableHeader: JQuery = null;
  private tableContent: JQuery = null;
  private sectionWrap: JQuery = null;
  private table: JQuery = null;

  private sections: {
    [key: number]: ISection;
  } = {};
  private cachedSectionResult: ISection[] = null;
  private cachedScheduleResult: IItem[] = null;
  private override: boolean;
  private showCurrentTimeHandle: number;

  constructor (options?: IOptions) {
    this.options = {
      ...{
        getSections: (callback) => {
          callback(this.options.sections);
        },
        getSchedule: (callback, start, end) => {
          callback(this.options.items);
        },
        start: moment(),
        headerFormat: 'Do MMM YYYY',
        lowerFormat: 'DD-MMM-YYYY HH:mm',
        periods: [
          {
            name: '2 days',
            label: '2 days',
            timeframePeriod: 120,
            timeframeOverall: 2880,
            timeframeHeaders: ['Do MMM', 'HH'],
            classes: 'time-sch-period-2day'
          },
          {
            name: '2 weeks',
            label: '2 weeks',
            timeframePeriod: 1440,
            timeframeOverall: 20160,
            timeframeHeaders: ['MMM', 'Do'],
            classes: 'time-sch-period-2week'
          }
        ],
        selectedPeriod: '2 weeks',
        element: $('<div></div>'),
        minRowHeight: 40,
        showCurrentTime: true,
        showGoto: true,
        showToday: true,
        allowDragging: false,
        allowResizing: false,
        disableOnMove: true,
        maxHeight: null,
        appendWeekDaysClasses: true
      },
      ...(options || {}),
      text: {
        ...{
          nextButton: 'Next',
          nextButtonTitle: 'Next period',
          prevButton: 'Prev',
          prevButtonTitle: 'Previous period',
          todayButton: 'Today',
          todayButtonTitle: 'Go to today',
          gotoButton: 'Go to',
          gotoButtonTitle: 'Go to specific date',
          noElementsToDisplay: 'No elements to display'
        },
        ...((options || { text: {} }).text || {})
      },
      events: {
        ...((options || { events: {} }).events || {})
      }
    };
  }

  /* Initializes the Timeline Scheduler with the given opts. If omitted, defaults are used. */
  /* This should be used to recreate the scheduler with new defaults or refill items */
  public init = (overrideCache: boolean): void => {
    let hashObj = this.getUrlHash();
    this.setupPrototypes();
    this.options.start = moment(hashObj['start'] || this.options.start || moment().startOf('day'));
    this.options.selectedPeriod = hashObj['period'] || this.options.selectedPeriod;

    this.options.element.find('.ui-draggable').draggable('destroy');
    this.options.element.empty();
    this.wrapper = $(document.createElement('div'))
      .addClass('time-sch-wrapper')
      .appendTo(this.options.element);
    this.headerWrap = $(document.createElement('div'))
      .addClass('time-sch-header-wrapper time-sch-clearfix')
      .appendTo(this.wrapper);
    this.tableWrap = $(document.createElement('div'))
      .addClass('time-sch-table-wrapper')
      .appendTo(this.wrapper);
    this.createCalendar();
    this.fillSections(overrideCache);
  }

  public reload = (overrideCache: boolean): void => {
    if (typeof this.options.getSections === 'function') {
      this.init(overrideCache);
      this.options.getSections(sections => {
        this.cachedSectionResult = sections;
        this.init(overrideCache);
      });
    } else {
      this.init(overrideCache);
    }
  }

  private setupPrototypes = () => {
    moment.fn['tsAdd'] = function (input, val) {
      let dur: moment.Duration;
      // switch args to support add('s', 1) and add(1, 's')
      if (typeof input === 'string') {
        dur = moment.duration(+val, input as any);
      } else {
        dur = moment.duration(input, val);
      }
      this.tsAddOrSubtractDurationFromMoment(this, dur, 1);
      return this;
    };
    moment.fn['tsSubtract'] = function (input, val) {
      let dur: moment.Duration;
      // switch args to support subtract('s', 1) and subtract(1, 's')
      if (typeof input === 'string') {
        dur = moment.duration(+val, input as any);
      } else {
        dur = moment.duration(input, val);
      }
      this.tsAddOrSubtractDurationFromMoment(this, dur, -1);
      return this;
    };
    // Replace the AddOrSubtract function so that zoning is not taken into account at all
    moment.fn['tsAddOrSubtractDurationFromMoment'] = (mom, duration, isAdding) => {
      let ms = duration._milliseconds;
      let d = duration._days;
      let M = duration._months;
      let currentDate;
      if (ms) {
        mom.milliseconds(mom.milliseconds() + ms * isAdding);
      }
      if (d) {
        mom.date(mom.date() + d * isAdding);
      }
      if (M) {
        currentDate = mom.date();
        mom
          .date(1)
          .month(mom.month() + M * isAdding)
          .date(Math.min(currentDate, mom.daysInMonth()));
      }
    };
  }

  private setUrlHash = (key: string, value: string): void => {
    let hashArr: string[] = [];
    let hashObj: IHashes = this.getUrlHash();

    hashObj[decodeURIComponent(key)] = decodeURIComponent(value);
    for (let prop in hashObj) {
      if (hashObj.hasOwnProperty(prop)) {
        hashArr.push(`${encodeURIComponent(prop)}=${encodeURIComponent(hashObj[prop])}`);
      }
    }
    window.location.hash = `#${hashArr.join('&')}`;
  }

  private getUrlHash = (): IHashes => {
    return window.location.hash
      .replace('#', '')
      .split('&')
      .reduce((res, d) => {
        let pair = d.split('=');
        res[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
        return res;
      }, {});
  }

  private getSelectedPeriod = (): IPeriod => {
    let period: IPeriod;
    for (let i = 0; i < this.options.periods.length; i += 1) {
      if (this.options.periods[i].name === this.options.selectedPeriod) {
        period = this.options.periods[i];
        break;
      }
    }
    if (!period) {
      period = this.options.periods[0];
      this.selectPeriod(period.name);
    }
    return period;
  }

  private getEndOfPeriod = (start: Moment, period: IPeriod): Moment => {
    return moment(start)['tsAdd']('minutes', period.timeframeOverall);
  }

  private addHeaderClasses = (td: JQuery, columnCount: number, specificHeader: number): void => {
    let trs: JQuery;
    let trArray: JQuery[];
    let tr: JQuery;
    let tdArray: JQuery[];
    let foundTD: JQuery;
    let prevIndex: number;
    let nextIndex: number;
    let colspan: number;
    let complete: boolean;
    let isEven: boolean;
    trs = this.tableHeader.find('tr');
    if (specificHeader !== undefined) {
      trs = $(trs.get(specificHeader));
    }
    if (trs.length && trs.length > 0) {
      trArray = $.makeArray(trs);
      for (let trCount = 0; trCount < trArray.length; trCount += 1) {
        complete = false;
        nextIndex = 0;
        tr = $(trArray[trCount]);
        tdArray = $.makeArray(tr.find('.time-sch-date-header'));
        for (let tdCount = 0; tdCount < tdArray.length && !complete; tdCount += 1) {
          foundTD = $(tdArray[tdCount]);
          colspan = Number(foundTD.attr('colspan'));
          if (colspan && !isNaN(colspan) && colspan > 0) {
            prevIndex = nextIndex ? nextIndex : 0;
            nextIndex = prevIndex + colspan;
          } else {
            prevIndex = nextIndex ? nextIndex : 0;
            nextIndex = prevIndex + 1;
          }
          if (prevIndex === columnCount) {
            td.addClass(`time-sch-header-${trCount}-date-start`);
          }
          if (nextIndex - 1 === columnCount) {
            td.addClass(`time-sch-header-${trCount}-date-end`);
          }
          if (prevIndex <= columnCount && columnCount < nextIndex) {
            complete = true;
            isEven = tdCount % 2 === 0;
            td
              .addClass(`time-sch-header-${trCount}-date-column-${tdCount}`)
              .addClass(`time-sch-header-${trCount}-date-${(isEven ? 'even' : 'odd')}`);
            if (foundTD.hasClass(`time-sch-header-${trCount}-current-time`)) {
              td.addClass(`time-sch-header-${trCount}-current-time`);
            }
          }
        }
      }
    }
  }

  private createCalendar = (): void => {
    let tr: JQuery;
    let td: JQuery;
    let header: string;
    let minuteDiff: number;
    let splits: number;
    let period: IPeriod;
    let end: Moment;
    let thisTime: Moment;
    let prevDate: Moment;
    let fThisTime: string;
    let fPrevDate: string;
    let colspan: number = 0;
    let currentTimeIndex: number;
    colspan = 0;
    period = this.getSelectedPeriod();
    end = this.getEndOfPeriod(this.options.start, period);
    minuteDiff = Math.abs(this.options.start.diff(end, 'minutes'));
    splits = minuteDiff / period.timeframePeriod;
    this.contentHeaderWrap = $(document.createElement('div'))
      .addClass('time-sch-content-header-wrap')
      .appendTo(this.tableWrap);
    this.contentWrap = $(document.createElement('div'))
      .addClass('time-sch-content-wrap')
      .appendTo(this.tableWrap);
    this.tableHeader = $(document.createElement('table'))
      .addClass('time-sch-table time-sch-table-header')
      .appendTo(this.contentHeaderWrap);
    this.tableContent = $(document.createElement('table'))
      .addClass('time-sch-table time-sch-table-content')
      .appendTo(this.contentWrap);
    this.sectionWrap = $(document.createElement('div'))
      .addClass('time-sch-section-wrapper')
      .appendTo(this.contentWrap);
    if (period.classes) {
      this.tableWrap.toggleClass(period.classes, true);
    }
    for (let headerCount = 0; headerCount < period.timeframeHeaders.length; headerCount += 1) {
      prevDate = null;
      fPrevDate = null;
      let isEven: boolean = true;
      colspan = 0;
      currentTimeIndex = 0;
      header = period.timeframeHeaders[headerCount];

      tr = $(document.createElement('tr'))
        .addClass(`time-sch-times time-sch-times-header-${headerCount}`)
        .appendTo(this.tableHeader);
      td = $(document.createElement('td'))
        .addClass('time-sch-section time-sch-section-header')
        .appendTo(tr);

      for (let i = 0; i < splits; i += 1) {
        thisTime = moment(this.options.start)['tsAdd']('minutes', i * period.timeframePeriod);

        // console.log(thisTime.day());

        fThisTime = thisTime.format(header);
        if (fPrevDate !== fThisTime) {
          // If there is no prevDate, it's the Section Header
          if (prevDate) {
            td.attr('colspan', colspan);
            colspan = 0;
            if (moment() >= prevDate && moment() < thisTime) {
              td.addClass('time-sch-header-' + headerCount + '-current-time');
            }
          }
          prevDate = thisTime;
          fPrevDate = fThisTime;

          td = $(document.createElement('td'))
            .data('header-row', headerCount)
            .data('column-count', i)
            .data('column-is-even', isEven)
            .addClass('time-sch-date time-sch-date-header')
            .append(fThisTime)
            .appendTo(tr);

          td
            .addClass(`time-sch-header-${headerCount}-date-start`)
            .addClass(`time-sch-header-${headerCount}-date-end`)
            .addClass(`time-sch-header-${headerCount}-date-column-${currentTimeIndex}`)
            .addClass(`time-sch-header-${headerCount}-date-${(currentTimeIndex % 2 === 0 ? 'even' : 'odd')}`);

          if (this.options.appendWeekDaysClasses) {
            if (period.timeframePeriod <= 1440) {
              if (headerCount > 0) {
                td.addClass(`week-day-${thisTime.day()}`);
              }
            }
          }

          for (let prevHeader = 0; prevHeader < headerCount; prevHeader += 1) {
            this.addHeaderClasses(td, i, prevHeader);
          }
          currentTimeIndex += 1;
        }
        colspan += 1;
      }
      td.attr('colspan', colspan);
    }
    this.fillHeader();
  }

  private createSections = (sections: ISection[]): void => {
    let timeCount: number;
    let tr: JQuery;
    let td: JQuery;
    let sectionContainer: JQuery;
    let headers: string[];
    let i: number;
    timeCount = 1;
    headers = $.makeArray(this.tableHeader.find('tr'));
    for (i = 0; i < headers.length; i += 1) {
      if (timeCount < $(headers[i]).find('.time-sch-date-header').length) {
        timeCount = $(headers[i]).find('.time-sch-date-header').length;
      }
    }
    for (i = 0; i < sections.length; i += 1) {
      tr = $(document.createElement('tr'))
        .addClass('time-sch-section-row')
        .addClass(i % 2 === 0 ? 'time-sch-section-even' : 'time-sch-section-odd')
        .css('height', this.options.minRowHeight)
        .appendTo(this.tableContent);
      sectionContainer = $(document.createElement('div'))
        .addClass('time-sch-section-container')
        .css('height', this.options.minRowHeight)
        .data('section', sections[i])
        .appendTo(this.sectionWrap);
      td = $(document.createElement('td'))
        .addClass('time-sch-section time-sch-section-content')
        .data('section', sections[i])
        .append(sections[i].name)
        .appendTo(tr);
      for (let time = 0; time < timeCount; time += 1) {
        td = $(document.createElement('td'))
          .addClass('time-sch-date time-sch-date-content')
          .appendTo(tr);
        this.addHeaderClasses(td, time, null);
      }

      this.sections[sections[i].id] = {
        row: tr,
        container: sectionContainer
      } as any; // ???

      // Fill in weekends
      if (this.options.appendWeekDaysClasses) {
        $('.time-sch-content-header-wrap > table tr.time-sch-times-header-1 > td').each((i, d) => {
          let tdClass = $(d).attr('class');
          let weekDayIndx = tdClass.indexOf('week-day-');
          if (weekDayIndx !== -1) {
            $(`.time-sch-content-wrap > table tr > td:nth-child(${(i + 1)})`)
              .addClass(tdClass.substring(weekDayIndx, weekDayIndx + 10));
          }
        });
      }
      // Fill in weekends
    }
    this.sectionWrap.css({
      left: this.options.element.find('.time-sch-section').outerWidth()
    });
    if (this.options.showCurrentTime) {
      this.showCurrentTime();
    }
  }

  private showCurrentTime = (): void => {
    let currentTime: Moment;
    let currentTimeElem: JQuery;
    let minuteDiff: number;
    let currentDiff: number;
    let end: Moment;
    // Stop any other timeouts happening
    if (this.showCurrentTimeHandle) {
      clearTimeout(this.showCurrentTimeHandle);
    }
    currentTime = moment();
    end = this.getEndOfPeriod(this.options.start,this.getSelectedPeriod());
    minuteDiff = Math.abs(this.options.start.diff(end, 'minutes'));
    currentDiff = Math.abs(this.options.start.diff(currentTime, 'minutes'));
    currentTimeElem = this.options.element.find('.time-sch-current-time');
    currentTimeElem.remove();
    if (currentTime >= this.options.start && currentTime <= end) {
      currentTimeElem = $(document.createElement('div'))
        .addClass('time-sch-current-time')
        .css('left', currentDiff / minuteDiff * 100 + '%')
        .attr('title', currentTime.format(this.options.lowerFormat))
        .appendTo(this.sectionWrap);
    }
    // Since we're only comparing minutes, we may as well only check once every 30 seconds
    this.showCurrentTimeHandle = setTimeout(this.showCurrentTime, 30000);
  }

  private createItems = (items: IItem[]): void => {
    let item: IItem;
    let event: IEvent;
    let section: ISection;
    let itemElem: JQuery;
    let eventElem: JQuery;
    let itemContent: JQuery;
    let itemName: string;
    let itemIcon: string;
    let minuteDiff: number;
    let splits: number;
    let itemDiff: number;
    let itemSelfDiff: number;
    let eventDiff: number;
    let calcTop: number;
    let calcLeft: number;
    let calcWidth: number;
    let foundStart: Moment;
    let foundEnd: Moment;
    let inSection: any = {};
    let foundPos: number;
    let elem: IItem;
    let prevElem: IItem;
    let needsNewRow;
    let period: IPeriod;
    let end: Moment;
    let i: number;
    period = this.getSelectedPeriod();
    end = this.getEndOfPeriod(this.options.start, period);
    minuteDiff = Math.abs(this.options.start.diff(end, 'minutes'));
    for (i = 0; i < items.length; i += 1) {
      item = items[i];
      section = this.sections[item.sectionId];
      if (section) {
        if (!inSection[item.sectionId]) {
          inSection[item.sectionId] = [];
        }
        if (item.start <= end && item.end >= this.options.start) {
          foundPos = null;
          let schedStart: number = this.options.start.toDate().getTime();
          foundStart = moment(Math.max(item.start.toDate().getTime(), schedStart));
          foundEnd = moment(Math.min(item.end.toDate().getTime(), end.toDate().getTime()));
          itemDiff = foundStart.diff(this.options.start, 'minutes');
          itemSelfDiff = Math.abs(foundStart.diff(foundEnd, 'minutes'));
          calcTop = 0;
          calcLeft = itemDiff / minuteDiff * 100;
          calcWidth = itemSelfDiff / minuteDiff * 100;
          itemElem = $(document.createElement('div'))
            .addClass(`time-sch-item ${(item.classes ? item.classes : '')}`)
            .css({
              top: calcTop,
              left: calcLeft + '%',
              width: calcWidth + '%'
            })
            .appendTo(section.container);
          itemContent = $(document.createElement('div'))
            .addClass('time-sch-item-content')
            .appendTo(itemElem);
          if (item.name) {
            $(document.createElement('div'))
              .append(item.name)
              .appendTo(itemContent);
          }
          if (item.events) {
            for (let ev = 0; ev < item.events.length; ev += 1) {
              event = item.events[ev];
              eventDiff =
                event.at.diff(foundStart, 'minutes') / itemSelfDiff * 100;
              $(document.createElement('div'))
                .addClass(`time-sch-item-event ${(event.classes ? event.classes : '')}`)
                .css('left', eventDiff + '%')
                .attr('title', `${event.at.format(this.options.lowerFormat)} - ${event.label}`)
                .data('event', event)
                .appendTo(itemContent);
            }
          }
          if (item.start >= this.options.start) {
            $(document.createElement('div'))
              .addClass('time-sch-item-start')
              .appendTo(itemContent);
          }
          if (item.end <= end) {
            $(document.createElement('div'))
              .addClass('time-sch-item-end')
              .appendTo(itemContent);
          }
          item.element = itemElem;
          // Place this in the current section array in its sorted position
          for (let pos = 0; pos < inSection[item.sectionId].length; pos += 1) {
            if (inSection[item.sectionId][pos].start > item.start) {
              foundPos = pos;
              break;
            }
          }
          if (foundPos === null) {
            foundPos = inSection[item.sectionId].length;
          }
          inSection[item.sectionId].splice(foundPos, 0, item);
          itemElem.data('item', item);
          this.setupItemEvents(itemElem);
        }
      }
    }
    // Sort out layout issues so no elements overlap
    for (let prop in inSection) {
      section = this.sections[prop];
      for (i = 0; i < inSection[prop].length; i += 1) {
        let elemTop: number;
        let elemBottom: number;
        elem = inSection[prop][i];
        // If we're passed the first item in the row
        for (let prev = 0; prev < i; prev += 1) {
          let prevElemTop: number;
          let prevElemBottom: number ;
          prevElem = inSection[prop][prev];
          prevElemTop = prevElem.element.position().top;
          prevElemBottom = prevElemTop + prevElem.element.outerHeight();
          elemTop = elem.element.position().top;
          elemBottom = elemTop + elem.element.outerHeight();
          // (elem.start must be between prevElem.start and prevElem.end OR
          //  elem.end must be between prevElem.start and prevElem.end) AND
          // (elem.top must be between prevElem.top and prevElem.bottom OR
          //  elem.bottom must be between prevElem.top and prevElem.bottom)
          needsNewRow =
            ((prevElem.start <= elem.start && elem.start <= prevElem.end) ||
              (prevElem.start <= elem.end && elem.end <= prevElem.end)) &&
            ((prevElemTop <= elemTop && elemTop <= prevElemBottom) ||
              (prevElemTop <= elemBottom && elemBottom <= prevElemBottom));
          if (needsNewRow) {
            elem.element.css('top', prevElemBottom + 1);
          }
        }
        elemBottom =
          elem.element.position().top + elem.element.outerHeight() + 1;
        if (elemBottom > section.container.height()) {
          section.container.css('height', elemBottom);
          section.row.css('height', elemBottom);
        }
      }
    }
  }

  private setupItemEvents = (itemElem: JQuery): void => {
    let _self: SchedUI = this;
    if (this.options.events.itemClicked) {
      itemElem.click(function (event) {
        event.preventDefault();
        _self.options.events.itemClicked.call(_self, $(this).data('item'));
      });
    }
    if (this.options.events.itemMouseEnter) {
      itemElem.mouseenter(function (event) {
        _self.options.events.itemMouseEnter.call(_self, $(this).data('item'));
      });
    }
    if (this.options.events.itemMouseLeave) {
      itemElem.mouseleave(function (event) {
        _self.options.events.itemMouseLeave.call(_self, $(this).data('item'));
      });
    }
    if (this.options.allowDragging) {
      itemElem.draggable({
        helper: 'clone',
        zIndex: 1,
        appendTo: _self.sectionWrap,
        distance: 5,
        snap: '.time-sch-section-container',
        snapMode: 'inner',
        snapTolerance: 10,
        drag: function (event, ui) {
          let item: IItem;
          let start: Moment;
          let end: Moment;
          let period: IPeriod;
          let periodEnd: Moment;
          let minuteDiff: number;
          if (_self.options.events.itemMovement) {
            period = _self.getSelectedPeriod();
            periodEnd = _self.getEndOfPeriod(_self.options.start, period);
            minuteDiff = Math.abs(
              _self.options.start.diff(periodEnd, 'minutes')
            );
            item = $(event.target).data('item');
            start = moment(_self.options.start)['tsAdd'](
              'minutes',
              minuteDiff *
                (ui.helper.position().left / _self.sectionWrap.width())
            );
            end = moment(start)['tsAdd'](
              'minutes',
              Math.abs(item.start.diff(item.end, 'minutes'))
            );
            // If the start is before the start of our calendar, add the offset
            if (item.start < _self.options.start) {
              start['tsAdd'](
                'minutes',
                item.start.diff(_self.options.start, 'minutes')
              );
              end['tsAdd'](
                'minutes',
                item.start.diff(_self.options.start, 'minutes')
              );
            }
            _self.options.events.itemMovement.call(_self, item, start, end);
          }
        },
        start: function (event, ui) {
          $(this).hide();
          // We only want content to show, not events or resizers
          ui.helper
            .children()
            .not('.time-sch-item-content')
            .remove();
          if (_self.options.events.itemMovementStart) {
            _self.options.events.itemMovementStart.call((_self));
          }
        },
        stop: function (event, ui) {
          if ($(this).length) {
            $(this).show();
          }
          if (_self.options.events.itemMovementEnd) {
            _self.options.events.itemMovementEnd.call((_self));
          }
        },
        cancel: '.time-sch-item-end, .time-sch-item-start, .time-sch-item-event'
      });
      $('.time-sch-section-container').droppable({
        greedy: true,
        hoverClass: 'time-sch-droppable-hover',
        tolerance: 'pointer',
        drop: function (event, ui) {
          let item: IItem;
          let sectionId: string;
          let start: Moment;
          let end: Moment;
          let period: IPeriod;
          let periodEnd: Moment;
          let minuteDiff: number;
          period = _self.getSelectedPeriod();
          periodEnd = _self.getEndOfPeriod(_self.options.start, period);
          minuteDiff = Math.abs(
            _self.options.start.diff(periodEnd, 'minutes')
          );
          item = ui.draggable.data('item');
          sectionId = $(this).data('section').id;
          start = moment(_self.options.start)['tsAdd'](
            'minutes',
            minuteDiff * (ui.helper.position().left / $(this).width())
          );
          end = moment(start)['tsAdd'](
            'minutes',
            Math.abs(item.start.diff(item.end, 'minutes'))
          );
          // If the start is before the start of our calendar, add the offset
          if (item.start < _self.options.start) {
            start['tsAdd']('minutes', item.start.diff(_self.options.start, 'minutes'));
            end['tsAdd']('minutes', item.start.diff(_self.options.start, 'minutes'));
          }
          // Append original to this section and reposition it while we wait
          ui.draggable.appendTo($(this));
          ui.draggable.css({
            left: ui.helper.position().left - $(this).position().left,
            top: ui.helper.position().top - $(this).position().top
          });
          if (_self.options.disableOnMove) {
            if (ui.draggable.data('uiDraggable')) {
              ui.draggable.draggable('disable');
            }
            if (ui.draggable.data('uiResizable')) {
              ui.draggable.resizable('disable');
            }
          }
          ui.draggable.show();
          if (_self.options.events.itemDropped) {
            // Time for a hack, JQueryUI throws an error if the draggable is removed in a drop
            setTimeout(() => {
              _self.options.events.itemDropped.call(_self, item, sectionId, start, end);
            }, 0);
          }
        }
      });
    }
    if (this.options.allowResizing) {
      let foundHandles = null;
      if (itemElem.find('.time-sch-item-start').length && itemElem.find('.time-sch-item-end').length) {
        foundHandles = 'e, w';
      } else if (itemElem.find('.time-sch-item-start').length) {
        foundHandles = 'w';
      } else if (itemElem.find('.time-sch-item-end').length) {
        foundHandles = 'e';
      }
      if (foundHandles) {
        itemElem.resizable({
          handles: foundHandles,
          resize: function (event, ui) {
            let item: IItem;
            let start: Moment;
            let end: Moment;
            let period: IPeriod;
            let periodEnd: Moment;
            let minuteDiff: number;
            if (_self.options.events.itemMovement) {
              period = _self.getSelectedPeriod();
              periodEnd = _self.getEndOfPeriod(_self.options.start, period);
              minuteDiff = Math.abs(_self.options.start.diff(periodEnd, 'minutes'));
              item = $(this).data('item');
              if (ui.position.left !== ui.originalPosition.left) {
                // Left handle moved
                start = moment(_self.options.start)['tsAdd'](
                  'minutes',
                  minuteDiff *
                    ($(this).position().left / _self.sectionWrap.width())
                );
                end = item.end;
              } else {
                // Right handle moved
                start = item.start;
                end = moment(_self.options.start)['tsAdd'](
                  'minutes',
                  minuteDiff *
                    (($(this).position().left + $(this).width()) /
                    _self.sectionWrap.width())
                );
              }
              _self.options.events.itemMovement.call(_self, item, start, end);
            }
          },
          start: function (event, ui) {
            // We don't want any events to show
            $(this)
              .find('.time-sch-item-event')
              .hide();
            if (_self.options.events.itemMovementStart) {
              _self.options.events.itemMovementStart.call(_self);
            }
          },
          stop: function (event, ui) {
            let item: IItem;
            let start: Moment;
            let end: Moment;
            let period: IPeriod;
            let periodEnd: Moment;
            let minuteDiff: number;
            let section: ISection;
            let $this;
            $this = $(this);
            period = _self.getSelectedPeriod();
            periodEnd = _self.getEndOfPeriod(_self.options.start, period);
            minuteDiff = Math.abs(
              _self.options.start.diff(periodEnd, 'minutes')
            );
            item = $this.data('item');
            if (ui.position.left !== ui.originalPosition.left) {
              // Left handle moved
              start = moment(_self.options.start)['tsAdd'](
                'minutes',
                minuteDiff *
                  ($this.position().left / _self.sectionWrap.width())
              );
              end = item.end;
            } else {
              // Right handle moved
              start = item.start;
              end = moment(_self.options.start)['tsAdd'](
                'minutes',
                minuteDiff *
                  (($this.position().left + $this.width()) /
                  _self.sectionWrap.width())
              );
            }
            if (_self.options.disableOnMove) {
              if ($this.data('uiDraggable')) {
                $this.draggable('disable');
              }
              if ($this.data('uiResizable')) {
                $this.resizable('disable');
              }
              $this.find('.time-sch-item-event').show();
            }
            if (_self.options.events.itemMovementEnd) {
              _self.options.events.itemMovementEnd.call(_self);
            }
            if (_self.options.events.itemResized) {
              _self.options.events.itemResized.call(_self, item, start, end);
            }
          }
        });
      }
    }
    if (this.options.events.itemEventClicked) {
      itemElem.find('.time-sch-item-event').click(function (event) {
        let itemElem = $(this).closest('.time-sch-item');
        event.preventDefault();
        _self.options.events.itemEventClicked.call(
          _self, $(this).data('event'), itemElem.data('item')
        );
      });
    }
    if (this.options.events.itemEventMouseEnter) {
      itemElem.find('.time-sch-item-event').mouseenter(function (event) {
        let itemElem = $(this).closest('.time-sch-item');
        event.preventDefault();
        _self.options.events.itemEventMouseEnter.call(
          _self, $(this).data('event'), itemElem.data('item')
        );
      });
    }
    if (this.options.events.itemEventMouseLeave) {
      itemElem.find('.time-sch-item-event').mouseleave(function (event) {
        let itemElem = $(this).closest('.time-sch-item');
        event.preventDefault();
        // _self.options.events.itemEventClicked.call(this, $(this).data('event'), itemElem.data('item'));
        _self.options.events.itemEventMouseLeave.call(
          _self, $(this).data('event'), itemElem.data('item')
        );
      });
    }
  }

  /* Call this with "true" as override, and sections will be reloaded. Otherwise, cached sections will be used */
  private fillSections = (override: boolean) => {
    if (!this.cachedSectionResult || override) {
      this.options.getSections.call(this, this.fillSectionsCallback);
    } else {
      this.fillSectionsCallback(this.cachedSectionResult);
    }
  }

  private fillSectionsCallback = (sections: ISection[]): void => {
    this.cachedSectionResult = sections;
    this.createSections(sections);
    this.fillSchedule();

    if ($('.time-sch-content-wrap > .time-sch-table-content > tbody > tr').length === 0) {
      $('.time-sch-content-wrap').after(`<div class="no-elements">
        ${this.options.text.noElementsToDisplay}
      </div>`);
    } else {
      $('.no-elements').remove();
    }
  }

  private fillSchedule = (): void => {
    let period: IPeriod;
    let end: Moment;
    period = this.getSelectedPeriod();
    end = this.getEndOfPeriod(this.options.start, period);
    this.options.getSchedule.call(this, this.fillScheduleCallback, this.options.start, end);
  }

  private fillScheduleCallback = (items: IItem[]): void => {
    this.cachedScheduleResult = items;
    this.createItems(items);
    // Fix rows height
    $('.time-sch-content-wrap > table > tbody > tr').each((i, d) => {
      $(`div.time-sch-section-wrapper > div.time-sch-section-container:nth-child(${(i + 1)})`)
        .attr('style', `height: ${$(d).height()}px;`);
    });
    // Fix rows height
  }

  private fillHeader = (): void => {
    let durationString: string;
    let title: JQuery;
    let periodContainer: JQuery;
    let timeContainer: JQuery;
    let periodButton: JQuery;
    let timeButton: JQuery;
    let selectedPeriod: IPeriod;
    let end: Moment;
    let period: IPeriod;
    periodContainer = $(document.createElement('div')).addClass('time-sch-period-container');
    timeContainer = $(document.createElement('div')).addClass('time-sch-time-container');
    title = $(document.createElement('div')).addClass('time-sch-title');
    this.headerWrap.empty().append(periodContainer, timeContainer, title);
    selectedPeriod = this.getSelectedPeriod();
    end = this.getEndOfPeriod(this.options.start, selectedPeriod);
    // Header needs a title
    // We take away 1 minute
    title.text(
      this.options.start.format(this.options.headerFormat) + ' - ' +
      end['tsAdd']('minutes', -1).format(this.options.headerFormat)
    );
    for (let i = 0; i < this.options.periods.length; i += 1) {
      period = this.options.periods[i];
      $(document.createElement('a'))
        .addClass('time-sch-period-button time-sch-button')
        .addClass(period.name === selectedPeriod.name ? 'time-sch-selected-button' : '')
        .attr('href', '#')
        .append(period.label)
        .data('period', period)
        .click(this.getHandlers().periodClicked)
        .appendTo(periodContainer);
    }
    if (this.options.showGoto) {
      $(document.createElement('a'))
        .addClass('time-sch-time-button time-sch-time-button-goto time-sch-button')
        .attr({
          href: '#',
          title: this.options.text.gotoButtonTitle
        })
        .append(this.options.text.gotoButton)
        .click(this.getHandlers().gotoTimeShiftClicked)
        .appendTo(timeContainer);
    }
    if (this.options.showToday) {
      $(document.createElement('a'))
        .addClass('time-sch-time-button time-sch-time-button-today time-sch-button')
        .attr({
          href: '#',
          title: this.options.text.todayButtonTitle
        })
        .append(this.options.text.todayButton)
        .click(this.getHandlers().timeShiftClicked)
        .appendTo(timeContainer);
    }
    $(document.createElement('a'))
      .addClass('time-sch-time-button time-sch-time-button-prev time-sch-button')
      .attr({
        href: '#',
        title: this.options.text.prevButtonTitle
      })
      .append(this.options.text.prevButton)
      .click(this.getHandlers().timeShiftClicked)
      .appendTo(timeContainer);
    $(document.createElement('a'))
      .addClass('time-sch-time-button time-sch-time-button-next time-sch-button')
      .attr({
        href: '#',
        title: this.options.text.nextButtonTitle
      })
      .append(this.options.text.nextButton)
      .click(this.getHandlers().timeShiftClicked)
      .appendTo(timeContainer);
  }

  private getHandlers = () => {
    let _self: SchedUI = this;
    return this.handlers || {
      gotoTimeShiftClicked: function (event) {
        event.preventDefault();
        $(document.createElement('input'))
          .attr('type', 'text')
          .css({
            position: 'absolute',
            left: 0,
            bottom: 0
          })
          .appendTo($(this))
          .datepicker({
            onClose: function () {
              $(this).remove();
            },
            onSelect: function (date) {
              _self.options.start = moment(date);
              _self.setUrlHash('start', _self.options.start.toISOString());
              if (typeof _self.options.getSections === 'function') {
                _self.reload(_self.override);
              } else {
                _self.init(_self.override);
              }
            },
            defaultDate: _self.options.start.toDate()
          })
          .datepicker('show')
          .hide();
      },
      timeShiftClicked: function (event) {
        let period;
        event.preventDefault();
        period = _self.getSelectedPeriod();
        if ($(this).is('.time-sch-time-button-today')) {
          _self.options.start = moment().startOf('day');
        } else if ($(this).is('.time-sch-time-button-prev')) {
          _self.options.start['tsAdd']('minutes', period.timeframeOverall * -1);
        } else if ($(this).is('.time-sch-time-button-next')) {
          _self.options.start['tsAdd']('minutes', period.timeframeOverall);
        }
        _self.setUrlHash('start', _self.options.start.toISOString());
        if (typeof _self.options.getSections === 'function') {
          _self.reload(_self.override);
        } else {
          _self.init(_self.override);
        }
      },
      periodClicked: function (event) {
        event.preventDefault();
        _self.selectPeriod($(this).data('period').name);
      }
    };
  }

  /* Selects the period with the given name */
  private selectPeriod = (name: string) => {
    this.options.selectedPeriod = name;
    this.setUrlHash('period', this.options.selectedPeriod);
    if (typeof this.options.getSections === 'function') {
      this.reload(this.override);
    } else {
      this.init(this.override);
    }
  }

}
