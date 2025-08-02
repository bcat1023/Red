module.exports = {
  packagerConfig: {
    asar: true,
    icon: 'src/images/icon',
    executableName: 'Red Music Hoarder',
    name: 'Red Music Hoarder',
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-dmg',
      config: {
        format: 'ULFO'
      }
    }
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-auto-unpack-natives',
      config: {},
    },
  ],
  publishers: [
    {
      name: '@electron-forge/publisher-github',
      config: {
        repository: {
          owner: 'Nook.8081, RENOMIZER',
          name: 'Red'
        },
        prerelease: true,
        draft: true
      }
    }
  ]
};