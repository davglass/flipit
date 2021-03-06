var Y = require('yuitest'),
    Assert = Y.Assert,
    mockery = require('mockery'),
    path = require('path'),
    helper = require('./helper'),
    FEATURE_LOADER_PATH = path.join('..', 'lib', 'feature-loader');

function mockFsWatch(eventName, testFilename) {
    return function (filename, callback) {
        Assert.areSame(testFilename, filename);
        callback(eventName, filename);
    };
}

function jsonString() {
    return '{"testFeature": true,"anotherFeatureForTesting": true}';
}

function mockReadFile(filename, options, callback) {
    callback(null, jsonString());
}

Y.TestRunner.add(new Y.TestCase({
    "name": "Test Feature Loader",

    "setUp": function () {
        this.module = require(FEATURE_LOADER_PATH);
        this.testFilename = './features.json';

        mockery.enable({
            useCleanCache: true
        });
    },

    "tearDown": function () {
        mockery.deregisterAll();
        mockery.disable();
    },

    "test require feature-loader package": function () {
        Assert.isNotUndefined(this.module);
    },

    "validate API": function () {
        var me = this,
            testEndpoints = [
                'load'
            ];

        testEndpoints.forEach(function (endpoint) {
            Assert.isTrue(me.module.hasOwnProperty(endpoint),
                'Endpoint "' + endpoint + '" exists.');
        });
    },

    "test load endpoint with update only from change event": function () {
        var me = this,
            expectedCount = 2;

        mockery.registerMock('fs', {
            "watch": mockFsWatch('change', me.testFilename),
            "readFile": mockReadFile
        });

        mockery.registerAllowable(FEATURE_LOADER_PATH);
        this.module = require(FEATURE_LOADER_PATH);

        this.module.load(me.testFilename, function (error, data) {
            Assert.isNull(error);
            Assert.areSame(expectedCount, helper.validateHash(JSON.parse(jsonString()), data));
        });
    },

    "test load endpoint with no update from rename event": function () {
        var me = this;

        mockery.registerMock('fs', {
            "watch": mockFsWatch('rename', me.testFilename),
            "readFile": function () { /* this should not proc the callback*/ }
        });

        mockery.registerAllowable(FEATURE_LOADER_PATH);
        this.module = require(FEATURE_LOADER_PATH);

        this.module.load(me.testFilename, function (error, data) {
            Assert.fail("Callback should not be proc'd from rename event");
        });
    }
}));