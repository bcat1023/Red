/* Modules */
const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const os = require('os');
const fs = require('fs-extra');
const fetch = require("node-fetch-commonjs");
const getLyrics = require('lyrics-snatcher');
const { exec } = require('child_process');
const YTDlpWrap = require('yt-dlp-wrap').default;

/* Classes */
let bin;
if (app.isPackaged) {
  bin = process.resourcesPath;
} else {
  bin = __dirname + '/vendor/';
}
const YtDlpWrap = new YTDlpWrap(path.join(bin, 'yt-dlp_macos'));
Date.prototype.dateNow = function () {
  return ((this.getDate() < 10) ? "0" : "") + this.getDate() + "-" + (this.getMonth() + 1) + "-" + this.getFullYear();
}
Date.prototype.timeNow = function () {
  return ((this.getHours() < 10) ? "0" : "") + this.getHours() + ((this.getMinutes() < 10) ? "0" : "") + this.getMinutes() + ((this.getSeconds() < 10) ? "0" : "") + this.getSeconds();
}
const date = new Date()

/* DO NOT CHANGE */
let MainWin
let SetWin
let UrlWin
let AboutWin
/* DO NOT CHANGE */

/* Variables */
let changedMetadata = {}
let metadata = {}
let rawMetadata
let currentVideo
let customArt
let language

/* Initialisation */
if (require('electron-squirrel-startup')) return;

let logStream = fs.createWriteStream(path.join(os.tmpdir(), `ytm-dlp-log-${date.dateNow()}-${date.timeNow()}.log`))

/* Main cycle */
app.whenReady().then(async () => {
  ipcMain.on('getArt', createUrl)
  ipcMain.on('openAbout', createAbout)
  ipcMain.on('clickedSettings', createSettings)
  ipcMain.on('startDownload', startDownload)
  ipcMain.handle('getStyles', getStyles)

  ipcMain.handle('getLanguage', () => { return language })
  ipcMain.on('recieveMetadata', (_event, metadata) => { changedMetadata = metadata })
  ipcMain.on('reloadMetadata', () => { SetWin.webContents.send('sendMetadata', metadata); customArt = null })

  ipcMain.on('chooseDirectory', () => {
    dialog.showOpenDialog(MainWin, {
      title: language.seldlfolder,
      buttonLabel: language.select,
      properties: ['openDirectory']
    }).then((e) => { if (!e.canceled) { MainWin.webContents.send('sendDirectory', e.filePaths[0]) } })
  })

  ipcMain.on('changeStyle', (_event, style) => {
    let configPath = path.join(__dirname, "config.json");
    let config = {}
    if (fs.existsSync(configPath)) {
      config = JSON.parse(fs.readFileSync(configPath, 'utf-8'))
    }
    config.style = style
    fs.writeFileSync(configPath, JSON.stringify(config))
    MainWin.reload()
    AboutWin.reload()
  })

  ipcMain.on('recieveLanguage', (_event, lang) => {
    if (lang !== language.current) {
      let configPath = path.join(__dirname, "config.json");
      let config = {}
      if (fs.existsSync(configPath)) {
        config = JSON.parse(fs.readFileSync(configPath))
      }
      config.lang = lang
      fs.writeFileSync(configPath, JSON.stringify(config))

      app.relaunch()
      app.quit()
    }
  })

  ipcMain.on('receiveOnlineArt', (_event, artURL) => {
    fetch(artURL)
      .then((response) => response.buffer())
      .then((buffer) => {
        const artDir = path.join(os.tmpdir(), 'ytm-dlp-images');
        if (!fs.existsSync(artDir)) { fs.mkdirSync(artDir) }

        const artPath = path.join(artDir, 'art');
        fs.writeFileSync(artPath, buffer)

        SetWin.webContents.send('sendArt', artPath)
        customArt = artPath
      })
      .catch((err) => {
        throwErr(err)
      });
  })

  ipcMain.on('openArt', () => {
    dialog.showOpenDialog(SetWin, {
      title: language.selalbumart,
      buttonLabel: language.select,
      filters: [
        { name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'webp'] }
      ],
      properties: ['openFile']
    }).then((e) => { if (!e.canceled) { SetWin.webContents.send('sendArt', e.filePaths[0]); customArt = e.filePaths[0] } })
  })

  getLang()
  createMain()

  app.on('window-all-closed', () => {
    logStream.end(`[info] Log end.`)
    app.quit()
  })
})

/* Window creation */
const createMain = () => {
  MainWin = new BrowserWindow({
    width: 800,
    minWidth: 400,
    height: 600,
    minHeight: 300,
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#00000000',
      symbolColor: '#707070',
      height: 45,
    },
    menuBarVisible: false,
    show: false,
    icon: path.join(__dirname, 'images', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  })

  MainWin.removeMenu()
  MainWin.loadFile('src/screens/index.html')
  MainWin.on('ready-to-show', () => { MainWin.show() })
}

