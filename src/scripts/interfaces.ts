import * as $ from 'jquery';
import { Moment } from 'moment';

export interface IOptions {
  start?: Moment;
  selectedPeriod?: string;
  element?: JQuery;
  periods?: IPeriod[];
  items?: IItem[];
  sections?: ISection[];
  appendWeekDaysClasses?: boolean;
  minRowHeight?: number;
  maxHeight?: number;
  showCurrentTime?: boolean;
  lowerFormat?: string;
  text?: {
    noElementsToDisplay?: string;
    gotoButtonTitle?: string;
    gotoButton?: string;
    todayButtonTitle?: string;
    todayButton?: string;
    prevButtonTitle?: string;
    prevButton?: string;
    nextButtonTitle?: string;
    nextButton?: string;
  };
  headerFormat?: string;
  showGoto?: boolean;
  showToday?: boolean;
  getSections?: (callback: (sections: ISection[]) => void) => void;
  getSchedule?: (callback: (items: IItem[]) => void, start: Moment, end: Moment) => void;
  events?: {
    itemClicked?: Function;
    itemMouseEnter?: Function;
    itemMouseLeave?: Function;
    itemMovement?: Function;
    itemMovementStart?: Function;
    itemMovementEnd?: Function;
    itemDragged?: Function;
    itemDropped?: Function;
    itemEventClicked?: Function;
    itemEventMouseEnter?: Function;
    itemEventMouseLeave?: Function;
    itemResized?: Function;
  };
  allowDragging?: boolean;
  allowResizing?: boolean;
  disableOnMove?: boolean;
}

export interface IPeriod {
  name: string;
  label: string;
  timeframePeriod: number;
  timeframeOverall: number;
  timeframeHeaders: string[];
  classes: string;
}

export interface ISection {
  id: number;
  name: string;
  container?: JQuery;
  row?: JQuery;
}

export interface IHashes {
  [key: string]: string;
}

export interface IItem {
  id: number;
  name: string;
  sectionId: number;
  start: Moment;
  end: Moment;
  classes: string;
  events?: IEvent[];
  element?: JQuery;
}

export interface IEvent {
  icon?: string;
  label: string;
  at: Moment;
  classes: string;
}
