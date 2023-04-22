module.exports = {
  packagerConfig: {
    "appVersion": "1.0.1",
    "name": "vits-miki",
    "appCopyright": "Shavosiik凉(harukawa.miki@gmail.com)",
    "icon": "./icon/app512.ico",
    "win32metadata": {
      "ProductName": "vits-miki Windows",
    }
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {},
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin'],
    },
    {
      name: '@electron-forge/maker-deb',
      config: {},
    },
    {
      name: '@electron-forge/maker-rpm',
      config: {},
    },
  ],
};
