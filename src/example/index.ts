import * as $ from 'jquery';
import * as moment from 'moment';

import { SchedUI, IOptions } from './../scripts';

import './index.scss';

$(() => {

  let today = moment().startOf('day');

  const options: IOptions = {
    periods: [
      {
        name: '3 days',
        label: '3 days',
        timeframePeriod: 60 * 3,
        timeframeOverall: 60 * 24 * 3,
        timeframeHeaders: ['Do MMM', 'HH'],
        classes: 'period-3day'
      },
      {
        name: '1 week',
        label: '1 week',
        timeframePeriod: 60 * 24,
        timeframeOverall: 60 * 24 * 7,
        timeframeHeaders: ['MMM', 'Do'],
        classes: 'period-1week'
      },
      {
        name: '1 month',
        label: '1 month',
        timeframePeriod: 60 * 24 * 1,
        timeframeOverall: 60 * 24 * 28,
        timeframeHeaders: ['MMM', 'Do'],
        classes: 'period-1month'
      }
    ],
    items: [
      {
        id: 20,
        name: '<div>Item 1</div><div>Sub Info</div>',
        sectionId: 1,
        start: moment(today).add('days', -1),
        end: moment(today).add('days', 3),
        classes: 'item-status-three',
        events: [
          {
            label: 'one',
            at: moment(today).add('hours', 6),
            classes: 'item-event-one'
          },
          {
            label: 'two',
            at: moment(today).add('hours', 10),
            classes: 'item-event-two'
          },
          {
            label: 'three',
            at: moment(today).add('hours', 11),
            classes: 'item-event-three'
          }
        ]
      },
      {
        id: 21,
        name: '<div>Item 2</div><div>Sub Info</div>',
        sectionId: 3,
        start: moment(today).add('days', -1),
        end: moment(today).add('days', 3),
        classes: 'item-status-one',
        events: [
          {
            icon: '',
            label: 'one',
            at: moment(today).add('hours', 6),
            classes: 'item-event-one'
          }
        ]
      },
      {
        id: 22,
        name: '<div>Item 3</div>',
        start: moment(today).add('hours', 12),
        end: moment(today)
          .add('days', 3)
          .add('hours', 4),
        sectionId: 1,
        classes: 'item-status-none'
      }
    ],
    sections: [
      {
        id: 1,
        name: 'Section 1'
      },
      {
        id: 2,
        name: 'Section 2'
      },
      {
        id: 3,
        name: 'Section 3'
      }
    ],
    selectedPeriod: '1 week',
    element: $('.calendar'),
    allowDragging: true,
    allowResizing: true,
    maxHeight: 100,
    text: {
      nextButton: '&nbsp;',
      prevButton: '&nbsp;'
    },
    events: {
      itemClicked: function (item) {
        console.log(item);
      },
      itemDragged: function (item, sectionId, start, end) {
        let foundItem;

        console.log(item);
        console.log(sectionId);
        console.log(start);
        console.log(end);

        for (let i = 0; i < this.items.length; i++) {
          foundItem = this.items[i];

          if (foundItem.id === item.id) {
            foundItem.sectionId = sectionId;
            foundItem.start = start;
            foundItem.end = end;

            this.items[i] = foundItem;
          }
        }

        this.init(null);
      },
      itemResized: function (item, start, end) {
        let foundItem;

        console.log(item);
        console.log(start);
        console.log(end);

        for (let i = 0; i < this.items.length; i++) {
          foundItem = this.items[i];

          if (foundItem.id === item.id) {
            foundItem.start = start;
            foundItem.end = end;

            this.items[i] = foundItem;
          }
        }

        this.init(null);
      },
      itemMovement: function (item, start, end) {
        let html = `
          <div>
            <div>
              Start: ${start.format('Do MMM YYYY HH:mm')}
            </div>
            <div>
              End: ${end.format('Do MMM YYYY HH:mm')}
            </div>
          </div>
        `;

        $('.realtime-info')
          .empty()
          .append(html);
      },
      itemMovementStart: function () {
        $('.realtime-info').show();
      },
      itemMovementEnd: function () {
        $('.realtime-info').hide();
      }
    }
  };

  (new SchedUI(options)).init(true);

});
