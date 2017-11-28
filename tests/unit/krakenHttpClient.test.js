'use strict';

const url = 'dummy.url';
const pair = 'XBTEUR';
const result = {"ohlcv": "data"};

function createHttpsMock(apiResponseString) {
    const httpMock = require.requireMock('http');
    /** @type {ClientRequest} */
    const clientRequestMock = httpMock.ClientRequest;
    clientRequestMock.on = jest.fn(() => {
        return clientRequestMock;
    });
    clientRequestMock.end = jest.fn();

    /** @type {IncomingMessage} */
    const responseMock = httpMock.IncomingMessage;
    responseMock.on = jest.fn((event, cb) => {
        if ('data' === event) {
            cb(apiResponseString);
        } else if ('end' === event) {
            cb();
        }

        return responseMock;
    });

    const httpsMock = require.requireMock('https');
    httpsMock.get = jest.fn((options, cb) => {
        cb(responseMock);
        return clientRequestMock;
    });

    return httpsMock;
}


describe('fetchData method', () => {
    test('callback is called without error and with data when api response is successful', done => {
        const apiResponseString = '{"error": "", "result": { "XXBTZEUR": ' + JSON.stringify(result) + '}}';

        const httpsMock = createHttpsMock(apiResponseString);

        /** @type {KrakenHttpClient} */
        const sut = require('../../src/krakenHttpClient.js')(httpsMock);

        const callback = jest.fn((error, data) => {
            expect(httpsMock.get).toHaveBeenCalledTimes(1);
            expect(callback).toHaveBeenCalledTimes(1);
            expect(callback).toBeCalledWith(null, result);

            done();
        });

        sut.fetchData(url, pair, callback);
    });

    test('callback is called with error when api response contains at least one error', done => {
        const apiResponseString = '{"error": ["some error"], "result": { "XXBTZEUR": ' + JSON.stringify(result) + '}}';

        const httpsMock = createHttpsMock(apiResponseString);

        const expectedError = {
            'requestUrl': url + '/0/public/OHLC?pair=' + pair,
            'response': JSON.parse(apiResponseString)
        };

        /** @type {KrakenHttpClient} */
        const sut = require('../../src/krakenHttpClient.js')(httpsMock);

        const callback = jest.fn((error, data) => {
            expect(httpsMock.get).toHaveBeenCalledTimes(1);
            expect(callback).toHaveBeenCalledTimes(1);
            expect(callback).toBeCalledWith(expectedError);

            done();
        });

        sut.fetchData(url, pair, callback);
    });
});
