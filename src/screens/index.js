let language

/* Listeners */
document.getElementById('aboutButton').addEventListener('click', () => { window.electronAPI.sendOpenAbout() })
document.getElementById('locButton').addEventListener('click', () => { window.electronAPI.sendChooseDirectory() })
document.getElementById('pageNext-0').addEventListener('click', () => page('setDestination'))
document.getElementById('backButton').addEventListener('click', () => page('setDestination'))
document.getElementById('resetButton').addEventListener('click', () => page('setDestination'))
document.getElementById('pageNext-1').addEventListener('click', () => page('setUrl'))
document.getElementById('dlButton').addEventListener('click', () => page('setDownloading'))

let environment;
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
    document.getElementById('waitingLabel').textContent = 'Finished downloading'
    document.getElementById('dlButton').removeAttribute('disabled')
    document.getElementsByClassName('postDownloadActions')[0].style.display = 'block'
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

environment;
function getEnvironment() {
  return new Promise((resolve) => {
    resolve(window.electronAPI.sendGetEnvironment())
  })
}
async function setEnvironmentInRender() {
  environment = await getEnvironment()
  if (environment === 'production') {
    return
  } else {
    console.log(`Red is running in a ${environment} environment, checks for empty input's will not be ran`)
    alert(`Red is running in a ${environment} environment, checks for empty input's will not be ran`)
  }
}
setEnvironmentInRender()

/* Listeners' functions */
function downloadStart() {
  let videoURL = document.getElementById('inputURL').value
  let destination = document.getElementById('inputLocation').value

  if (videoURL.search(/(youtube|youtu)\.(com|be)/gm) === -1) {
    document.getElementById('inputURL').value = ''
    return
  }

  document.getElementsByClassName('postDownloadActions')[0].style.display = 'hidden'

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

// Card/page system
/*
  This should probably be rewritten soon for efficiency and scalability purposes, I swear I can write better JS than this lol
 */
function page(pageCall) {
  var pageCall
  function changeCard(cardInt) {
    var card = [document.getElementById('card0'), document.getElementById('card1'), document.getElementById('card2'), document.getElementById('card3')]
    card.forEach((currentCard, index) => {
      if (index === cardInt) {
        card[index].style.display = 'block'
      } else {
        currentCard.style.display = 'none'
      }
    })
  }
  if (pageCall === 'setUrl') {
    let destination = document.getElementById('inputLocation').value
    if (destination === '' && environment !== 'development') {
      return alert('You must set a file destination')
    } else {
      changeCard(2)
    }
  }
  if (pageCall === 'setDestination') {
    changeCard(1)
  }
  if (pageCall === 'setDownloading') {
    let destination = document.getElementById('inputURL').value
    if (destination === '' && environment !== 'development') {
      return alert('You must set a URL')
    } else {
      if (destination.search(/(youtube|youtu)\.(com|be)/gm) === -1) {
        document.getElementById('inputURL').value = ''
        return
      } else {
        changeCard(3)
        return downloadStart()
      }
    }
  }
}