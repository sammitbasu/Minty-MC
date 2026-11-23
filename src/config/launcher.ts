// ─────────────────────────────────────────────────────────────────────────────
// Mint Launcher download settings.
//
// To ship the installer from this site, drop the file into `public/downloads/`
// and make `windows.file` match its name. Nothing else needs to change.
//
// The button checks the file exists before downloading. Until it does, it
// falls back to the latest GitHub release so the button never hands out a
// broken file.
// ─────────────────────────────────────────────────────────────────────────────

export const LAUNCHER = {
  version: '', // e.g. 'v1.4.0'. Leave empty to read the latest tag from GitHub.
  githubRepo: 'm3l0ncru2t/Mint-Launcher',
  releasesUrl: 'https://github.com/m3l0ncru2t/Mint-Launcher/releases/latest',

  windows: {
    file: '/downloads/MintLauncher-Setup.exe',
    saveAs: 'MintLauncher-Setup.exe',
  },

  otherPlatforms: [
    { os: 'Windows', label: 'MSI installer · Portable ZIP' },
    { os: 'macOS', label: '.dmg · .app.tar.gz' },
    { os: 'Linux', label: '.AppImage · .deb · .rpm' },
  ],
}
