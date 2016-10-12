'use strict';

var Promise = require('bluebird')
  , mongo = require('mongo-utils')
  , env = require('env-var')
  , log = require('tke-logger').getLogger(__filename);

var db = Promise.promisifyAll(
  mongo.getDatabaseManager({
    mongoUrl: env('FH_MONGODB_CONN_URL', 'mongodb://127.0.0.1:27017')
  })
);

module.exports = function applyMongoIndexes (collectionIndexFields) {
  log.info('applying indexes for collections');

  function applyIndexesForCollection (collectionName) {

    function performEnsureIndex (collection) {
      var indexes = collectionIndexFields[collectionName];

      log.info(
        'apply indexes %j for collection %s',
        indexes,
        collectionName
      );

      return Promise.map(indexes, ensureIndex.bind(null, collection));
    }

    function ensureIndex (collection, idx) {
      return Promise.fromCallback(function (callback) {
        collection.ensureIndex(idx, callback);
      });
    }

    return db.getCollectionAsync(collectionName)
      .then(performEnsureIndex);
  }

  // For each collection add its indexes
  return Promise.each(
    Object.keys(collectionIndexFields),
    applyIndexesForCollection
  );
};
