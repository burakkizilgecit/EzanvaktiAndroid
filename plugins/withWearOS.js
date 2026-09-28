const { withAppBuildGradle, withDangerousMod, withSettingsGradle } = require('@expo/config-plugins');
const fs = require('node:fs');
const path = require('node:path');

function includeWearModule(contents) {
  if (contents.includes("include ':wearos'")) return contents;
  return contents + "\ninclude ':wearos'\nproject(':wearos').projectDir = new File(rootProject.projectDir, 'wearos')\n";
}

function addWearDataLayer(contents) {
  if (contents.includes('com.google.android.gms:play-services-wearable:20.0.1')) return contents;
  return contents.replace(/dependencies\s*\{/, 'dependencies {\n    implementation("com.google.android.gms:play-services-wearable:20.0.1")');
}

function wearVersionCode(phoneVersionCode) {
  const normalized = Number.isInteger(Number(phoneVersionCode)) && Number(phoneVersionCode) > 0
    ? Number(phoneVersionCode)
    : 1;
  return normalized * 1000 + 1;
}

module.exports = function withWearOS(config) {
  config = withSettingsGradle(config, c => { c.modResults.contents = includeWearModule(c.modResults.contents); return c; });
  config = withAppBuildGradle(config, c => { c.modResults.contents = addWearDataLayer(c.modResults.contents); return c; });
  return withDangerousMod(config, ['android', async c => {
    const source = path.join(__dirname, 'wear-os');
    const destination = path.join(c.modRequest.platformProjectRoot, 'wearos');
    fs.rmSync(destination, { recursive: true, force: true });
    fs.cpSync(source, destination, { recursive: true });
    const gradle = path.join(destination, 'build.gradle');
    const contents = fs.readFileSync(gradle, 'utf8')
      .replace(/versionCode\s+\d+/, `versionCode ${wearVersionCode(c.android?.versionCode)}`)
      .replace(/versionName\s+"[^"]+"/, `versionName "${c.version || '1.0.0'}"`);
    fs.writeFileSync(gradle, contents);
    return c;
  }]);
};
module.exports.includeWearModule = includeWearModule;
module.exports.addWearDataLayer = addWearDataLayer;
module.exports.wearVersionCode = wearVersionCode;
