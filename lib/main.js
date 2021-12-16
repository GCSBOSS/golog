const util = require('util');
const os = require('os');

const LEVELS = {
    debug: { w: 0, c: '\x1b[30;5;1m' },
    info: { w: 1, c: '\x1b[0m' },
    warn: { w: 2, c: '\x1b[33m' },
    error: { w: 3, c: '\x1b[31m' },
    fatal: { w: 4, c: '\x1b[41;5;1m' }
};

function output(entry){
    let env = process.env.NODE_ENV;

    // Output friendly log for dev or undfined env
    /* istanbul ignore next */
    if(!env || env === 'development'){
        let uword = (entry.type == 'event' ? entry.level : entry.type).toUpperCase();
        entry.time.setMinutes(entry.time.getMinutes() - entry.time.getTimezoneOffset());
        let utime = entry.time.toISOString().slice(11, -5);
        console.log(LEVELS[entry.level].c + utime + ': ' + uword + ' - ' + entry.msg + '\x1b[0m');
    }

    // Output complete JSON log for production and staging
    /* istanbul ignore next */
    else if(env !== 'testing')
        console.log(JSON.stringify(entry));
}

function parseErr({ err }){
    if(!(err instanceof Error))
        err = new Error(err);

    let stack = err.stack.split(/[\r\n]+\s*/g);
    let env = process.env.NODE_ENV;

    return {
        err: null,
        code: err.code,
        class: err.constructor.name,
        message: err.message,
        stack: stack.slice(1, -1),
        msg: !env || env === 'development'
            ? /* istanbul ignore next */ err.stack
            : stack[0] + ' ' + stack[1]
    };
}

function parseReq({ req }){
    let path = req.path || req.url;
    return {
        req: null,
        method: req.method,
        path,
        host: req.host,
        agent: req['user-agent'],
        type: 'request',
        msg: 'Received ' + req.method + ' request to ' + path
    };
}

function parseRes({ res }){
    let req = res.req ? parseReq({ req: res.req }) : {};
    return {
        res: null,
        ...req,
        status: res.statusCode,
        level: res.statusCode > 499 ? 'warn' : 'debug',
        type: 'response',
        msg: 'Sent ' + res.statusCode + ' response to ' + req.method + ' ' + req.path
    };
}

function getEntry(level, args){
    let data = typeof args[0] == 'object' ? args.shift() : {};
    let msg = util.format(...args);
    let type = data.type || 'event';

    /* istanbul ignore next */
    let pid = process.pid != 1 ? process.pid : null;

    for(let key in this.parsers)
        key in data && Object.assign(data, this.parsers[key](data));

    msg = msg || data.msg;
    return { level, type, ...data, msg, pid, time: new Date(),
        hostname: this.hostname };
}

function log(level, ...args){
    let entry = {
        ...this.defaults,
        ...getEntry.call(this, level, args)
    };

    let badLevel = LEVELS[this.level].w > LEVELS[level].w;
    let badType = this.except.has(entry.type) ||
        this.only.size > 0 && !this.only.has(entry.type);
    if(badType || badLevel)
        return false;

    output(entry);

    return entry;
}

module.exports = class GoLog {

    constructor(conf = {}){
        this.level = conf.level || 'debug';
        this.only = new Set([].concat(conf.only).filter(a => a));
        this.except = new Set([].concat(conf.except).filter(a => a));
        this.defaults = conf.defaults || {};
        this.parsers = { err: parseErr };
        this.hostname = os.hostname();

        let op = conf === false ? () => false : log;

        for(let l in LEVELS)
            this[l] = op.bind(this, l);
    }

    addParser(key, parser){
        this.parsers[key] = parser;
    }

};
