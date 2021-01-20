
import Logger from './main.js'
import { assert, assertEquals } from 'https://deno.land/std/testing/asserts.ts'
import { serve } from 'https://deno.land/std@0.83.0/http/server.ts'

Deno.env.set('NODE_ENV', 'testing')

var log = new Logger()

Deno.test('Logging - Should log appropriate objects according to log level', function(){
    assertEquals(log.debug().level, 'debug')
    assertEquals(log.info().level, 'info')
    assertEquals(log.warn().level, 'warn')
    assertEquals(log.error().level, 'error')
    assertEquals(log.fatal().level, 'fatal')
})

Deno.test('Logging - Should printf format message with input arguments', function(){
    assertEquals(log.debug('a b %s d %s', 'c', 'e').msg, 'a b c d e')
})

Deno.test('Logging - Should assign first object argument properties to final log entry', function(){
    let e = log.info({ a: 1, b: 2 })
    assertEquals(e.a, 1)
    assertEquals(e.b, 2)
})

Deno.test('Logging - Should include entry type', function(){
    assertEquals(log.warn().type, 'event')
    assertEquals(log.error({ type: 'foobar' }).type, 'foobar')
})

Deno.test('Auto-Parsing - Should parse error objects', function(){
    let log = new Logger()
    assert(Array.isArray(log.warn({ err: new Error('Foobar') }).stack))
    assert(Array.isArray(log.info({ err: 'My Error' }).stack))
})

Deno.test('Auto-Parsing - Should parse http REQuest objects', async function(){
    let log = new Logger()
    let srv = serve({ port: 8008 })
    let p1 = srv[Symbol.asyncIterator]().next()
    let p2 = fetch('http://localhost:8008')
    let { value: req } = await p1
    await req.respond({})
    let res = await p2
    await res.body?.cancel()
    let e = log.info({ req })
    assertEquals(e.method, 'GET')
    srv.close()
})

Deno.test('Auto-Parsing - Should parse http RESponse objects', async function(){
    let log = new Logger()
    let srv = serve({ port: 8008 })
    let p1 = srv[Symbol.asyncIterator]().next()
    let p2 = fetch('http://localhost:8008')
    let { value: req } = await p1
    await req.respond({})
    let res = await p2
    await res.body?.cancel()
    res.req = req
    let e = log.info({ res })
    assertEquals(e.method, 'GET')
    assertEquals(e.status, 200)
    assertEquals(e.type, 'response')
    srv.close()
})

Deno.test('Auto-Parsing - Should force level warn on 5xx response', async function(){
    let log = new Logger()
    let srv = serve({ port: 8008 })
    let p1 = srv[Symbol.asyncIterator]().next()
    let p2 = fetch('http://localhost:8008')
    let { value: req } = await p1
    await req.respond({ status: 500 })
    let res = await p2
    await res.body?.cancel()
    res.req = req
    let e = log.info({ res })
    assertEquals(e.status, 500)
    assertEquals(e.level, 'warn')
    srv.close()
})

Deno.test('Auto-Parsing - Should execute added parsers', function(){
    let log = new Logger()
    log.addParser('foo', () => ({ foobar: true }))
    let e = log.info({ foo: {} })
    assert(e.foobar)
})

Deno.test('Options - Should not log when entry level is below conf level [level]', function(){
    let log = new Logger({ level: 'error' })
    assert(!log.warn())
})

Deno.test('Options - Should set defaults values for all entries [defaults]', function(){
    let log = new Logger({ defaults: { a: 'foo', b: 'bar' } })
    let e = log.info({ a: 1 })
    assertEquals(e.a, 1)
    assertEquals(e.b, 'bar')
})

Deno.test('Options - Should not log anything when conf is FALSE', function(){
    let log = new Logger(false)
    assert(!log.debug())
})

Deno.test('Options - Should only log selected types [only]', function(){
    let log = new Logger({ only: 'a' })
    assert(log.debug({ type: 'a' }))
    assert(!log.debug({ type: 'b' }))
})

Deno.test('Options - Should not log filtered types [except]', function(){
    let log = new Logger({ except: [ 'a', 'c' ] })
    assert(!log.debug({ type: 'a' }))
    assert(log.debug({ type: 'b' }))
    assert(!log.debug({ type: 'c' }))
})
