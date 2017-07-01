const Datastore = require('nedb'),
os = require('os'),
path = require('path'),
Q = require('q'),
dataDir = os.homedir() + path.sep +'.nodeplayerdata' + path.sep,
albums = new Datastore(),
tracks = new Datastore();
playlists = new Datastore({ filename: dataDir+'playlists', autoload: true });
config = new Datastore({ filename: dataDir+'config', autoload: true });

albums.ensureIndex({ fieldName: 'title', unique: false }, function (err) {if(err) console.log(err);});

tracks.ensureIndex({ fieldName: 'fileName', unique: true }, function (err) {if(err) console.log(err);});
tracks.ensureIndex({ fieldName: 'title', unique: false }, function (err) {if(err) console.log(err);});
tracks.ensureIndex({ fieldName: 'artist', unique: false }, function (err) {if(err) console.log(err);});
tracks.ensureIndex({ fieldName: 'albumId', unique: false }, function (err) {if(err) console.log(err);});
tracks.ensureIndex({ fieldName: 'album', unique: false }, function (err) {if(err) console.log(err);});

playlists.count({_id:'favorites'}, function (err, count) {
  if (!err && count == 0) {
    playlists.insert({ _id: 'favorites',tracks:[]}, function (err, newDoc) {console.log(newDoc);});
  }
});

/******************* Config ****************** */
exports.getConfig = () => {
  return config;
};

/******************* Favs ****************** */
exports.getFavTracks = () => {
  return getPlaylistTrackNames('favorites');
};
const updateTracksFavIcon = (trackIds, icon) => {
  if (icon === 'favorite') {
    addTracksToPlayList(trackIds, 'favorites');
  } else {
    removeTracksFromPlaylist(trackIds, 'favorites')
  }
};
exports.updateAlbumFavIcon = (albumId, icon) => {
  getTracksNamesByAlbumId(albumId).then(function(tracks) {
    updateTracksFavIcon(tracks, icon);
  });
};

