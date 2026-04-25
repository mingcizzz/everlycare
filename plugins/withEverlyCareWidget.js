// @ts-check
const {
  withEntitlementsPlist,
  withXcodeProject,
  withDangerousMod,
} = require('@expo/config-plugins');
const path = require('path');
const fs   = require('fs');

const APP_GROUP       = 'group.com.everlycare.app';
const WIDGET_TARGET   = 'EverlyCareWidget';
const BUNDLE_ID_WIDGET = 'com.everlycare.app.widget';
const SOURCES_DIR      = path.join(__dirname, 'widget-sources');
const IOS_WIDGET_DIR   = `ios/${WIDGET_TARGET}`;

// ─── 1. App entitlements: add App Groups ──────────────────────────────────────

function withAppGroupEntitlement(config) {
  return withEntitlementsPlist(config, (mod) => {
    const entitlements = mod.modResults;
    const existing = entitlements['com.apple.security.application-groups'] || [];
    if (!existing.includes(APP_GROUP)) {
      entitlements['com.apple.security.application-groups'] = [...existing, APP_GROUP];
    }
    return mod;
  });
}

// ─── 2. Copy Swift sources into ios/EverlyCareWidget/ ─────────────────────────

function withCopyWidgetSources(config) {
  return withDangerousMod(config, [
    'ios',
    async (mod) => {
      const projectRoot = mod.modRequest.projectRoot;
      const destDir = path.join(projectRoot, IOS_WIDGET_DIR);
      fs.mkdirSync(destDir, { recursive: true });

      // Copy everything from plugins/widget-sources/
      copyRecursive(SOURCES_DIR, destDir);

      return mod;
    },
  ]);
}

function copyRecursive(src, dest) {
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath  = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      fs.mkdirSync(destPath, { recursive: true });
      copyRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// ─── 3. Add EverlyCareWidget target to Xcode project ─────────────────────────

function withWidgetTarget(config) {
  return withXcodeProject(config, (mod) => {
    const xcodeProject = mod.modResults;
    const projectRoot  = mod.modRequest.projectRoot;

    // Collect Swift source files relative to ios/
    const widgetDir = path.join(projectRoot, IOS_WIDGET_DIR);
    const swiftFiles = collectFiles(widgetDir, '.swift');
    const plistFile  = path.join(IOS_WIDGET_DIR, 'Info.plist');

    // --- Guard: don't add if target already exists ---
    const targets = xcodeProject.pbxNativeTargetSection();
    const alreadyAdded = Object.values(targets).some(
      (t) => t && t.name === WIDGET_TARGET
    );
    if (alreadyAdded) {
      console.log(`[withEverlyCareWidget] Target "${WIDGET_TARGET}" already exists, skipping.`);
      return mod;
    }

    // Add new target
    const widgetTarget = xcodeProject.addTarget(
      WIDGET_TARGET,
      'app_extension',
      WIDGET_TARGET,
      BUNDLE_ID_WIDGET
    );

    if (!widgetTarget) {
      console.warn('[withEverlyCareWidget] Failed to add widget target.');
      return mod;
    }

    // Add build phase: sources
    xcodeProject.addBuildPhase(
      swiftFiles.map((f) => path.relative(path.join(projectRoot, 'ios'), f)),
      'PBXSourcesBuildPhase',
      'Sources',
      widgetTarget.uuid
    );

    // Add build phase: resources (assets)
    const assetFiles = collectFiles(widgetDir, '.xcassets');
    xcodeProject.addBuildPhase(
      assetFiles.map((f) => path.relative(path.join(projectRoot, 'ios'), f)),
      'PBXResourcesBuildPhase',
      'Resources',
      widgetTarget.uuid
    );

    // Add build settings
    const configurations = xcodeProject.pbxXCBuildConfigurationSection();
    const widgetTargetConfigs = Object.keys(configurations).filter((key) => {
      const config = configurations[key];
      return (
        config &&
        config.buildSettings &&
        config.buildSettings.PRODUCT_NAME === `"${WIDGET_TARGET}"`
      );
    });

    widgetTargetConfigs.forEach((key) => {
      const buildSettings = configurations[key].buildSettings;
      buildSettings.SWIFT_VERSION = '5.0';
      buildSettings.IPHONEOS_DEPLOYMENT_TARGET = '17.0';
      buildSettings.TARGETED_DEVICE_FAMILY = '"1,2"';
      buildSettings.INFOPLIST_FILE = `"${IOS_WIDGET_DIR}/Info.plist"`;
      buildSettings.CODE_SIGN_ENTITLEMENTS = `"${IOS_WIDGET_DIR}/EverlyCareWidget.entitlements"`;
      buildSettings.SKIP_INSTALL = 'YES';
      buildSettings.ALWAYS_EMBED_SWIFT_STANDARD_LIBRARIES = 'NO';
      buildSettings.MARKETING_VERSION = '1.0';
      buildSettings.CURRENT_PROJECT_VERSION = '1';
    });

    // Embed extension in main app
    const mainTarget = xcodeProject.getFirstTarget();
    if (mainTarget) {
      xcodeProject.addBuildPhase(
        [`${WIDGET_TARGET}.appex`],
        'PBXCopyFilesBuildPhase',
        'Embed App Extensions',
        mainTarget.uuid,
        undefined,
        '13' // PlugIns destination
      );
    }

    return mod;
  });
}

function collectFiles(dir, ext) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory() && !entry.name.endsWith('.xcassets')) {
      results.push(...collectFiles(fullPath, ext));
    } else if (entry.name.endsWith(ext)) {
      results.push(fullPath);
    }
  }
  return results;
}

// ─── Export composite plugin ──────────────────────────────────────────────────

module.exports = function withEverlyCareWidget(config) {
  config = withAppGroupEntitlement(config);
  config = withCopyWidgetSources(config);
  config = withWidgetTarget(config);
  return config;
};
