'use strict';

var proxyquire = require('proxyquire')
  , expect = require('chai').expect
  , sinon = require('sinon');

describe(__filename, function () {
  var stubs, mod, getCollectionStub, ensureIndexStub;

  beforeEach(function () {
    stubs = {
      'lib/constants': {
        COLLECTION_INDEX_FIELDS: {
          a: [{
            key: 1
          }],
          b: [{
            key: -1
          }]
        }
      },
      'mongo-utils': {
        getDatabaseManager: sinon.spy(function () {
          ensureIndexStub = sinon.stub();
          getCollectionStub = sinon.stub();

          return {
            getCollection: getCollectionStub
          };
        })
      }
    };

    mod = proxyquire('../index.js', stubs);
  });

  it('should apply 2 indexes', function () {

    getCollectionStub.yields(null, {
      ensureIndex: ensureIndexStub
    });

    ensureIndexStub.yields(null);

    return mod(stubs['lib/constants'].COLLECTION_INDEX_FIELDS).then(onDone);

    function onDone () {
      expect(stubs['mongo-utils'].getDatabaseManager.calledOnce).be.true;
      expect(getCollectionStub.callCount).to.equal(2);
      expect(ensureIndexStub.callCount).to.equal(2);

      expect(ensureIndexStub.getCall(0).args[0]).to.deep.equal(
        stubs['lib/constants'].COLLECTION_INDEX_FIELDS.a[0]
      );
      expect(ensureIndexStub.getCall(1).args[0]).to.deep.equal(
        stubs['lib/constants'].COLLECTION_INDEX_FIELDS.b[0]
      );
    }
  });

  it('should handle errors', function (done) {

    getCollectionStub.yields(null, {
      ensureIndex: ensureIndexStub
    });

    ensureIndexStub.yields(new Error('fake error'));

    mod(stubs['lib/constants'].COLLECTION_INDEX_FIELDS)
      .then(function () {
        done(new Error('this block should not be called!'));
      })
      .catch(function (err) {
        expect(err).to.exist;
        expect(err.toString()).to.contain('fake error');
        done();
      });
  });

});
