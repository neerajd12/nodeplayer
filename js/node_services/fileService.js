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
    if (err) console.error(err);
});
const db = require('./dbService');
let musicDir = '',
diskWatcher;

function removeTrackFromCache(file){
  let index = musicData['tracks'].findIndex(function(data){
      return data.fileName === file;
  });
  if (index > -1 ) {
    musicData['tracks'].splice(index, 1);
  }
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
        pushToClient = true;
        addTracksToCache([path]).then(function(data){
          log('File', path, 'has been added');
        }, function(err){});
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

function processMetaData(files, callBack){
  let deferred = Q.defer(),
  musicData={
    'albums':[],
    'tracks':[]
  },
  tracksProcessed=0;
  files.forEach(function(file) {
    let index = musicData['tracks'].findIndex(function(data){return data.fileName === file;});
    if (index == -1 ) {
      try{
        let parser = mm(fs.createReadStream(file), { duration: true }, function (err, metadata) {
          if (err) {
            log(err);
            tracksProcessed++;
          }
          else {
            tracksProcessed++;
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
          }
          if(tracksProcessed === files.length){
            deferred.resolve(musicData);
          }
        });
      } catch(err){
        log(err);
        deferred.resolve(musicData);
      }
    } else {
      tracksProcessed++;
      if(tracksProcessed === files.length){
        deferred.resolve(musicData);
      }
    }
  });
  return deferred.promise;
}

function addTracksToCache(files) {
  let deferred = Q.defer();
  processMetaData(files).then(function(data) {
    InitWatcher();
    db.getAlbumCount().then(function(count) {
      if (count == 0) {
        db.insertAlbums(data['albums'])
      } else {
        db.addUpdateAlbums(data['albums'])
      }
    },function(err) {
      console.log(err);
    });
    db.getTrackCount().then(function(count) {
      if (count == 0) {
        db.insertTracks(data['tracks'])
      } else {
        db.addUpdateTracks(data['tracks'])
      }
    },function(err) {
      console.log(err);
    });
    deferred.resolve(data);
  }, function(err){
    InitWatcher();
    deferred.reject(err);
  });
  return deferred.promise;
};

function refreshCache() {
  diskWatcher.close();
  diskWatcher = undefined;
  glob(musicDir+"**/*.mp3", null, function (err, files) {
    if (!err) addTracksToCache(files);
  });
};

function setMusicDir(newDir) {
  db.getConfig().update({ musicDir: musicDir}, { musicDir: newDir}, { upsert: true }, function (err, numReplaced) {
    if(err) console.log(err);
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
  let deferred = Q.defer();
  glob(musicDir+"**/*.mp3", null, function (err, files) {
    if (err || files.length <= 0) {
      InitWatcher();
      deferred.reject(err || 'error getting music');
    } else {
      addTracksToCache(files).then(function(data){
        deferred.resolve(data);
      }, function(err){
        deferred.reject(err);
      });
    }
  });
  return deferred.promise;
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