const createSettings = (_event, videoURL) => {
  SetWin = new BrowserWindow({
    width: 600,
    height: 800,
    resizable: false,
    title: language.edit,
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#00000000',
      symbolColor: '#707070',
      height: 45,
    },
    parent: MainWin,
    modal: true,
    show: false,
    icon: path.join(__dirname, 'images/icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  })

  SetWin.removeMenu()
  SetWin.loadFile('src/screens/settings.html')
  SetWin.on('ready-to-show', () => { SetWin.show(); getMetadata(videoURL) })
  SetWin.on('minimize', () => { MainWin.minimize() })
}

const createUrl = () => {
  UrlWin = new BrowserWindow({
    width: 450,
    height: 150,
    resizable: false,
    title: language.url,
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#00000000',
      symbolColor: '#707070',
      height: 45,
    },
    parent: SetWin,
    modal: true,
    show: false,
    icon: path.join(__dirname, '/images/icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  })

  UrlWin.removeMenu()
  UrlWin.loadFile('src/screens/url.html')
  UrlWin.on('ready-to-show', () => { UrlWin.show() })
}

const createAbout = () => {
  AboutWin = new BrowserWindow({
    width: 450,
    height: 600,
    resizable: false,
    title: language.about,
    titleBarStyle: 'shown',
    titleBarOverlay: {
      color: '#00000000',
      symbolColor: '#707070',
      height: 45,
    },
    parent: MainWin,
    modal: true,
    show: true,
    icon: path.join(__dirname, 'images/icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  })

  AboutWin.removeMenu()
  AboutWin.loadFile('src/screens/about.html')
  AboutWin.on('ready-to-show', () => { AboutWin.show() })
  AboutWin.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  })
}

/* Get info */
const getLang = () => {
  const configPath = path.join(__dirname, "config.json");
  if (!fs.existsSync(configPath) || fs.readFileSync(configPath, 'utf-8') === '') {
    fs.writeFileSync(configPath, `{"lang": "en", "style": "mocha"}`)
  }

  let local = JSON.parse(fs.readFileSync(configPath))
  language = JSON.parse(fs.readFileSync(path.join(__dirname, '/lang/', local.lang + '.json')))
}

const getStyles = () => {
  const stylesDir = path.join(__dirname, 'styles');
  const destStylesDir = path.join(__dirname, 'styles')

  if (!fs.existsSync(destStylesDir)) {
    fs.copyFileSync(path.join(stylesDir, 'mocha.css'), path.join(destStylesDir, 'mocha.css'))
  }

  let files = fs.readdirSync(destStylesDir, { withFileTypes: false })
  files = files.filter(e => { return e.search(/\.css/) !== -1 })
  let styles = files.map(e => { return e.replace(/\.css/, '') })

  let data = fs.readFileSync(path.join(__dirname, "config.json"), 'utf-8')
  let currentStyle = JSON.parse(data).style

  let currentStylePath
  if (fs.existsSync(path.join(destStylesDir, currentStyle + '.css'))) {
    currentStylePath = path.join(destStylesDir, currentStyle + '.css')
  } else {
    currentStylePath = path.join(destStylesDir, 'mocha.css')
    currentStyle = "mocha"
  }

  return [currentStyle, styles, currentStylePath]
}

const getMetadata = async (videoURL) => {
  
}

/* General functions */
const startDownload = async (_event, videoURL, dirPath, ext, order) => {
  arguments = ['-t', 'sleep', '--ppa', "EmbedThumbnail+ffmpeg_o:-c:v mjpeg -vf crop=\"'if(gt(ih,iw),iw,ih)':'if(gt(iw,ih),ih,iw)'\"", '-x', '--ffmpeg-location', `${path.join(bin, 'ffmpeg')}`, '--audio-format', 'mp3','--embed-metadata', '--embed-thumbnail', `${videoURL}`, '-P', `${dirPath}`, '-o', '%(track)s.%(ext)s', '--parse-metadata', 'uploader:(?P<album_artist>.+)']
  console.log(arguments)
  YtDlpWrap.exec(arguments)
    .on('ytDlpEvent', (eType, eData) => {
      console.log('[' + eType + ']', eData)
      logStream.write(`[${eType}] ${eData}\n`)

      if (eType === 'download' && eData.slice(1, 4) !== 'Des' && eData.slice(4, 5) === '.') {
        MainWin.webContents.send('sendProgress', eData.slice(1, 4))
      }
      if(eType === 'download' && eData.slice(1,18) === 'Downloading item ') {
        MainWin.webContents.send('sendItems', eData.slice(18, Number.POSITIVE_INFINITY))
      }
    })
    .on('error', (err) => { MainWin.webContents.send('sendDownloadError'); throwErr(err) })
    .on('close', () => {
      logStream.write('\n')

      MainWin.webContents.send('sendDownloadFinished');
      const artFile = path.join(os.tmpdir(), 'ytm-dlp-images', 'art')
      if (fs.existsSync(artFile)) {
        fs.unlink(artFile, (err) => { if (err) { throwErr(err) } })
      }
    })

  currentVideo = ''
  changedMetadata = {}
}

const throwErr = (err) => {
  console.error(err)
  logStream.write(`[error] ` + err + '\n\n')
}
