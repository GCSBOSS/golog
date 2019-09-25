# [GoLog](https://gitlab.com/GCSBOSS/golog)

A light-weight heavily inspired logging library for NodeJS. Checkout the main features:

- JSON output as well as simple _date-level-msg_ format.
- Auto-format error and request objects.
- `printf`-like formatting on messages.
- Automatic pid field on log entries.
- Broadcast to many files/streams.
- Individual logging level for each file/stream.

## Get Started

1. Install with: `npm i -P golog`.
2. Setup a logger:

```js
const GoLog = require('require');

// Crate a new logger.
var log = new GoLog();

// Add a Writable Stream to receive log entries.
log.addStream( 'my-stdout', process.stdout );

// Add a file where to write log entries.
log.addFile( 'my-file', '/path/to/file' );
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

If you want to setup a logger with a single stream or file go with the one-liner.

```js
var slog = new GoLog({ stream: process.stdout });
var flog = new GoLog({ file: '/path/to/file' });
```

If you have many loggers writing to the same stream, name each logger for better visibility.

```js
var l1 = new GoLog({ name: 'log-a', stream: process.stdout });
l1.warn('Hey!');
var l2 = new GoLog({ name: 'log-b', stream: process.stdout });
l2.warn('Ho!');
```

Default loggers only log entries of level `warn` or higher. Change the level for an entire logger.

```js
var log = new GoLog({ level: 'debug', stream: process.stdout });
log.debug('Let\'s go!');
```

If you need these files right now, just change to a mode with better aesthetics.

```js
var log = new GoLog({ stream: process.stdout });
log.warn('This is an ugly JSON');

log.mode = 'pretty'
log.warn('This is a cute JSON');

log.mode = 'minimal'
log.warn('This is just readable');
```

If you need to stop logging to a given stream/file just use `removeStream`.

```js
var log = new GoLog({ stream: process.stdout });
log.addFile('some-file', '/path/to/file');
log.warn('This goes to stdout and file');

log.removeStream('main');
log.warn('This goes to file only');

log.removeStream('some-file');
log.warn('This goes nowhere');
```

If you happen to need to setup some listeners.

```js
var log = new GoLog();

log.on('fatal', ent => console.log('Show me once'));
log.on('entry', ent => console.log('Show me twice'));

log.fatal('The fatal entry');
log.debug('The debug entry');
```

If you want to log some information about an `Error` instance, just add it as a key to the data object.

```js
log.warn({ err: new Error('My error') }, 'The message lives on');
```

GoLog also formats http request objects.

```js
const http = require('http');
const GoLog = require('require');

var log = new GoLog({ stream: process.stdout });

var server = http.createServer(function(req, res){
    res.end();
    log.warn({ req: req }, 'The message lives on');
}).listen(8765);

http.get('http://localhost:8765');
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
