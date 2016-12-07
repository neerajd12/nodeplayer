const Datastore = require('nedb'),
os = require('os'),
path = require('path'),
Q = require('q'),
dataDir = os.homedir() + path.sep +'.nodeplayerdata' + path.sep,
albums = new Datastore({ filename: dataDir+'albums', autoload: true }),
tracks = new Datastore({ filename: dataDir+'tracks', autoload: true });
config = new Datastore({ filename: dataDir+'config', autoload: true });

albums.ensureIndex({ fieldName: 'id', unique: true }, function (err) {if(err) console.log(err);});
albums.ensureIndex({ fieldName: 'title', unique: true }, function (err) {if(err) console.log(err);});

tracks.ensureIndex({ fieldName: 'id', unique: true }, function (err) {if(err) console.log(err);});
tracks.ensureIndex({ fieldName: 'fileName', unique: true }, function (err) {if(err) console.log(err);});
tracks.ensureIndex({ fieldName: 'title', unique: false }, function (err) {if(err) console.log(err);});
tracks.ensureIndex({ fieldName: 'albumId', unique: false }, function (err) {if(err) console.log(err);});
tracks.ensureIndex({ fieldName: 'album', unique: false }, function (err) {if(err) console.log(err);});

exports.getConfig = () => {
  return config;
};
/******************* Albums ****************** */

exports.getAlbumCount = () => {
  let deferred = Q.defer();
  albums.count({}, function (err, count) {
    if (err) deferred.reject(err);
    else deferred.resolve(count);
  });
  return deferred.promise;
};
exports.getAlbums = () => {
  let deferred = Q.defer();
  albums.find({},function (err, docs) {
    if (err) deferred.reject(err);
    else deferred.resolve(docs);
  });
  return deferred.promise;
};
exports.getAlbumById = (albumId) => {
  let deferred = Q.defer();
  albums.findOne({'id': albumId},function (err, docs) {
    if (err) deferred.reject(err);
    else deferred.resolve(docs);
  });
  return deferred.promise;
};
exports.getAlbumByName = (title) => {
  let deferred = Q.defer();
  albums.findOne({'title': title},function (err, docs) {
    if (err) deferred.reject(err);
    else deferred.resolve(docs);
  });
  return deferred.promise;
};
exports.getAlbumByTrackId = (trackId) => {
  let deferred = Q.defer();
  albums.findOne({'title': title},function (err, docs) {
    if (err) deferred.reject(err);
    else deferred.resolve(docs);
  });
  return deferred.promise;
};
exports.getAlbumByTrackName = (trackId) => {

};
exports.getAlbumArt = (trackId) => {
  //return self.getUnique(getTracksByAlbumId(id).map(function(val){return val.picture}));
};
exports.insertAlbums = (newAlbums) => {
  albums.insert(newAlbums, function (err, newDocs) {
    if(err) console.log(err);
  });
};
exports.addUpdateAlbums = (albumsToAdd) => {
  albumsToAdd.forEach(function(album) {
    albums.update({ title: album.title }, album, { upsert: true }, function (err, numReplaced) {
      if(err) console.log(err);
      console.log(numReplaced);
    });
  });
};
exports.addUpdateAlbum = (album) => {
  albums.update({ title: album.title }, album, { upsert: true }, function (err, numReplaced) {
    if(err) console.log(err);
    console.log(numReplaced);
  });
};

/******************* Track ****************** */
exports.getTrackCount = () => {
  let deferred = Q.defer();
  tracks.count({}, function (err, count) {
    if (err) deferred.reject(err);
    else deferred.resolve(count);
  });
  return deferred.promise;
};
exports.getTracks = () => {
  let deferred = Q.defer();
  tracks.find({},function (err, docs) {
    if (err) deferred.reject(err);
    else deferred.resolve(docs);
  });
  return deferred.promise;
};
exports.getTrackById = (trackId) => {
  let deferred = Q.defer();
  tracks.findOne({'id': trackId},function (err, docs) {
    if (err) deferred.reject(err);
    else deferred.resolve(docs);
  });
  return deferred.promise;
};
exports.getTrackByFileName = (fileName) => {
  let deferred = Q.defer();
  tracks.findOne({'fileName': fileName},function (err, docs) {
    if (err) deferred.reject(err);
    else deferred.resolve(docs);
  });
  return deferred.promise;
};
exports.getTracksByFileNames = (fileNames) => {
  let deferred = Q.defer();
  tracks.find({fileName: {$in:fileNames}},function (err, docs) {
    if (err) deferred.reject(err);
    else deferred.resolve(docs);
  });
  return deferred.promise;
};
exports.getTracksByIds = (trackIds) => {
  let deferred = Q.defer();
  tracks.find({'id': trackId},function (err, docs) {
    if (err) deferred.reject(err);
    else deferred.resolve(docs);
  });
  return deferred.promise;
};
exports.getTracksByAlbumId = (albumId) => {
  let deferred = Q.defer();
  tracks.find({'albumId': albumId},function (err, docs) {
    if (err) deferred.reject(err);
    else deferred.resolve(docs);
  });
  return deferred.promise;
};
exports.getTrackByAlbumName = (albumName) => {
  let deferred = Q.defer();
  tracks.findOne({'album': albumName},function (err, docs) {
    if (err) deferred.reject(err);
    else deferred.resolve(docs);
  });
  return deferred.promise;
};
exports.insertTracks = (newtracks) => {
  tracks.insert(newtracks, function (err, newDocs) {
    if(err) console.log(err);
  });
};
exports.addUpdateTracks = (tracksToAdd) => {
  tracksToAdd.forEach(function(track) {
    tracks.update({ title: track.title }, track, { upsert: true }, function (err, numReplaced) {
      if(err) console.log(err);
      console.log(numReplaced);
    });
  });
};
exports.addUpdateTrack = (track) => {
  tracks.update({ title: track.title }, track, { upsert: true }, function (err, numReplaced) {
    if(err) console.log(err);
    console.log(numReplaced);
  });
};

/******************* Favs ****************** */
exports.getFavTracks = () => {
  let deferred = Q.defer();
  tracks.find({'favIcon': 'favorite'},function (err, docs) {
    if (err) deferred.reject(err);
    else deferred.resolve(docs);
  });
  return deferred.promise;
};

/******************* Playlists ****************** */
exports.getPlaylists = () => {
  let deferred = Q.defer();
  tracks.find({playlists: { $exists: true }},{playlists:1, _id:0},function (err, docs) {
    if (err) deferred.reject(err);
    else {
      if (docs.length > 1) {
        let unique = Array.from(new Set(docs.map(function(doc){return doc.playlists}).reduce(function(a,b){return a.concat(b)})));
        deferred.resolve(unique);
      } else {
        deferred.resolve(docs);
      }
    }
  });
  return deferred.promise;
};
exports.getPlaylistTracks = (playlistId) => {
  let deferred = Q.defer();
  tracks.find({$where:function(){return this.playlists.indexOf(playlistId) > -1;}},function (err, docs) {
    if (err) deferred.reject(err);
    else deferred.resolve(docs);
  });
  return deferred.promise;
};
exports.getPlaylistArt = (playlistId) => {

};

/******************* Search ****************** */
exports.searchTracks = (text) => {
  let deferred = Q.defer();
  tracks.find({$where:function(){return this.playlists.indexOf(playlistId) > -1;}},function (err, docs) {
    if (err) deferred.reject(err);
    else deferred.resolve(docs);
  });
  return deferred.promise;
};
