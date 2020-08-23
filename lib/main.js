const util = require('util');
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
    if(!err)
        return {};

    if(!(err instanceof Error))
        err = new Error(err);

    let stack = err.stack.split(/[\r\n]+\s*/g);

    return {
        err: null,
        code: err.code,
        class: err.constructor.name,
        message: err.message,
        stack: stack.slice(1, -1),
        msg: stack[0] + ' ' + stack[1]
    }
}

function parseReq({ req }){
    if(!req)
        return {};
    return {
        req: null,
        method: req.method,
        path: req.url || req.path,
        host: req.getHeader('host'),
        agent: req.getHeader('user-agent'),
        type: 'request',
        msg: 'Received ' + req.method + ' request to ' + req.url
    }
}

function parseRes({ res }){
    if(!res)
        return {};
    let req = res.req;
    return {
        res: null,
        level: res.statusCode > 499 ? 'warn' : 'debug',
        path: req.url || req.path,
        status: res.statusCode,
        method: req.method,
        type: 'response',
        msg: 'Sent ' + res.statusCode + ' response to ' + req.method + ' ' + req.url
    };
}

function getEntry(level, args){
    let data = typeof args[0] == 'object' ? args.shift() : {};
    let msg = util.format(...args);
    let type = data.type || 'event';

    /* istanbul ignore next */
    let pid = process.pid != 1 ? process.pid : null;

    Object.assign(data, ...this.parsers.map(p => p(data)));

    msg = msg || data.msg;
    return { level, type, ...data, msg, pid, time: new Date() };
}

function log(level, ...args){
    let entry = getEntry.apply(this, [ level, args ]);
    entry.app = this.conf.app;

    let badLevel = LEVELS[this.conf.level].w > LEVELS[level].w;
    let badType = this.conf.except.has(entry.type) ||
        this.conf.only.size > 0 && !this.conf.only.has(entry.type);
    if(badType || badLevel)
        return false;

    output(entry);

    return entry;
}

module.exports = class GoLog {

    constructor(conf = {}){
        this.conf = conf || {};
        this.conf.level = conf.level || 'debug';
        this.conf.only = new Set([].concat(conf.only).filter(a => a));
        this.conf.except = new Set([].concat(conf.except).filter(a => a));
        this.parsers = [ parseErr, parseReq, parseRes ];

        let op = conf === false ? () => false : log;

        for(let l in LEVELS)
            this[l] = op.bind(this, l);
    }

    addParser(parser){
        this.parsers.push(parser);
    }

};
