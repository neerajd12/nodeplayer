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
mkdirp(dataDir, (err) => {
    if (err) error(err);
});
const db = require('./dbService'),
MSG_TYPE = {
  INIT: 'INIT',
  PROCESSING:'PROCESSING',
  UPDATE: 'UPDATE',
  ADD: 'ADD',
  REMOVE: 'REMOVE',
  EMPTY: 'EMPTY',
  ERROR: 'ERROR'
};
let musicHome = os.homedir() + path.sep + "Music" + path.sep,
diskWatcher = undefined,
winRef = undefined,
cacheing = false;

notifyUI = (msgType) => {
  winRef.send('musicUpdate', msgType);
  InitWatcher();
};

removeTrackFromCache = (file) => {
  db.removeTrack(file);
  notifyUI(MSG_TYPE.REMOVE);
};

InitWatcher = () => {
  if (!diskWatcher) {
    diskWatcher = chokidar.watch(musicHome, {
        ignored: /[\/\\]\./,
        persistent: true,
        followSymlinks:false,
        ignorePermissionErrors: true,
        atomic: true,
        ignoreInitial:true
      });
    diskWatcher
    .on('add', (path) => {
      let tt = path.split('.');
      if (supportedFiles.indexOf(tt[tt.length-1]) > -1) {
        if (!cacheing) {
          cacheing = true;
          setTimeout(updtaeMusicCache, 1000);
        }
      };
    })
    .on('addDir', (path) => {
      if (!cacheing) {
        cacheing = true;
        setTimeout(updtaeMusicCache, 1000);
      }
      log('Directory', path, 'has been added');
    })
    .on('unlink', (path) => {
      log('File', path, 'has been removed');
      removeTrackFromCache(path);
    })
    .on('unlinkDir', (path) => {
      log('Directory', path, 'has been removed');
    })
    .on('error', (error) => { log('Error happened', error); })
    .on('ready', () => { log('Initial scan complete. Ready for changes.'); });
  }
};

 createAlbumArt = (bitmap, file) => {
  fs.exists(file, (exists) => {
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

createAlbumData = (metadata, albumId, picture) => {
  return {
    '_id': albumId,
    'title': metadata.album,
    'picture': picture,
    'genre': metadata.genre,
    'year': metadata.year,
    'artist': metadata.albumartist
  };
};

createTrackData = (metadata, trackId, albumId, fileName, picture) => {
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

createMusicData = (files) => {
  let musicData={'albums':[],'tracks':[]};
  let deferred = Q.defer();
  files.forEach((file) => {
    try{
      mm(fs.createReadStream(file), { duration: true }, (err, metadata) => {
        if (err) {
          musicData['tracks'].push({_id:'none'});
        } else {
          let image = metadata.picture;
          let picture = 'img/album-placeholder.jpg';
          if (image.length > 0) {
              picture = dataDir+metadata.album.replace(/\W/g,'')+"_"+metadata.year+"."+image[0].format;
              createAlbumArt(image[0].data, picture);
          }
          let existingAlbum = musicData['albums'].find((data) => {
              if (metadata.albumartist && data.albumartist) {
                return data.title === metadata.album
                        && data.year === metadata.year
                        && data.albumartist.toString() === metadata.albumartist.toString();
              } else {
                return data.title === metadata.album && data.year === metadata.year;
              }
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

processMetaData = (files, callFrom) => {
  createMusicData(files).then((musicData) => {
    musicData['tracks'] = musicData['tracks'].filter((t) => {return t._id != 'none' });
      db.addUpdateAlbums(musicData['albums']).then((num) => {
        db.addUpdateTracks(musicData['tracks']).then((num) => {
          cacheing = false;
          if (num > 0) notifyUI(MSG_TYPE.UPDATE);
          else if (callFrom == 'init')  notifyUI(MSG_TYPE.EMPTY);
        },(err) => {notifyUI(MSG_TYPE.ERROR);});
      },(err) => {notifyUI(MSG_TYPE.ERROR);});
  },(err) => {notifyUI(MSG_TYPE.ERROR);});
};

setMusicDir = (newDir) => {
  db.getConfig().update({_id:'mainConfig'}, { musicHome: newDir}, {}, (err, numReplaced) => {
    if(err) log(err);
  });
  musicHome = newDir;
};

const reSyncCache = () => {
  db.getTracks().then((tracks) => {
    let deleted = false;
    tracks.forEach((track, index, tracks)=> {
      fs.exists(track.fileName, (exists) => {
        if(!exists) {
          deleted = true;
          removeTrackFromCache(track.fileName);
        }
        if (deleted && index === tracks.length-1) notifyUI(MSG_TYPE.REMOVE);
      });
    });
  },(err) => {});
  glob(musicHome+"**/*.mp3", null, (err, files) => {
    if (!err && files.length > 1) processMetaData(files, 'init');
  });
}

exports.initMusicCache = () => {
  db.getTrackCount().then((count) => {
    if (count > 0) notifyUI(MSG_TYPE.INIT);
    else notifyUI(MSG_TYPE.PROCESSING);
    db.getConfig().findOne({_id:'mainConfig'},(err, doc) => {
      if (!err && doc) musicHome = doc.musicHome;
      reSyncCache();
    });
  },(err) => {
    notifyUI(MSG_TYPE.ERROR);
  });
};

const updtaeMusicCache = () => {
  db.getConfig().findOne({_id:'mainConfig'},(err, doc) => {
    if (!err && doc) musicHome = doc.musicHome;
    glob(musicHome+"**/*.mp3", null, (err, files) => {
      if (!err && files.length > 0) processMetaData(files, 'update');
    });
  });
};

exports.updateMusicHome = (newPath) => {
  if ((newPath + path.sep) !== musicHome) {
    setMusicDir(newPath + path.sep);
    diskWatcher.close();
    diskWatcher = undefined;
    updtaeMusicCache();
  }
};

exports.getMusicDir = () => {
  return musicHome;
};

exports.getDB = () => {
  return db;
};

exports.setWinRef = (win) => {
  winRef = win;
};
