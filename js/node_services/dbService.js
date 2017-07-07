const Datastore = require('nedb'),
os = require('os'),
path = require('path'),
Q = require('q'),
dataDir = os.homedir() + path.sep +'.nodeplayerdata' + path.sep,
albums = new Datastore({ filename: dataDir+'albums', autoload: true }),
tracks = new Datastore({ filename: dataDir+'tracks', autoload: true }),
playlists = new Datastore({ filename: dataDir+'playlists', autoload: true }),
config = new Datastore({ filename: dataDir+'config', autoload: true });

albums.ensureIndex({ fieldName: 'title', unique: false }, (err) => {if(err) console.log(err);});

tracks.ensureIndex({ fieldName: 'fileName', unique: true }, (err) => {if(err) console.log(err);});
tracks.ensureIndex({ fieldName: 'title', unique: false }, (err) => {if(err) console.log(err);});
tracks.ensureIndex({ fieldName: 'artist', unique: false }, (err) => {if(err) console.log(err);});
tracks.ensureIndex({ fieldName: 'albumId', unique: false }, (err) => {if(err) console.log(err);});
tracks.ensureIndex({ fieldName: 'album', unique: false }, (err) => {if(err) console.log(err);});

playlists.count({_id:'favorites'}, (err, count) => {
  if (!err && count == 0) {
    playlists.insert({ _id: 'favorites',tracks:[]}, (err, newDoc) => {});
  }
});

/******************* Config ****************** */
config.count({},(err, count) => {
  if (count == 0) {
    config.insert({
      _id:'mainConfig',
      musicHome: os.homedir() + path.sep + "Music" + path.sep,
      theme:'default',
      queue:[]
    }, (err, newDoc) => {});
  }
});

exports.getConfig = () => {
  return config;
};

exports.getMusicHome = () => {
  let deferred = Q.defer();
  config.findOne({_id:'mainConfig'},{}, (err, doc) => {
    if (err) deferred.reject(err);
    else deferred.resolve(docs.musicHome);
  });
  return deferred.promise;
};
exports.getTheme = () => {
  let deferred = Q.defer();
  config.findOne({_id:'mainConfig'},{}, (err, doc) => {
    if (err) { console.log(err);deferred.reject(err);}
    else deferred.resolve(doc.theme);
  });
  return deferred.promise;
};
exports.updateTheme = (oldTheme, newTheme) => {
  let deferred = Q.defer();
  config.update({theme:oldTheme},{theme:newTheme}, (err, num) => {
    if (err) { console.log(err);deferred.reject(err);}
    else deferred.resolve(num);
  });
  return deferred.promise;
};
exports.getQueue = () => {
  let deferred = Q.defer();
  config.findOne({_id:'mainConfig'},{}, (err, doc) => {
    if (err) deferred.reject(err);
    else deferred.resolve(doc.queue);
  });
  return deferred.promise;
};
exports.getQueueTracks = () => {
  let deferred = Q.defer();
  config.findOne({_id:'mainConfig'},{}, (err, docs) => {
    if (err) deferred.reject(err);
    else deferred.resolve(getTracksByFileNames(doc.queue));
  });
  return deferred.promise;
};
exports.addToQueue = (tracks) => {
  let deferred = Q.defer();
  config.update({_id:'mainConfig'}, {$addToSet:{queue:{$each:tracks}}}, (err, num) => {
    if (err) { console.log(err);deferred.reject(err);}
    else deferred.resolve(num);
  });
  return deferred.promise;
};

exports.removeFromQueue = (tracks) => {
  let deferred = Q.defer();
  config.update({_id:'mainConfig'}, {$pull:{queue:{$in:tracks}}}, {}, (err, num) => {
    if (err) { console.log(err);deferred.reject(err);}
    else deferred.resolve(num);
  });
  return deferred.promise;
};

exports.clearQueue = () => {
  let deferred = Q.defer();
  config.update({_id:'mainConfig'}, {queue:[]}, {}, (err, num) => {
    if (err) { console.log(err);deferred.reject(err);}
    else deferred.resolve(num);
  });
  return deferred.promise;
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
  getTracksNamesByAlbumId(albumId).then((tracks) => {
    updateTracksFavIcon(tracks, icon);
  });
};

