let os = require('os'),
fs = require('fs'),
mkdirp = require('mkdirp'),
util = require('util'),
glob = require("glob"),
mm = require('musicmetadata'),
uuid = require('uuid'),
chokidar = require('chokidar'),
Q = require('q'),
WatchJS = require("watchjs"),
log = console.log.bind(console),
supportedFiles=['mp3','wav'],
diskWatcher,
collectionWatcher = WatchJS.watch;
const musicDir = os.homedir()+"/Music/";
const dataDir = musicDir+'/.nodeplayerdata/';
let musicData={
  "albums":[],
  "tracks":[]
};
let lunrIndex = lunr(function () {
  this.field('album')
  this.field('title')
  this.field('artist')
  this.field('genre')
  this.ref('id')
});
mkdirp(dataDir, function (err) {
    if (err) console.error(err)
});
collectionWatcher(musicData, "tracks", function(prop, action, newvalue, oldvalue) {
  if (action === 'set') {
    musicData['tracks'].forEach(function(val){
      lunrIndex.add(val);
    });
  } else if (action === 'push') {
    lunrIndex.add(musicData['tracks'].find(function(val){return val.id == newvalue[0].id}));
  }
});

function lunrSearchTracks(data) {
  let deferred = Q.defer();
  let results = lunrIndex.search(data).map(function(val){return val.ref});
  deferred.resolve(musicData['tracks'].filter(function(track){return results.indexOf(track.id) > -1 }));
  return deferred.promise;
}

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

function writeDataToFile(fileName, data, msg, callBack){
  try{
    fs.writeFile(dataDir+fileName, JSON.stringify(data), function (err) {
        if (err) log(err);
        else {
          log(msg);
          if(callBack && typeof(callBack) === 'function'){
            callBack();
          }
        }
    });
  }catch(err){
    log(err);
  }
};

function createAlbumData(metadata, albumId, picture){
  return {
    "id": albumId,
    "title": metadata.album,
    "picture": picture,
    "genre": metadata.genre,
    "year": metadata.year,
    "artist": metadata.albumartist
  };
};

function createTrackData(metadata, trackId, albumId, fileName, picture){
  return {
    "id":trackId,
    "albumId":albumId,
    "title": metadata.title,
    "album": metadata.album,
    "artist": metadata.artist,
    "duration": (metadata.duration/60).toFixed(2),
    "number": metadata.disk.no,
    "fileName" : fileName,
    "picture": picture,
    "favIcon":"favorite_border"
  }
};

function processMetaData(files, callBack){
  let deferred = Q.defer();
  let tracksProcessed=0;
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
            let picture = "img/album-placeholder.jpg";
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

function initMusicCache(callBack) {
  let deferred = Q.defer();
  fs.exists(dataDir+"albums.json", function (exists) {
    if(exists) {
      fs.readFile(dataDir+'albums.json', "utf8", function(err, data) {
        if (err) {
          console.log(err);
        } else {
          let mData = JSON.parse(data);
          musicData['albums'] = mData['albums'];
          musicData['tracks'] = mData['tracks'];
        }
        deferred.resolve(musicData);
        refreshCache();
      });
    } else {
      glob(musicDir+"**/*.mp3", null, function (err, files) {
        if (err) {
          if (!diskWatcher) {
            InitWatcher();
          }
          deferred.resolve(musicData);
        } else if (files.length <= 0) {
          if (!diskWatcher) {
            InitWatcher();
          }
          deferred.resolve(musicData);
        } else {
          addTracksToCache(files).then(function(data){
            deferred.resolve(data);
          }, function(err){
            deferred.reject(err);
          });
        }
      });
    }
  });
  return deferred.promise;
};

function addTracksToCache(files){
  let deferred = Q.defer();
  processMetaData(files).then(function(data) {
    writeDataToFile('albums.json', musicData, 'albums saved');
    if (!diskWatcher) {
      InitWatcher();
    }
    deferred.resolve(data);
  }, function(err){
    console.error(err);
    if (!diskWatcher) {
      InitWatcher();
    }
  });
  return deferred.promise;
};

function refreshCache(dir){
  glob(musicDir+"**/*.mp3", null, function (err, files) {
    if (!err){
      addTracksToCache(files);
    }
  });
};

function removeTrackFromCache(file){
  let index = musicData['tracks'].findIndex(function(data){
      return data.fileName === file;
  });
  if (index > -1 ) {
    musicData['tracks'].splice(index, 1);
  }
};

function InitWatcher() {
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
    /*pushToClient = true;
    addTracksToCache(path);*/
  })
  .on('unlink', function(path) {
    log('File', path, 'has been removed');
    removeTrackFromCache(path);
  })
  .on('unlinkDir', function(path) {
    log('Directory', path, 'has been removed');
    // todo updateCache();
  })
  //.on('change', function(path) { log('File', path, 'has been changed'); })
  .on('error', function(error) { log('Error happened', error); })
  .on('ready', function() { log('Initial scan complete. Ready for changes.'); });
};

function getAllMusicData() {
  return musicData;
};

function saveMusicDataToFile() {
  writeDataToFile('albums.json', musicData, 'albums updated');
};
