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
tracks.ensureIndex({ fieldName: 'artist', unique: false }, function (err) {if(err) console.log(err);});
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
//.then(function(doc){},function(err){});
exports.getAlbumByTrackId = (trackId) => {
  let deferred = Q.defer();
  getTrackById(trackId).then(function(doc){
    deferred.resolve(getAlbumById(doc.id));
  },function(err){
    deferred.reject(err);
  });
  return deferred.promise;
};
exports.getAlbumByTrackName = (trackName) => {
  let deferred = Q.defer();
  getTrackByFileName(trackName).then(function(doc){
    deferred.resolve(getAlbumById(doc.id));
  },function(err){
    deferred.reject(err);
  });
  return deferred.promise;
};
exports.insertAlbums = (newAlbums) => {
  albums.insert(newAlbums, function (err, newDocs) {
    if(err) console.log(err);
  });
};
exports.addUpdateAlbums = (albumsToAdd) => {
  albumsToAdd.forEach(function(album) {
    albums.findOne({'title': album.title},function (err, docs) {
      if (!err && !docs) {
        console.log(album.title);
        insertAlbums(album);
      }
    });
  });
};
exports.addUpdateAlbum = (album) => {
  albums.update({ title: album.title }, album, function (err, numReplaced) {
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
  tracks.find({'fileName': {$in:fileNames}},function (err, docs) {
    if (err) deferred.reject(err);
    else deferred.resolve(docs);
  });
  return deferred.promise;
};
exports.getTracksByIds = (trackIds) => {
  let deferred = Q.defer();
  tracks.find({'id': {$in:trackIds}},function (err, docs) {
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
exports.getTracksNamesByAlbumId = (albumId) => {
  let deferred = Q.defer();
  tracks.find({'albumId': albumId}, {fileName: 1, _id: 0 }, function (err, docs) {
    if (err) deferred.reject(err);
    else deferred.resolve(docs.map(function(val){return val.fileName}));
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
    tracksToAdd.findOne({'fileName': track.fileName},function (err, docs) {
      if (!err && !docs) {
        console.log(track.title);
        insertTracks(album);
      }
    });
  });
};
exports.addUpdateTrack = (track) => {
  tracks.update({ title: track.title }, track, function (err, numReplaced) {
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
exports.updateTracksFavIcon = (trackIds, icon) => {
  tracks.update({'id':{ $in:trackIds}}, {$set: {'favIcon': icon}}, {multi: true}, function(err, numReplaced){});
};
exports.updateAlbumFavIcon = (albumId, icon) => {
  tracks.update({'albumId': albumId}, {$set: {'favIcon': icon}}, {multi: true}, function(err, numReplaced){});
};

/******************* Playlists ****************** */
exports.getPlaylists = () => {
  let deferred = Q.defer();
  tracks.find({playlists: { $exists: true }}, {playlists:1, _id:0}, function (err, docs) {
    if (err) deferred.reject(err);
    else {
      let playlists = docs.map(function(doc){return doc.playlists});
      if (playlists.length > 1) {
        deferred.resolve(Array.from(new Set(playlists.reduce(function(a,b){return a.concat(b)}))));
      } else {
        deferred.resolve(playlists);
      }
    }
  });
  return deferred.promise;
};
exports.getPlaylistTracks = (playlistId) => {
  let deferred = Q.defer();
  tracks.find({playlists:{ $in:[playlistId]}},function (err, docs) {
    if (err) deferred.reject(err);
    else deferred.resolve(docs);
  });
  return deferred.promise;
};
exports.getPlaylistTrackNames = (playlistId) => {
  let deferred = Q.defer();
  tracks.find({playlists:{ $in:[playlistId]}}, { fileName: 1, _id: 0 }, function (err, docs) {
    if (err) deferred.reject(err);
    else deferred.resolve(docs.map(function(val){return val.fileName}));
  });
  return deferred.promise;
};
exports.getPlaylistArt = (playlistId) => {
  let deferred = Q.defer();
  tracks.find({playlists:{ $in:[playlistId]}}, { picture: 1, _id: 0 }, function (err, docs) {
    if (err) deferred.reject(err);
    else {
      let arts = docs.map(function(doc){return doc.picture});
      if (arts.length > 1) {
        deferred.resolve(Array.from(new Set(arts)));
      } else {
        deferred.resolve(arts);
      }
    }
  });
  return deferred.promise;
};
exports.addTracksToPlayList = (trackIds, playlistId) => {
  tracks.update({'id':{$in:trackIds}}, {$addToSet: {'playlists': playlistId}}, { multi: true }, function(err,docs){});
};
exports.removeTracksFromPlaylist = (trackIds, playlistId) => {
  tracks.update({'id':{$in:trackIds}}, {$pull: {'playlists': playlistId }}, { multi: true }, function(err,docs){});
};
exports.addAlbumToPlayList = (albumId, playlistId) => {
  tracks.update({'albumId': albumId}, {$addToSet: {'playlists': playlistId}}, { multi: true }, function(err,docs){});
};
exports.removeAlbumFromPlaylist = (albumId, playlistId) => {
  tracks.update({'albumId': albumId}, {$pull: {'playlists': playlistId}}, {multi: true}, function(err,docs){});
};
exports.deletePlayList = (playlistId) => {
  tracks.update({'playlists': {$in: [playlistId]}}, {$pull: {'playlists': playlistId}}, {multi:true}, function(err, count){});
};

/******************* Search ****************** */
exports.searchTracks = (searchText) => {
  let deferred = Q.defer();
  let regexp = new RegExp(searchText, "i");
  tracks.find({ $or: [
      { 'fileName': {$regex: regexp}},
      { 'title': {$regex: regexp}},
      { 'album': {$regex: regexp}},
      { 'artist': {$regex: regexp}}]
  }, function (err, docs) {
    if (err) deferred.reject(err);
    else deferred.resolve(docs);
  });
  return deferred.promise;
};
