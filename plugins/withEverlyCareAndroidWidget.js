// @ts-check
const {
  withAndroidManifest,
  withDangerousMod,
} = require('@expo/config-plugins');
const path = require('path');
const fs   = require('fs');

const PKG            = 'com.everlycare.app';
const WIDGET_CLASS   = `${PKG}.EverlyCareWidget`;
const SOURCES_DIR    = path.join(__dirname, 'android-widget-sources');

// ─── 1. Copy sources into the Android project ─────────────────────────────────

function withCopyAndroidWidgetSources(config) {
  return withDangerousMod(config, [
    'android',
    async (mod) => {
      const projectRoot = mod.modRequest.projectRoot;
      const appDir = path.join(projectRoot, 'android', 'app', 'src', 'main');
      const javaOut = path.join(appDir, 'java', PKG.replace(/\./g, '/'));
      const resOut  = path.join(appDir, 'res');

      // Kotlin source files
      const javaSrc = path.join(SOURCES_DIR, 'java');
      if (fs.existsSync(javaSrc)) {
        fs.mkdirSync(javaOut, { recursive: true });
        for (const file of fs.readdirSync(javaSrc)) {
          if (file.endsWith('.kt')) {
            fs.copyFileSync(path.join(javaSrc, file), path.join(javaOut, file));
          }
        }
      }

      // Resource directories: layout, xml, drawable, values
      const resSrc = path.join(SOURCES_DIR, 'res');
      if (fs.existsSync(resSrc)) {
        copyResources(resSrc, resOut);
      }

      return mod;
    },
  ]);
}

function copyResources(src, dest) {
  for (const dir of fs.readdirSync(src, { withFileTypes: true })) {
    if (!dir.isDirectory()) continue;
    const srcDir  = path.join(src, dir.name);
    const destDir = path.join(dest, dir.name);
    fs.mkdirSync(destDir, { recursive: true });
    for (const file of fs.readdirSync(srcDir)) {
      fs.copyFileSync(path.join(srcDir, file), path.join(destDir, file));
    }
  }
}

// ─── 2. Register widget in AndroidManifest.xml ───────────────────────────────

function withWidgetManifest(config) {
  return withAndroidManifest(config, (mod) => {
    const manifest  = mod.modResults;
    const app       = manifest.manifest.application?.[0];
    if (!app) return mod;

    // Avoid duplicate entries
    const receivers = (app.receiver || []);
    const alreadyAdded = receivers.some(
      (r) => r.$?.['android:name'] === WIDGET_CLASS
    );
    if (alreadyAdded) return mod;

    const actions = [
      'com.everlycare.app.UPDATE_WIDGET',
      'com.everlycare.app.LOG_URINATION_TIMED',
      'com.everlycare.app.LOG_URINATION_DIRECT',
      'com.everlycare.app.CANCEL_TIMER',
      'com.everlycare.app.LOG_BOWEL',
      'com.everlycare.app.LOG_FLUID_200',
      'com.everlycare.app.COUNTDOWN_FIRE',
    ];

    const widgetReceiver = {
      $: {
        'android:name':     WIDGET_CLASS,
        'android:exported': 'true',
        'android:label':    'EverlyCare Widget',
      },
      'intent-filter': [
        {
          action: [
            { $: { 'android:name': 'android.appwidget.action.APPWIDGET_UPDATE' } },
            ...actions.map((a) => ({ $: { 'android:name': a } })),
          ],
        },
      ],
      'meta-data': [
        {
          $: {
            'android:name':     'android.appwidget.provider',
            'android:resource': '@xml/widget_everly_care_info',
          },
        },
      ],
    };

    app.receiver = [...receivers, widgetReceiver];
    return mod;
  });
}

// ─── Export composite plugin ──────────────────────────────────────────────────

module.exports = function withEverlyCareAndroidWidget(config) {
  config = withCopyAndroidWidgetSources(config);
  config = withWidgetManifest(config);
  return config;
};
