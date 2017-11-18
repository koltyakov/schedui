# SchedUI

> SchedUI is a lite event schedule visualization UI library

![](https://raw.githubusercontent.com/koltyakov/schedui/master/assets/example.jpg)

## Install

```bash
npm install schedui --save
```

### Prerequisites

- Moment
- jQuery
- jQuery UI

## Usage

### TypeScript

```TypeScript
import { SchedUI, IOptions } from 'schedui';

$(() => {

  let today = moment().startOf('day');

  const options: IOptions = {
    periods: [{
      name: '1 week',
      label: '1 week',
      timeframePeriod: 60 * 24,
      timeframeOverall: 60 * 24 * 7,
      timeframeHeaders: ['MMM', 'Do'],
      classes: 'period-1week'
    }, {
      name: '1 month',
      label: '1 month',
      timeframePeriod: 60 * 24 * 1,
      timeframeOverall: 60 * 24 * 28,
      timeframeHeaders: ['MMM', 'Do'],
      classes: 'period-1month'
    }],
    items: [{
      id: 20,
      name: '<div>Item 1</div><div>Sub Info</div>',
      sectionId: 1,
      start: moment(today).add('days', -1),
      end: moment(today).add('days', 3),
      classes: 'item-status-three',
      events: [{
        label: 'one',
        at: moment(today).add('hours', 6),
        classes: 'item-event-one'
      }]
    }, {
      id: 21,
      name: '<div>Item 3</div>',
      start: moment(today).add('hours', 12),
      end: moment(today).add('days', 3).add('hours', 4),
      sectionId: 2,
      classes: 'item-status-none'
    }],
    sections: [
      { id: 1, name: 'Section 1' },
      { id: 2, name: 'Section 2' }
    ],
    selectedPeriod: '1 week',
    element: $('.calendar')
  };

  (new SchedUI(options)).init(true);

});
```

This project is TypeScriptified fork of [TimeScheduler](https://github.com/Zallist/TimeScheduler).