/******************* Playlists ****************** */
exports.getPlaylists = () => {
  let deferred = Q.defer();
  playlists.find({},{ _id: 1, tracks:0 },(err, docs) => {
    if (err) deferred.reject(err);
    else deferred.resolve(docs.map((d) => {return d._id}));
  });
  return deferred.promise;
};
const getPlaylistTracks = (playlistId) => {
  let deferred = Q.defer();
  playlists.findOne({_id: playlistId},(err, doc) => {
    if (err) deferred.reject(err);
    else deferred.resolve(getTracksByFileNames(doc.tracks));
  });
  return deferred.promise;
};
const getPlaylistTrackNames = (playlistId) => {
  let deferred = Q.defer();
  playlists.findOne({_id: playlistId},(err, doc) => {
    if (err) deferred.reject(err);
    else deferred.resolve(doc.tracks);
  });
  return deferred.promise;
};
exports.getPlaylistArt = (playlistId) => {
  let deferred = Q.defer();
  playlists.findOne({'_id': playlistId},{ _id: 0, tracks:1 }, (err, docs) => {
    if (err) deferred.reject(err);
    else {
      tracks.find({ fileName: { $in: docs.tracks }}, { picture: 1, _id: 0 }, (err, pictures) => {
        if (err) deferred.reject(err);
        else {
          let arts = pictures.map((d) => {return d.picture});
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
  playlists.update({_id:playlistId}, {$addToSet:{tracks:{$each:trackIds}}}, {multi:true, upsert:true}, (err,num) => {});
};
const removeTracksFromPlaylist = (trackIds, playlistId) => {
  playlists.update({_id:playlistId}, {$pull:{tracks:{$in:trackIds}}}, {}, (err,num) => {});
};
exports.addAlbumToPlayList = (albumId, playlistId) => {
  getTracksNamesByAlbumId(albumId).then((fileNames) => {
    addTracksToPlayList(fileNames, playlistId)
  },(err) => {});
};
exports.removeAlbumFromPlaylist = (albumId, playlistId) => {
  getTracksNamesByAlbumId(albumId).then((fileNames) => {
    removeTracksFromPlaylist(fileNames, playlistId)
  },(err) => {});
};
exports.deletePlayList = (playlistId) => {
  playlists.remove({_id: playlistId}, {}, (err, numRemoved) => {});
};

/******************* Albums ****************** */

exports.getAlbumCount = () => {
  let deferred = Q.defer();
  albums.count({}, (err, count) => {
    if (err) deferred.reject(err);
    else deferred.resolve(count);
  });
  return deferred.promise;
};
exports.getAlbums = () => {
  let deferred = Q.defer();
  albums.find({},(err, docs) => {
    if (err) deferred.reject(err);
    else deferred.resolve(docs);
  });
  return deferred.promise;
};
const getAlbumById = (albumId) => {
  let deferred = Q.defer();
  albums.findOne({_id: albumId},(err, docs) => {
    if (err) deferred.reject(err);
    else deferred.resolve(docs);
  });
  return deferred.promise;
};
exports.getAlbumByName = (name) => {
  let deferred = Q.defer();
  albums.findOne({title: name},(err, docs) => {
    if (err) deferred.reject(err);
    else deferred.resolve(docs);
  });
  return deferred.promise;
};
//.then((doc) => {},(err) => {});
exports.getAlbumByTrackId = (trackId) => {
  let deferred = Q.defer();
  getTrackById(trackId).then((doc) => {
    deferred.resolve(getAlbumById(doc._id));
  },(err) => {
    deferred.reject(err);
  });
  return deferred.promise;
};
exports.getAlbumByTrackName = (trackName) => {
  let deferred = Q.defer();
  getTrackByFileName(trackName).then((doc) => {
    deferred.resolve(getAlbumById(doc._id));
  },(err) => {
    deferred.reject(err);
  });
  return deferred.promise;
};
const insertAlbums = (newAlbums) => {
  let deferred = Q.defer();
  albums.insert(newAlbums, (err, newDocs) => {
    if(err) console.log(err);
    deferred.resolve();
  });
  return deferred.promise;
};
exports.addUpdateAlbums = (albumsToAdd) => {
  let deferred = Q.defer();
  albumsToAdd.forEach((album, index, albumsToAdd) => {
      albums.findOne({$where: function () {
          return this.title == album.title && this.year == album.year && this.artist.toString() == album.artist.toString();}}
      ,(err, docs) => {
      if (!err && docs == null) insertAlbums(album);
      if (index === albumsToAdd.length-1) deferred.resolve(albumsToAdd.length);
    });
  });
  return deferred.promise;
};
exports.updateAlbum = (album) => {
  albums.update({ title: album.title }, album, (err, numReplaced) => {
    if(err) console.log(err);
  });
};
const removeAlbum = (id) => {
  albums.remove({_id:id}, {}, (err, numRemoved) => {
  });
};

/******************* Track ****************** */
exports.getTrackCount = () => {
  let deferred = Q.defer();
  tracks.count({}, (err, count) => {
    if (err) deferred.reject(err);
    else deferred.resolve(count);
  });
  return deferred.promise;
};
exports.getTracks = () => {
  let deferred = Q.defer();
  tracks.find({},(err, docs) => {
    if (err) deferred.reject(err);
    else deferred.resolve(docs);
  });
  return deferred.promise;
};
const getTrackById = (trackId) => {
  let deferred = Q.defer();
  tracks.findOne({_id: trackId},(err, docs) => {
    if (err) deferred.reject(err);
    else deferred.resolve(docs);
  });
  return deferred.promise;
};
const getTrackByFileName = (fileName) => {
  let deferred = Q.defer();
  tracks.findOne({'fileName': fileName},(err, docs) => {
    if (err) deferred.reject(err);
    else deferred.resolve(docs);
  });
  return deferred.promise;
};
const getTracksByFileNames = (fileNames) => {
  let deferred = Q.defer();
  tracks.find({ fileName: { $in: fileNames }},(err, docs) => {
    if (err) deferred.reject(err);
    else deferred.resolve(docs);
  });
  return deferred.promise;
};
exports.getTracksByIds = (trackIds) => {
  let deferred = Q.defer();
  tracks.find({ _id: { $in: trackIds }},(err, docs) => {
    if (err) deferred.reject(err);
    else deferred.resolve(docs);
  });
  return deferred.promise;
};
exports.getTracksByAlbumId = (albumId) => {
  let deferred = Q.defer();
  tracks.find({'albumId': albumId},(err, docs) => {
    if (err) deferred.reject(err);
    else deferred.resolve(docs);
  });
  return deferred.promise;
};
exports.getTracksNamesByAlbumId = (albumId) => {
  let deferred = Q.defer();
  tracks.find({'albumId': albumId}, {fileName: 1, _id: 0 }, (err, docs) => {
    if (err) deferred.reject(err);
    else deferred.resolve(docs.map((val) => {return val.fileName}));
  });
  return deferred.promise;
};
exports.getTrackByAlbumName = (albumName) => {
  let deferred = Q.defer();
  tracks.findOne({'album': albumName},(err, docs) => {
    if (err) deferred.reject(err);
    else deferred.resolve(docs);
  });
  return deferred.promise;
};
const insertTracks = (newtracks) => {
  let deferred = Q.defer();
  tracks.insert(newtracks, (err, newDocs) => {
    if(err) console.log(err);
    deferred.resolve();
  });
  return deferred.promise;
};
exports.addUpdateTracks = (tracksToAdd) => {
  let deferred = Q.defer();
  tracksToAdd.forEach((track, index, tracksToAdd) => {
    tracks.findOne({title: track.title},(err, docs) => {
      if (!err && docs == null) insertTracks(track);
      if (index === tracksToAdd.length-1) deferred.resolve(tracksToAdd.length);
    });
  });
  return deferred.promise;
};
exports.addUpdateTrack = (track) => {
  tracks.update({ title: track.title }, track, (err, numReplaced) => {
    if(err) console.log(err);
  });
};
exports.removeTrack = (fileName) => {
  tracks.findOne({'fileName': fileName},(err, doc) => {
    if (!err && doc) {
      tracks.remove({'fileName' : fileName}, { multi: true }, (err, numRemoved) => {
        tracks.find({'albumId': doc.albumId}, {fileName: 1, _id: 0 }, (err, docs) => {
          if(!err && docs.length == 0) {
            removeAlbum(doc.albumId);
          }
        });
      });
    }
  });
  playlists.update({tracks: { $in: [fileName] }}, {$pull: { tracks : fileName }}, {}, (err,docs) => {
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
  }, (err, docs) => {
    if (err) deferred.reject(err);
    else deferred.resolve(docs);
  });
  return deferred.promise;
};

/******************* Remove ****************** */
exports.cleanDB = (name) => {
  tracks.remove({}, { multi: true }, (err, numRemoved) => {
  });
  albums.remove({}, { multi: true }, (err, numRemoved) => {
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
