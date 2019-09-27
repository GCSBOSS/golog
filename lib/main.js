const { EventEmitter } = require('events');
const assert = require('assert');
const util = require('util');
const fs = require('fs');

const LOG_LEVELS = { debug: 0, info: 1, warn: 2, error: 3, fatal: 4 };

function formatErrData(err){
    return {
        code: err.code,
        name: err.constructor.name,
        message: err.message,
        stack: err.stack.split(/[\r\n]+\s*/g).slice(1)
    };
}

function formatReqData(req){
    return {
        method: req.method,
        path: req.url,
        host: req.headers.host,
        agent: req.headers['user-agent']
    };
}

function formatData(data){
    if(data.err instanceof Error)
        data.err = formatErrData(data.err);
    if(typeof data.req === 'object')
        data.req = formatReqData(data.req);
    return data;
}

function parseEntry(logger, level, args) {

    let time = (new Date()).toISOString();

    let data = {};
    if(typeof args[0] == 'object')
        data = formatData(args.shift());

    let msg = args.shift();
    msg = util.format(msg, ...args);

    if(logger.mode == 'minimal')
        return `${time} - ${level} - ${msg}\r\n`;

    let obj = { ...data, name: logger.name, pid: process.pid, level, msg, time };

    let spaces, breaks = '\r\n';
    if(logger.mode == 'pretty'){
        spaces = 2;
        breaks = '\r\n\r\n';
    }

    return JSON.stringify(obj, undefined, spaces) + breaks;
}

function log(level, ...args) {

    let entry = parseEntry(this, level, args);

    Object.values(this.streams).forEach(s => {
        let l = LOG_LEVELS[s.level || this.level];
        if(LOG_LEVELS[level] >= l)
            s.stream.write(entry, 'utf8');
    });

    this.emit(level, entry);
    this.emit('entry', entry);
}

const DEFAULT_OPTS = { name: 'golog', mode: 'full', level: 'warn' };

module.exports = class GoLog extends EventEmitter {

    constructor(opts) {
        opts = { ...DEFAULT_OPTS, ...opts };
        super();
        this.on('error', Function.prototype);
        this.active = true;
        this.streams = {};

        this.name = opts.name;
        this.mode = opts.mode;
        this.level = opts.level;

        Object.keys(LOG_LEVELS).forEach( l =>
            this[l] = log.bind(this, l));

        if(opts.stream)
            this.addStream('main', opts.stream);
        else if(opts.file)
            this.addFile('main', opts.file);
    }

    addStream(name, stream, level) {
        assert(stream.writable);
        this.streams[name] = { stream, level };
    }

    removeStream(name) {
        delete this.streams[name];
    }

    addFile(name, file, level) {
        let stream = fs.createWriteStream(file, { flags: 'a' });
        this.addStream(name, stream, level);
    }

}
