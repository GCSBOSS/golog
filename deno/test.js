
import Logger from './main.ts'
import { assert, assertEquals } from 'https://deno.land/std/testing/asserts.ts'

Deno.env.set('ENV', 'testing')

Deno.test('Logging - Should log appropriate objects according to log level', function(){
    const log = new Logger()
    assertEquals(log.debug().level, 'debug')
    assertEquals(log.info().level, 'info')
    assertEquals(log.warn().level, 'warn')
    assertEquals(log.error().level, 'error')
    assertEquals(log.fatal().level, 'fatal')
})

Deno.test('Logging - Should printf format message with input arguments', function(){
    assertEquals(new Logger().debug('a b %s d %s', 'c', 'e').msg, 'a b c d e')
})

Deno.test('Logging - Should assign first object argument properties to final log entry', function(){
    const e = new Logger().info({ a: 1, b: 2 })
    assertEquals(e.a, 1)
    assertEquals(e.b, 2)
})

Deno.test('Logging - Should include entry type', function(){
    const log = new Logger()
    assertEquals(log.warn().type, 'event')
    assertEquals(log.error({ type: 'foobar' }).type, 'foobar')
})

Deno.test('Auto-Parsing - Should parse error objects', function(){
    const log = new Logger()
    assert(Array.isArray(log.warn({ err: new Error('Foobar') }).stack))
    assert(Array.isArray(log.info({ err: 'My Error' }).stack))
})

Deno.test('Auto-Parsing - Should execute added parsers', function(){
    const log = new Logger()
    log.addParser('foo', () => ({ foobar: true }))
    const e = log.info({ foo: {} })
    assert(e.foobar)
})

Deno.test('Options - Should not log when entry level is below conf level [level]', function(){
    assert(!new Logger({ level: 'error' }).warn())
})

Deno.test('Options - Should set defaults values for all entries [defaults]', function(){
    const e = new Logger({ defaults: { a: 'foo', b: 'bar' } }).info({ a: 1 })
    assertEquals(e.a, 1)
    assertEquals(e.b, 'bar')
})

Deno.test('Options - Should not log anything when conf is FALSE', function(){
    assert(!new Logger(false).debug())
})

Deno.test('Options - Should only log selected types [only]', function(){
    const log = new Logger({ only: 'a' })
    assert(log.debug({ type: 'a' }))
    assert(!log.debug({ type: 'b' }))
})

Deno.test('Options - Should not log filtered types [except]', function(){
    const log = new Logger({ except: [ 'a', 'c' ] })
    assert(!log.debug({ type: 'a' }))
    assert(log.debug({ type: 'b' }))
    assert(!log.debug({ type: 'c' }))
})
