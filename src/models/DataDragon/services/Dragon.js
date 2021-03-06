const path = require("path");

class Dragon {
  async iconProfilePath(IconId) {
    return path.resolve(
      `src/assets/dragontail-10.24.1/10.24.1/img/profileicon/${IconId}.png`
    );
  }

  async splashMobilePath(champion) {
    return path.resolve(
      `src/assets/dragontail-10.24.1/img/champion/splash/${champion}_0_mobile.jpg`
    );
  }

  async splashDesktopPath(champion) {
    return path.resolve(
      `src/assets/dragontail-10.24.1/img/champion/splash/${champion}_0_desktop.jpg`
    );
  }

  async iconChampionPath(champion) {
    return path.resolve(
      `src/assets/dragontail-10.24.1/10.24.1/img/champion/${champion}.png`
    );
  }

  async rankedEmblemPath(tier) {
    return path.resolve(`src/assets/ranked-emblems/${tier}.png`);
  }

  async rankedFlagPath(tier) {
    return path.resolve(`src/assets/ranked-flags/${tier}.png`);
  }
}

module.exports = new Dragon();
