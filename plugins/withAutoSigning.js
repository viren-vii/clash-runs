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

    // 1. Update build configuration settings for the main app target
    const buildConfigs = xcodeProject.pbxXCBuildConfigurationSection();

    for (const [, buildConfig] of Object.entries(buildConfigs)) {
      if (typeof buildConfig !== 'object' || !buildConfig.buildSettings) continue;

      // Only touch the main app target (has PRODUCT_BUNDLE_IDENTIFIER set)
      if (!buildConfig.buildSettings.PRODUCT_BUNDLE_IDENTIFIER) continue;

      buildConfig.buildSettings.CODE_SIGN_STYLE = 'Automatic';
      buildConfig.buildSettings.CODE_SIGN_IDENTITY = '"Apple Development"';
      if (teamId) {
        buildConfig.buildSettings.DEVELOPMENT_TEAM = teamId;
      }
      // Clear any manual provisioning profile settings that conflict with automatic signing
      delete buildConfig.buildSettings.PROVISIONING_PROFILE_SPECIFIER;
      delete buildConfig.buildSettings.PROVISIONING_PROFILE;
    }

    // 2. Update project-level TargetAttributes so Xcode recognises automatic provisioning
    if (teamId) {
      const projectSection = xcodeProject.pbxProjectSection();
      for (const [, project] of Object.entries(projectSection)) {
        if (typeof project !== 'object' || !project.attributes?.TargetAttributes) continue;

        for (const [, attrs] of Object.entries(project.attributes.TargetAttributes)) {
          attrs.DevelopmentTeam = teamId;
          attrs.ProvisioningStyle = 'Automatic';
        }
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
