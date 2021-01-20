import { sprintf } from 'https://deno.land/std/fmt/printf.ts'

const LEVELS = {
    debug: { w: 0, c: '\x1b[30;5;1m' },
    info: { w: 1, c: '\x1b[0m' },
    warn: { w: 2, c: '\x1b[33m' },
    error: { w: 3, c: '\x1b[31m' },
    fatal: { w: 4, c: '\x1b[41;5;1m' }
};

function output(entry){
    let env = Deno.env.get('NODE_ENV');

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
    let env = Deno.env.get('NODE_ENV');

    return {
        err: null,
        code: err.code,
        class: err.constructor.name,
        message: err.message,
        stack: stack.slice(1, -1),
        msg: !env || env === 'development'
            ? err.stack
            : stack[0] + ' ' + stack[1]
    }
}

function parseReq({ req }){
    let path = req.path || req.url;
    return {
        req: null,
        method: req.method,
        path,
        host: req.headers.host,
        agent: req.headers['user-agent'],
        type: 'request',
        msg: 'Received ' + req.method + ' request to ' + path
    }
}

function parseRes({ res }){
    let req = res.req ? parseReq({ req: res.req }) : {};
    return {
        res: null,
        ...req,
        status: res.status,
        level: res.status > 499 ? 'warn' : 'debug',
        type: 'response',
        msg: 'Sent ' + res.statusCode + ' response to ' + req.method + ' ' + req.path
    }
}

function getEntry(level, args){
    let data = typeof args[0] == 'object' ? args.shift() : {};
    args[0] = args[0] || '';
    let msg = sprintf(...args);

    let type = data.type || 'event';

    /* istanbul ignore next */
    let pid = Deno.pid != 1 ? Deno.pid : null;

    for(let key in this.parsers)
        key in data && Object.assign(data, this.parsers[key](data));

    msg = msg || data.msg;
    return { level, type, ...data, msg, pid, time: new Date() };
}

function log(level, ...args){
    let entry = {
        ...this.conf.defaults,
        ...getEntry.call(this, level, args)
    };

    let badLevel = LEVELS[this.conf.level].w > LEVELS[level].w;
    let badType = this.conf.except.has(entry.type) ||
        this.conf.only.size > 0 && !this.conf.only.has(entry.type);
    if(badType || badLevel)
        return false;

    output(entry);

    return entry;
}

export default class GoLog {

    constructor(conf = {}){
        this.conf = conf || {};
        this.conf.level = conf.level || 'debug';
        this.conf.only = new Set([].concat(conf.only).filter(a => a));
        this.conf.except = new Set([].concat(conf.except).filter(a => a));
        this.conf.defaults = conf.defaults || {};
        this.parsers = { err: parseErr, req: parseReq, res: parseRes }

        let op = conf === false ? () => false : log;

        for(let l in LEVELS)
            this[l] = op.bind(this, l);
    }

    addParser(key, parser){
        this.parsers[key] = parser;
    }

};
