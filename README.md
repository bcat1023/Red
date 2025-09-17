# This is a Alpha Prerelease program, nothing is complete.

# Red Music Hoarder
> Red Music Hoarder (or Red for short) makes it easy to get mp3 files for your iPod off of Youtube Music

[![License](https://img.shields.io/badge/License-MIT-green)](https://github.com/RENOMIZER/ytm-dlp-gui/blob/main/LICENSE)

This app allows you to download audio off YouTube and YouTube Music and get it ready to save to your iPod.

## How to use it?

### Step 1
Find song or album you like on Youtube or Youtube Music

### Step 2
Set download location in Red

### Step 3
Paste URL from Youtube/Youtube Music into Red

### Step 4
Click download

### Step 4.5 (Optional)
Select all songs in Finder, then right click them and open in Music. This will import the album or single into the Music/iTunes app.

## Build instructions
- Install Node.js -> [Link](https://nodejs.org/en/download/package-manager)

- Clone the repo using `git clone`
- Open the repo directory and run `npm install`
- Run `npm run make` to build distributables or `npm run package` to build an unzipped package

Unzipped package can be found in `out` directory and distributables in `out/make` directory.

*Windows and Linux are no longer supported platforms, compiled binaries will only be available for MacOS, however a port to Windows or Linux should be possible*

# Bumping version
Red will pull the version tag from the package.json file in the root, just update the version there and abbriviet any words