# [GoLog](https://gitlab.com/GCSBOSS/golog)

A light-weight stdout logging library for NodeJS. Checkout the main features:

- JSON output by default
- Automatic readable output format for dev environments
- Auto-format error, request and repsonse objects.
- Support for adding custom function to parse interesting input data
- `printf`-like formatting on messages.
- Automatic pid field on log entries.
- Log entries filtering by level or type (whitelist, blacklist)

## Get Started

1. Install with: `npm i -P golog`.
2. Setup a logger:

```js
const GoLog = require('require');

// Crate a new logger.
var log = new GoLog();
```

3. Create new log entries with one of the supported levels:

```js
log.debug('Main log message');
log.info('Main log message');
log.warn('Counting, %d, %d, %d... %s', 1, 2, 3, 'Foo!');
log.error('Main log message');
log.fatal({ merge: 'this', object: 'with', the: 'entry' }, 'The MSG');
```

## Other Features

You can set default properties to show up in every log entry for a given logge rinstance.
For exemple we can use it to set a `source`.

```js
var l1 = new GoLog({ defaults: { source: 'app-a' } });
l1.warn('Hey!');
var l2 = new GoLog({ defaults: { source: 'app-b' } });
l2.warn('Ho!');
```

Default loggers log entries of any level. Change the level for warn or higher.

```js
var log = new GoLog({ level: 'warn' });
log.debug('Let\'s go!');
```

You can check/use log entries right off the bat.

```js
var log = new GoLog();

let e1 = log.fatal('foo');
let e2 = log.debug('bar');
console.log(e1, e2);
```

If you want to log some information about an `Error` instance, just add it as a key to the data object.

```js
log.warn({ err: new Error('My error') }, 'The message lives on');
```

GoLog also formats http request objects.

```js
const http = require('http');
const GoLog = require('require');

var log = new GoLog();

var server = http.createServer(function(req, res){
    res.end();
    log.warn({ req }, 'The message lives on');
}).listen(8765);

http.get('http://localhost:8765');
```

You can create a disabled logger if you send `false` as the input parameter

```js
var log = new GoLog(false);
log.info('Wont log this');
```

## Reporting Bugs
If you have found any problems with this module, please:

1. [Open an issue](https://gitlab.com/GCSBOSS/golog/issues/new).
2. Describe what happened and how.
3. Also in the issue text, reference the label `~bug`.

We will make sure to take a look when time allows us.

## Proposing Features
If you wish to get that awesome feature or have some advice for us, please:
1. [Open an issue](https://gitlab.com/GCSBOSS/golog/issues/new).
2. Describe your ideas.
3. Also in the issue text, reference the label `~proposal`.

## Contributing
If you have spotted any enhancements to be made and is willing to get your hands
dirty about it, fork us and
[submit your merge request](https://gitlab.com/GCSBOSS/golog/merge_requests/new)
so we can collaborate effectively.
