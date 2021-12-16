import { sprintf } from 'https://deno.land/std@0.115.0/fmt/printf.ts'

type LevelSpec = { w: number, c: string };
type Dict = Record<string, any>;

const LEVELS: Record<string, LevelSpec> = {
    debug: { w: 0, c: '\x1b[30;5;1m' },
    info: { w: 1, c: '\x1b[0m' },
    warn: { w: 2, c: '\x1b[33m' },
    error: { w: 3, c: '\x1b[31m' },
    fatal: { w: 4, c: '\x1b[41;5;1m' }
};

function output(entry: Dict){
    const env = Deno.env.get('ENV')

    // Output friendly log for dev or undfined env
    /* istanbul ignore next */
    if(!env || env === 'development'){
        const uword = (entry.type == 'event' ? entry.level : entry.type).toUpperCase()
        entry.time.setMinutes(entry.time.getMinutes() - entry.time.getTimezoneOffset())
        const utime = entry.time.toISOString().slice(11, -5)
        console.log(LEVELS[entry.level].c + utime + ': ' + uword + ' - ' + entry.msg + '\x1b[0m')
    }

    // Output complete JSON log for production and staging
    /* istanbul ignore next */
    else if(env !== 'testing')
        console.log(JSON.stringify(entry))
}

function parseErr({ err }: Dict){
    if(!(err instanceof Error))
        err = new Error(err)

    const stack = err.stack.split(/[\r\n]+\s*/g)
    const env = Deno.env.get('ENV')

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

type GoLogConf = {
    defaults?: Dict,
    level?: string,
    only?: string | string[],
    except?: string | string[]
}

export default class GoLog implements Dict {

    parsers: Dict = { err: parseErr }
    private level: string
    private only: Set<string>
    private except: Set<string>
    private defaults: Dict

    private log(level: string, ...args: any[]){

        const entry = {
            ...this.defaults,
            ...this.getEntry.call(this, level, args)
        }

        const badLevel = LEVELS[this.level].w > LEVELS[level].w
        const badType = this.except.has(entry.type) ||
            this.only.size > 0 && !this.only.has(entry.type)
        if(badType || badLevel)
            return false

        output(entry)

        return entry
    }

    debug(...args: any[]){ return this.log('debug', ...args) }
    info(...args: any[]){ return this.log('info', ...args) }
    warn(...args: any[]){ return this.log('warn', ...args) }
    error(...args: any[]){ return this.log('error', ...args) }
    fatal(...args: any[]){ return this.log('fatal', ...args) }

    constructor(conf: false | GoLogConf = {}){
        if(!conf)
            conf = { only: 'badbadclass' }
        this.level = conf.level || 'debug'
        this.only = new Set([ conf.only ].flat().filter((a): a is string => Boolean(a)))
        this.except = new Set([ conf.except ].flat().filter((a): a is string => Boolean(a)))
        this.defaults = conf.defaults || {}
    }

    addParser(key: string, parser: (d: Dict) => void){
        this.parsers[key] = parser
    }

    private getEntry(level: string, args: any[]){
        const data = typeof args[0] == 'object' ? args.shift() : {}
        args[0] = args[0] || ''
        let msg = sprintf(args[0], ...args.slice(1).map(a => String(a)))

        const type = data.type || 'event'

        /* istanbul ignore next */
        const pid = Deno.pid != 1 ? Deno.pid : null

        for(const key in this.parsers)
            key in data && Object.assign(data, this.parsers[key](data))

        msg = msg || data.msg
        return { level, type, ...data, msg, pid, time: new Date() }
    }

}