/******************* Playlists ****************** */
exports.getPlaylists = () => {
  let deferred = Q.defer();
  playlists.find({},{ _id: 1, tracks:0 },function (err, docs) {
    if (err) deferred.reject(err);
    else deferred.resolve(docs.map(function(d){return d._id}));
  });
  return deferred.promise;
};
const getPlaylistTracks = (playlistId) => {
  let deferred = Q.defer();
  playlists.findOne({_id: playlistId},function (err, doc) {
    if (err) deferred.reject(err);
    else deferred.resolve(getTracksByFileNames(doc.tracks));
  });
  return deferred.promise;
};
const getPlaylistTrackNames = (playlistId) => {
  let deferred = Q.defer();
  playlists.findOne({_id: playlistId},function (err, doc) {
    if (err) deferred.reject(err);
    else deferred.resolve(doc.tracks);
  });
  return deferred.promise;
};
exports.getPlaylistArt = (playlistId) => {
  let deferred = Q.defer();
  playlists.findOne({'_id': playlistId},{ _id: 0, tracks:1 }, function (err, docs) {
    if (err) deferred.reject(err);
    else {
      tracks.find({ fileName: { $in: docs.tracks }}, { picture: 1, _id: 0 }, function (err, pictures) {
        if (err) deferred.reject(err);
        else {
          let arts = pictures.map(function(d){return d.picture});
          if (arts.length > 1) {
            deferred.resolve(Array.from(new Set(arts)));
          } else {
            deferred.resolve(arts);
          }
        }
      });
    }
  });
  return deferred.promise;
};
const addTracksToPlayList = (trackIds, playlistId) => {
  playlists.update({_id:playlistId}, {$addToSet:{tracks:{$each:trackIds}}}, {multi:true, upsert:true}, function(err,num){});
};
const removeTracksFromPlaylist = (trackIds, playlistId) => {
  playlists.update({_id:playlistId}, {$pull:{tracks:{$in:trackIds}}}, {}, function(err,num){});
};
exports.addAlbumToPlayList = (albumId, playlistId) => {
  getTracksNamesByAlbumId(albumId).then(function(fileNames) {
    addTracksToPlayList(fileNames, playlistId)
  },function(err){});
};
exports.removeAlbumFromPlaylist = (albumId, playlistId) => {
  getTracksNamesByAlbumId(albumId).then(function(fileNames) {
    removeTracksFromPlaylist(fileNames, playlistId)
  },function(err){});
};
exports.deletePlayList = (playlistId) => {
  playlists.remove({_id: playlistId}, {}, function(err, numRemoved){});
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
const getAlbumById = (albumId) => {
  let deferred = Q.defer();
  albums.findOne({_id: albumId},function (err, docs) {
    if (err) deferred.reject(err);
    else deferred.resolve(docs);
  });
  return deferred.promise;
};
exports.getAlbumByName = (name) => {
  let deferred = Q.defer();
  albums.findOne({title: name},function (err, docs) {
    if (err) deferred.reject(err);
    else deferred.resolve(docs);
  });
  return deferred.promise;
};
//.then(function(doc){},function(err){});
exports.getAlbumByTrackId = (trackId) => {
  let deferred = Q.defer();
  getTrackById(trackId).then(function(doc){
    deferred.resolve(getAlbumById(doc._id));
  },function(err){
    deferred.reject(err);
  });
  return deferred.promise;
};
exports.getAlbumByTrackName = (trackName) => {
  let deferred = Q.defer();
  getTrackByFileName(trackName).then(function(doc){
    deferred.resolve(getAlbumById(doc._id));
  },function(err){
    deferred.reject(err);
  });
  return deferred.promise;
};
const insertAlbums = (newAlbums) => {
  let deferred = Q.defer();
  albums.insert(newAlbums, function (err, newDocs) {
    if(err) console.log(err);
    deferred.resolve();
  });
  return deferred.promise;
};
exports.addUpdateAlbums = (albumsToAdd) => {
  let deferred = Q.defer();
  albumsToAdd.forEach(function(album, index, albumsToAdd) {
    albums.findOne({title: album.title},function (err, docs) {
      if (!err && docs == null) insertAlbums(album);
    });
    if (index === albumsToAdd.length-1) deferred.resolve();
  });
  return deferred.promise;
};
exports.updateAlbum = (album) => {
  albums.update({ title: album.title }, album, function (err, numReplaced) {
    if(err) console.log(err);
  });
};
const removeAlbum = (id) => {
  albums.remove({_id:id}, {}, function (err, numRemoved) {
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
const getTrackById = (trackId) => {
  let deferred = Q.defer();
  tracks.findOne({_id: trackId},function (err, docs) {
    if (err) deferred.reject(err);
    else deferred.resolve(docs);
  });
  return deferred.promise;
};
const getTrackByFileName = (fileName) => {
  let deferred = Q.defer();
  tracks.findOne({'fileName': fileName},function (err, docs) {
    if (err) deferred.reject(err);
    else deferred.resolve(docs);
  });
  return deferred.promise;
};
const getTracksByFileNames = (fileNames) => {
  let deferred = Q.defer();
  tracks.find({ fileName: { $in: fileNames }},function (err, docs) {
    if (err) deferred.reject(err);
    else deferred.resolve(docs);
  });
  return deferred.promise;
};
exports.getTracksByIds = (trackIds) => {
  let deferred = Q.defer();
  tracks.find({ _id: { $in: trackIds }},function (err, docs) {
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
const insertTracks = (newtracks) => {
  let deferred = Q.defer();
  tracks.insert(newtracks, function (err, newDocs) {
    if(err) console.log(err);
    deferred.resolve();
  });
  return deferred.promise;
};
exports.addUpdateTracks = (tracksToAdd) => {
  let deferred = Q.defer();
  tracksToAdd.forEach(function(track, index, tracksToAdd) {
    tracks.findOne({_id: track._id},function (err, docs) {
      if (!err && docs == null) insertTracks(track);
      if (index === tracksToAdd.length-1) deferred.resolve();
    });
  });
  return deferred.promise;
};
exports.addUpdateTrack = (track) => {
  tracks.update({ title: track.title }, track, function (err, numReplaced) {
    if(err) console.log(err);
  });
};
exports.removeTrack = (fileName) => {
  tracks.findOne({'fileName': fileName},function (err, doc) {
    if (!err && doc) {
      tracks.remove({'fileName' : fileName}, { multi: true }, function (err, numRemoved) {
        tracks.find({'albumId': doc.albumId}, {fileName: 1, _id: 0 }, function (err, docs) {
          if(!err && docs.length == 0) {
            removeAlbum(doc.albumId);
          }
        });
      });
    }
  });
  playlists.update({tracks: { $in: [fileName] }}, {$pull: { tracks : fileName }}, {}, function(err,docs){
    if (err) console.log(err);
  });
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

/******************* Remove ****************** */
exports.cleanDB = (name) => {
  tracks.remove({}, { multi: true }, function (err, numRemoved) {
  });
  albums.remove({}, { multi: true }, function (err, numRemoved) {
  });
};

exports.removeAlbum = removeAlbum;
exports.getTrackById = getTrackById;
exports.getAlbumById = getAlbumById;
exports.getTrackByFileName = getTrackByFileName;
exports.insertAlbums = insertAlbums;
exports.getTracksByFileNames = getTracksByFileNames;
exports.insertTracks = insertTracks;
exports.updateTracksFavIcon = updateTracksFavIcon;
exports.getPlaylistTracks = getPlaylistTracks;
exports.addTracksToPlayList = addTracksToPlayList;
exports.removeTracksFromPlaylist = removeTracksFromPlaylist;
exports.getPlaylistTrackNames = getPlaylistTrackNames;
