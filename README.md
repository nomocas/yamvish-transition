# yamvish-transition

Minimalist css transition for yamvish views and containers.

Only fadeIn/fadeOut and slideLeft or slideUp for the moment.

## Use case

Work only on container-rendered template as:
- y.view()
- if(..., trueTempl, falseTempl)
- each(..., itemTempl, emptyTempl)
- switch(..., { value:caseTemplate }
- ...

Any of those templates are rendered as yamvish Container and then mounted at needed place (core behaviour).
Transitions are automatically fired on 'mounted' event and `beforeUnmount`.

Take a look on code.


## Usage

```javascript
require('yamvish-transition');

y.view()
.use('transition:slide-up', { ms:400, max:'100vh' })
.div('...');
```

## Licence

MIT
