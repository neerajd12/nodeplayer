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
let musicDir = '',
diskWatcher = undefined,
winRef = undefined;

function notifyUI(msgType) {
  winRef.send('musicUpdate', msgType);
};

function removeTrackFromCache(file){
  // TODO: delete from DB
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
        addTracksToCache([path],MSG_TYPE.UPDATE);
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
    'id': albumId,
    'title': metadata.album,
    'picture': picture,
    'genre': metadata.genre,
    'year': metadata.year,
    'artist': metadata.albumartist
  };
};

function createTrackData(metadata, trackId, albumId, fileName, picture){
  return {
    'id': trackId,
    'albumId': albumId,
    'title': metadata.title,
    'album': metadata.album,
    'artist': metadata.artist,
    'duration': (metadata.duration/60).toFixed(2),
    'number': metadata.disk.no,
    'fileName' : fileName,
    'picture': picture,
    'favIcon': 'favorite_border'
  }
};

function processMetaData(files, msgType) {
  let musicData={'albums':[],'tracks':[]};
  files.forEach(function (file, index, files) {
    try{
      let parser = mm(fs.createReadStream(file), { duration: true }, function (err, metadata) {
        if (!err) {
          let image = metadata.picture;
          let picture = 'img/album-placeholder.jpg';
          if (image.length > 0) {
              picture = dataDir+metadata.album.replace(/\W/g,'')+"."+image[0].format;
              createAlbumArt(image[0].data, picture);
          }
          let existingAlbum = musicData['albums'].find(function(data){
              return data.title === metadata.album;
          });
          let trackId = uuid.v1();
          if(existingAlbum) {
            existingAlbum.picture = picture
            musicData['tracks'].push(createTrackData(metadata, trackId, existingAlbum.id, file, picture));
          } else {
              let albumId = uuid.v1();
              musicData['albums'].push(createAlbumData(metadata, albumId, picture));
              musicData['tracks'].push(createTrackData(metadata, trackId, albumId, file, picture));
          }
        };
        if(index === files.length-1) {
          InitWatcher();
          db.addUpdateAlbums(musicData['albums']).then(function(docs) {
            notifyUI(msgType);
          },function(err) {
            notifyUI(msgType);
          });
          db.insertTracks(musicData['tracks']);
        };
      });
    } catch(err){
      log(err);
    }
  });
};

function addTracksToCache(files, msgType) {
  db.getTracksByFileNames(files).then(function(docs) {
    let existing = docs.map(function(val){return val.fileName});
    let toAdd = files.filter(function(val){return existing.indexOf(val) == -1;});
    if (toAdd.length == 0) {
      InitWatcher();
      notifyUI(msgType);
    } else {
      processMetaData(toAdd, msgType)
    }
  },function(err){
    InitWatcher();
    notifyUI(msgType);
  });
};

function refreshCache() {
  diskWatcher.close();
  diskWatcher = undefined;
  glob(musicDir+"**/*.mp3", null, function (err, files) {
    if (!err) addTracksToCache(files,MSG_TYPE.UPDATE);
  });
};

function setMusicDir(newDir) {
  db.getConfig().update({ musicDir: musicDir}, { musicDir: newDir}, { upsert: true }, function (err, numReplaced) {
    if(err) log(err);
  });
  musicDir = newDir;
};

db.getConfig().find({},function (err, docs) {
  if (err) {
    musicDir = os.homedir() + path.sep + "Music";
  } else {
    if (docs.length > 0) {
      musicDir = docs[0].musicDir;
    } else {
      setMusicDir(os.homedir() + path.sep + "Music");
    }
  }
});

exports.initMusicCache = () => {
  glob(musicDir+"**/*.mp3", null, function (err, files) {
    if (err || files.length < 1) {
      InitWatcher();
      notifyUI(MSG_TYPE.INIT);
    } else {
      addTracksToCache(files, MSG_TYPE.INIT);
    }
  });
};

exports.updateMusicHome = (newPath) => {
  if ((newPath + path.sep) !== musicDir) {
    setMusicDir(newPath + path.sep);
    refreshCache();
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
