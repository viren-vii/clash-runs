const { withXcodeProject, withEntitlementsPlist } = require('@expo/config-plugins');

/**
 * Sets CODE_SIGN_STYLE = Automatic and DEVELOPMENT_TEAM on the main app target
 * for all build configurations, so this survives expo prebuild.
 *
 * Also removes the aps-environment entitlement so the app can build with a
 * free personal Apple Developer account (which doesn't support Push Notifications).
 */
module.exports = (config) => {
  config = withXcodeProject(config, (config) => {
    const xcodeProject = config.modResults;
    const teamId = config.ios?.appleTeamId;

    const buildConfigs = xcodeProject.pbxXCBuildConfigurationSection();

    for (const [, buildConfig] of Object.entries(buildConfigs)) {
      if (typeof buildConfig !== 'object' || !buildConfig.buildSettings) continue;

      // Only touch the main app target (has PRODUCT_BUNDLE_IDENTIFIER set)
      if (!buildConfig.buildSettings.PRODUCT_BUNDLE_IDENTIFIER) continue;

      buildConfig.buildSettings.CODE_SIGN_STYLE = 'Automatic';
      if (teamId) {
        buildConfig.buildSettings.DEVELOPMENT_TEAM = teamId;
      }
    }

    return config;
  });

  config = withEntitlementsPlist(config, (config) => {
    // Personal Apple Developer accounts don't support Push Notifications.
    // Remove aps-environment so the app can be signed with a free account.
    delete config.modResults['aps-environment'];
    return config;
  });

  return config;
};
