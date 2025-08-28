let language

/* Listeners */
document.getElementById('dlButton').addEventListener('click', downloadStart)
document.getElementById('aboutButton').addEventListener('click', () => { window.electronAPI.sendOpenAbout() })
document.getElementById('locButton').addEventListener('click', () => { window.electronAPI.sendChooseDirectory() })

window.onload = async () => {
  language = await window.electronAPI.sendGetLanguage()

  let [_currentStyle, _styles, currentStylePath] = await window.electronAPI.sendGetStyles()

  const node = document.createElement("link");
  node.setAttribute('rel', 'stylesheet')
  node.setAttribute('href', currentStylePath)
  document.querySelector("head").appendChild(node)

  document.getElementById('aboutButton').title = language.about
  document.getElementById('dlButton').title = language.download
  document.getElementById('locButton').title = language.dlfolder
  document.getElementById('waitingLabel').textContent = language.waiting
}

window.electronAPI.onDownloadFinished(() => {
  setTimeout(() => {
    document.getElementById('waitingLabel').textContent = language.waiting
    document.getElementById('dlButton').removeAttribute('disabled')
  }, 1000)
})

window.electronAPI.onDownloadError(() => {
  document.getElementById('waitingLabel').textContent = language.error
  setTimeout(() => {
    document.getElementById('waitingLabel').textContent = language.waiting
    document.getElementById('dlButton').removeAttribute('disabled')
  }, 2500)
})

window.electronAPI.onRecieveItems((_event, items) => {
  document.getElementById('itemLabel').innerText = language.downloading + ` ${items}`
})

window.electronAPI.onRecieveProgress((_event, prog) => {
  document.getElementById('waitingLabel').textContent = `${prog}%`
})

window.electronAPI.onRecieveDirectory((_event, path) => {
  document.getElementById('inputLocation').value = path
})

/* Listeners' functions */
function downloadStart() {
  let videoURL = document.getElementById('inputURL').value
  let destination = document.getElementById('inputLocation').value

  if (videoURL.search(/(youtube|youtu)\.(com|be)/gm) === -1) {
    document.getElementById('inputURL').value = ''
    return
  }

  if(destination === '') {
    return alert('You must set a file destination')
  }
  window.electronAPI.sendStartDownload(videoURL.replace(/&list.*/gm, ''), destination, 'mp3', 'ord')
  document.getElementById('dlButton').setAttribute('disabled', true)
  document.getElementById('waitingLabel').textContent = language.downloading
  document.getElementById('inputURL').value = ''
}

function settingsOpen() {
  let videoURL = document.getElementById('inputURL').value

  if (videoURL.search(/(youtube|youtu)\.(com|be)/gm) === -1) {
    document.getElementById('inputURL').value = ''
    return
  }
  else if (videoURL.search(/youtube\.com\/playlist\?/gm) !== -1) {
    return
  }

  window.electronAPI.sendClickedSettings(videoURL.replace(/&list.*/gm, ''))
}