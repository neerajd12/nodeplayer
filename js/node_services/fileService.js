const os = require('os'),
fs = require('fs'),
path = require('path'),
util = require('util'),
glob = require("glob"),
mm = require('musicmetadata'),
uuid = require('uuid'),
chokidar = require('chokidar'),
Q = require('q'),
log = console.log.bind(console),
supportedFiles=['mp3','wav'],
mkdirp = require('mkdirp');
dataDir = os.homedir() + path.sep +'.nodeplayerdata' + path.sep;
mkdirp(dataDir, function (err) {
    if (err) error(err);
});
const db = require('./dbService'),
MSG_TYPE = {UPDATE: 'update', INIT: 'init'};
let musicDir = os.homedir() + path.sep + "Music" + path.sep,
diskWatcher = undefined,
winRef = undefined;

function notifyUI(msgType) {
  winRef.send('musicUpdate', msgType);
  InitWatcher();
};

function removeTrackFromCache(file) {
  db.removeTrack(file);
};

function InitWatcher() {
  if (!diskWatcher) {
    diskWatcher = chokidar.watch(musicDir, {
        ignored: /[\/\\]\./,
        persistent: true,
        followSymlinks:false,
        ignorePermissionErrors: true,
        atomic: true,
        ignoreInitial:true
      });
    diskWatcher
    .on('add', function(path) {
      let tt = path.split('.');
      if (supportedFiles.indexOf(tt[tt.length-1]) > -1) {
        processMetaData([path],MSG_TYPE.UPDATE);
      };
    })
    .on('addDir', function(path) {
      log('Directory', path, 'has been added');
    })
    .on('unlink', function(path) {
      log('File', path, 'has been removed');
      removeTrackFromCache(path);
    })
    .on('unlinkDir', function(path) {
      log('Directory', path, 'has been removed');
    })
    .on('error', function(error) { log('Error happened', error); })
    .on('ready', function() { log('Initial scan complete. Ready for changes.'); });
  }
};

function createAlbumArt(bitmap, file) {
  fs.exists(file, function (exists) {
    if(!exists){
      try{
        fs.writeFileSync(file, bitmap);
        log('******** File created ********');
      }catch(err){
        log(err);
      }
    }
  });
};

function createAlbumData(metadata, albumId, picture){
  return {
    '_id': albumId,
    'title': metadata.album,
    'picture': picture,
    'genre': metadata.genre,
    'year': metadata.year,
    'artist': metadata.albumartist
  };
};

function createTrackData(metadata, trackId, albumId, fileName, picture){
  return {
    '_id': trackId,
    'albumId': albumId,
    'title': metadata.title,
    'album': metadata.album,
    'artist': metadata.artist,
    'duration': (metadata.duration/60).toFixed(2),
    'number': metadata.disk.no,
    'fileName' : fileName,
    'picture': picture
  }
};

function createMusicData(files) {
  let musicData={'albums':[],'tracks':[]};
  let deferred = Q.defer();
  files.forEach(function(file){
    try{
      mm(fs.createReadStream(file), { duration: true }, function (err, metadata) {
        if (err) {
          musicData['tracks'].push({_id:'none'});
        } else {
          let image = metadata.picture;
          let picture = 'img/album-placeholder.jpg';
          if (image.length > 0) {
              picture = dataDir+metadata.album.replace(/\W/g,'')+"_"+metadata.year+"."+image[0].format;
              createAlbumArt(image[0].data, picture);
          }
          let existingAlbum = musicData['albums'].find(function(data){
              if (metadata.albumartist && data.albumartist) {
                return data.title === metadata.album
                        && data.year === metadata.year
                        && data.albumartist.toString() === metadata.albumartist.toString();
              }
              return data.title === metadata.album && data.year === metadata.year;
          });
          let trackId = uuid.v1();
          if(existingAlbum) {
            if (existingAlbum.picture == 'img/album-placeholder.jpg') {
              existingAlbum.picture = picture;
            }
            if (metadata.year && existingAlbum.year.length == 0) {
              existingAlbum.year = metadata.year
            }
            if (metadata.genre) {
              existingAlbum.genre = [...new Set([...existingAlbum.genre ,...metadata.genre])];
            }
            if (metadata.artist) {
              existingAlbum.artist = [...new Set([...existingAlbum.artist ,...metadata.artist])];
            }
            musicData['tracks'].push(createTrackData(metadata, trackId, existingAlbum._id, file, existingAlbum.picture));
          } else {
              let albumId = uuid.v1();
              musicData['albums'].push(createAlbumData(metadata, albumId, picture));
              musicData['tracks'].push(createTrackData(metadata, trackId, albumId, file, picture));
          }
        };
        if (musicData['tracks'].length == files.length) {
          deferred.resolve(musicData);
        }
      });
    } catch(err) {
      log(err);
      musicData['tracks'].push({_id:'none'});
      if (musicData['tracks'].length == files.length) {
        deferred.resolve(musicData);
      }
    }
  });
  return deferred.promise;
}

function processMetaData(files, msgType) {
  createMusicData(files).then(function(musicData){
    musicData['tracks'] = musicData['tracks'].filter(function(t){return t._id != 'none' });
    if (msgType == MSG_TYPE.UPDATE) {
      db.addUpdateAlbums(musicData['albums']).then(function(docs){},function(err){});
      db.addUpdateTracks(musicData['tracks']).then(function() {notifyUI(msgType);},function(err) {notifyUI(msgType);});
    } else {
      db.insertAlbums(musicData['albums']).then(function(){},function(err){});
      db.insertTracks(musicData['tracks']).then(function() {notifyUI(msgType);},function(err) {notifyUI(msgType);});
    }
  },function(err){notifyUI(msgType);});
};

function setMusicDir(newDir) {
  db.getConfig().update({ musicDir: musicDir}, { musicDir: newDir}, { upsert: true }, function (err, numReplaced) {
    if(err) log(err);
  });
  musicDir = newDir;
};

db.getConfig().find({},function (err, docs) {
  if (!err && docs && docs.length > 0) {
    musicDir = docs[0].musicDir;
  } else {
    setMusicDir(musicDir);
  }
});

exports.initMusicCache = () => {
  glob(musicDir+"**/*.mp3", null, function (err, files) {
    if (err || files.length < 1) {
      notifyUI(MSG_TYPE.INIT);
    } else {
      processMetaData(files, MSG_TYPE.INIT)
    }
  });
};

exports.updateMusicHome = (newPath) => {
  if ((newPath + path.sep) !== musicDir) {
    setMusicDir(newPath + path.sep);
    diskWatcher.close();
    diskWatcher = undefined;
    glob(musicDir+"**/*.mp3", null, function (err, files) {
      if (!err && files.length > 0) {
        db.getTracksByFileNames(files).then(function(docs) {
          let existing = docs.map(function(val){return val.fileName});
          let toAdd = files.filter(function(val){return existing.indexOf(val) == -1;});
          if (toAdd.length != 0) {
            processMetaData(toAdd, MSG_TYPE.UPDATE)
          }
        },function(err) {
        });
      }
    });
  }
};

exports.getMusicDir = () => {
  return musicDir;
};

exports.getDB = () => {
  return db;
};

exports.setWinRef = (win) => {
  winRef = win;
};
