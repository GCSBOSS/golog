
import Logger from './main.ts'
import { assert, assertEquals } from 'https://deno.land/std/testing/asserts.ts'
import { serve } from 'https://deno.land/std@0.83.0/http/server.ts'

Deno.env.set('ENV', 'testing')

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

Deno.test('Auto-Parsing - Should execute added parsers', function(){
    let log = new Logger()
    log.addParser('foo', () => ({ foobar: true }))
    let e = log.info({ foo: {} })
    assert(e.foobar)
})

Deno.test('Options - Should not log when entry level is below conf level [level]', function(){
    assert(!new Logger({ level: 'error' }).warn())
})

Deno.test('Options - Should set defaults values for all entries [defaults]', function(){
    let log = new Logger({ defaults: { a: 'foo', b: 'bar' } })
    let e = log.info({ a: 1 })
    assertEquals(e.a, 1)
    assertEquals(e.b, 'bar')
})

Deno.test('Options - Should not log anything when conf is FALSE', function(){
    assert(!new Logger(false).debug())
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
