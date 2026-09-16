const { withAndroidManifest } = require('@expo/config-plugins');

// Android 11+ package visibility: without this <queries> entry, the implicit
// RINGTONE_PICKER intent silently fails to resolve (pickSystemRingtone()
// returns null) and the system ringtone picker never opens.
module.exports = function withRingtoneQuery(config) {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;

    if (!manifest.queries) manifest.queries = [{}];
    const queries = manifest.queries[0];
    if (!queries.intent) queries.intent = [];

    const alreadyPresent = queries.intent.some(
      (i) => i.action?.[0]?.$?.['android:name'] === 'android.intent.action.RINGTONE_PICKER'
    );

    if (!alreadyPresent) {
      queries.intent.push({
        action: [{ $: { 'android:name': 'android.intent.action.RINGTONE_PICKER' } }],
      });
    }

    return config;
  });
};
