const MemoryStream = require('memorystream');
const Tempper = require('tempper');
const assert = require('assert');

const Logger = require('../lib/main');

var stream, log;

beforeEach(function(){
    stream = new MemoryStream();
});

describe('Setup', function(){

    it('Should store the given stream to write log entries [#addStream]', function(){
        log = new Logger();
        log.addStream('foobar', stream);
        assert.strictEqual(typeof log.streams.foobar, 'object');
    });

    it('Should create fs write stream from file path [#addFile]', function(done){
        log = new Logger();
        let tmp = new Tempper();
        log.addFile('foobar', './foo.txt');
        log.streams.foobar.stream.write('baz');
        log.streams.foobar.stream.end();
        setTimeout(function(){
            tmp.assertExists('./foo.txt');
            tmp.clear();
            done();
        }, 1000);
    });

    it('Should remove the given stream from the logger [#removeStream]', function(){
        log = new Logger();
        log.addStream('foobar', stream);
        log.removeStream('foobar');
        assert.strictEqual(typeof log.streams.foobar, 'undefined');
    });

});

describe('Logging', function(){

    beforeEach(function(){
        log = new Logger();
        log.addStream('mem', stream);
    });

    it('Should log the given message as JSON', function(done){
        stream.on('data', buf => {
            assert.strictEqual(JSON.parse(buf.toString()).msg, 'bar');
            done();
        });
        log.warn('bar');
    });

    it('Should log additional data in the message as JSON', function(done){
        stream.on('data', buf => {
            let ent = JSON.parse(buf.toString());
            assert.strictEqual(ent.msg, 'bar');
            assert.strictEqual(ent.foo, 'baz');
            done();
        });
        log.warn({ foo: 'baz' }, 'bar');
    });

    it('Should not log when entry level is below logger level', function(done){
        stream.on('data', done);
        log.debug({ foo: 'baz' }, 'bar');
        done();
    });

    it('Should broadcast log entries to all streams', function(done){
        let i = 0;
        let test = () => i > 0 ? done() : i++;
        stream.on('data', test);

        let stream2 = new MemoryStream();
        stream2.on('data', buf => {
            assert.strictEqual(JSON.parse(buf.toString()).msg, 'barbaz');
            test();
        });
        log.addStream('other', stream2);

        log.warn('barbaz');
    });

});

describe('Formatting', function(){

    beforeEach(function(){
        log = new Logger();
        log.addStream('mem', stream);
    });

    it('Should format message with input variables', function(done){
        stream.on('data', buf => {
            assert.strictEqual(JSON.parse(buf.toString()).msg, 'bar 1 cool');
            done();
        });
        log.warn('bar %d %s', 1, 'cool');
    });

    it('Should format error objects in the input data', function(done){
        stream.on('data', buf => {
            let out = JSON.parse(buf.toString());
            assert.strictEqual(out.err.name, 'Error');
            assert.strictEqual(out.msg, 'foo');
            done();
        });
        log.warn({ err: new Error() }, 'foo');
    });

    it('Should format http request objects in the input data', function(done){
        const http = require('http');
        const server = http.createServer(function(req, res){
            res.end();
            log.warn({ req: req }, 'foo');
        });

        stream.on('data', buf => {
            let out = JSON.parse(buf.toString());
            assert.strictEqual(out.req.host, 'localhost:8765');
            assert.strictEqual(out.msg, 'foo');
            server.close();
            done();
        });

        server.listen(8765);
        http.get('http://localhost:8765');
    });

});

describe('Options', function(){

    beforeEach(function(){
        log = new Logger();
        log.addStream('mem', stream);
    });

    it('Should log only essential data when in minimal mode [mode = minimal]', function(done){
        stream.on('data', buf => {
            let ent = buf.toString();
            assert(/\ \-\ warn\ \-\ bar/g.test(ent));
            done();
        });
        log.mode = 'minimal';
        log.warn({ foo: 'baz' }, 'bar');
    });

    it('Should log readable JSON when in pretty mode [mode = pretty]', function(done){
        stream.on('data', buf => {
            let ent = buf.toString();
            assert(/"level": "warn",[\n\r]+  "msg": "bar"/g.test(ent));
            done();
        });
        log.mode = 'pretty';
        log.warn({ foo: 'baz' }, 'bar');
    });

    it('Should not log when entry level is below stream level [stream.level]', function(done){
        log.streams.mem.level = 'error';
        stream.on('data', done);
        log.on('warn', () => done());
        log.warn({ foo: 'baz' }, 'bar');
    });

    it('Should add a single main file stream [file]', function(done){
        let tmp = new Tempper();
        log = new Logger({ file: './abc.txt' });
        assert.strictEqual(typeof log.streams.main, 'object');
        log.streams.main.stream.end();
        setTimeout(function(){
            tmp.assertExists('./abc.txt');
            tmp.clear();
            done();
        }, 1400);
    });

    it('Should add a single main stream [stream]', function(done){
        log = new Logger({ stream });
        stream.on('data', buf => {
            assert.strictEqual(JSON.parse(buf.toString()).msg, 'bar');
            done();
        });
        log.warn('bar');
    });

});

describe('Regression', function(){

    beforeEach(function(){
        log = new Logger();
        log.addStream('mem', stream);
    });

    it('Should not throw exception when error event not handled', function(){
        log.error('bar');
    });

});
