const assert = require('assert');
const Logger = require('../lib/main');

process.env.NODE_ENV = 'testing';

describe('Logging', function(){
    var log;

    before(function(){
        log = new Logger();
    });

    it('Should log appropriate objects according to log level', function(){
        assert.strictEqual(log.debug().level, 'debug');
        assert.strictEqual(log.info().level, 'info');
        assert.strictEqual(log.warn().level, 'warn');
        assert.strictEqual(log.error().level, 'error');
        assert.strictEqual(log.fatal().level, 'fatal');
    });

    it('Should printf format message with input arguments', function(){
        assert.strictEqual(log.debug('a b %s d %s', 'c', 'e').msg, 'a b c d e');
    });

    it('Should assign first object argument properties to final log entry', function(){
        let e = log.info({ a: 1, b: 2 });
        assert.strictEqual(e.a, 1);
        assert.strictEqual(e.b, 2);
    });

    it('Should include entry type', function(){
        assert.strictEqual(log.warn().type, 'event');
        assert.strictEqual(log.error({ type: 'foobar' }).type, 'foobar');
    });

});

describe('Auto-Parsing', function(){

    it('Should parse error objects', function(){
        let log = new Logger();
        assert(Array.isArray(log.warn({ err: new Error('Foobar') }).stack));
        assert(Array.isArray(log.info({ err: 'My Error' }).stack));
    });

    const http = require('http');

    it('Should parse http REQuest objects', function(done){
        let log = new Logger();
        let server = http.createServer(function(req, res){
            let e = log.info({ req });
            assert.strictEqual(e.method, 'GET');
            done();
            res.end();
            server.close();
        });
        server.listen(6743);
        http.request('http://localhost:6743').end();
    });

    it('Should parse http RESponse objects', function(done){
        let log = new Logger();
        let req = http.request('http://example.com');
        req.on('response', res => {
            let e = log.info({ res });
            assert.strictEqual(e.method, 'GET');
            assert.strictEqual(e.status, 200);
            assert.strictEqual(e.type, 'response');
            done();
        });
        req.end();
    });

    it('Should force level warn on 5xx response', function(done){
        let log = new Logger();
        let req = http.request('http://httpbin.org/status/500');
        req.on('response', res => {
            let e = log.info({ res });
            assert.strictEqual(e.status, 500);
            assert.strictEqual(e.level, 'warn');
            done();
        });
        req.end();
    });

    it('Should execute added parsers', function(){
        let log = new Logger();
        log.addParser('thing', () => ({ foobar: true }));
        let e = log.info({ thing: {} });
        assert(e.foobar);
    });

});

describe('Options', function(){

    it('Should not log when entry level is below conf level [level]', function(){
        let log = new Logger({ level: 'error' });
        assert(!log.warn());
    });

    it('Should set defaults values for all entries [defaults]', function(){
        let log = new Logger({ defaults: { a: 'foo', b: 'bar' } });
        let e = log.info({ a: 1 });
        assert.strictEqual(e.a, 1);
        assert.strictEqual(e.b, 'bar');
    });

    it('Should not log anything when conf is FALSE', function(){
        let log = new Logger(false);
        assert(!log.debug());
    });

    it('Should only log selected types [only]', function(){
        let log = new Logger({ only: 'a' });
        assert(log.debug({ type: 'a' }));
        assert(!log.debug({ type: 'b' }));
    });

    it('Should not log filtered types [except]', function(){
        let log = new Logger({ except: [ 'a', 'c' ] });
        assert(!log.debug({ type: 'a' }));
        assert(log.debug({ type: 'b' }));
        assert(!log.debug({ type: 'c' }));
    });

});
