const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Adds a post_install hook to the Podfile that bumps all pod targets'
 * IPHONEOS_DEPLOYMENT_TARGET to the project minimum. This silences Xcode
 * warnings from pods that declare very old deployment targets (e.g. 9.0).
 */
module.exports = (config, { minimumTarget = '15.1' } = {}) => {
  return withDangerousMod(config, [
    'ios',
    (config) => {
      const podfilePath = path.join(config.modRequest.platformProjectRoot, 'Podfile');
      let podfile = fs.readFileSync(podfilePath, 'utf8');

      const snippet = `
# [withMinDeploymentTarget] Bump all pod targets to the project minimum
post_install do |installer|
  installer.pods_project.targets.each do |target|
    target.build_configurations.each do |config|
      current = config.build_settings['IPHONEOS_DEPLOYMENT_TARGET']
      if current && Gem::Version.new(current) < Gem::Version.new('${minimumTarget}')
        config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '${minimumTarget}'
      end
    end
  end
end`;

      // Expo already generates a post_install block. Instead of adding a new
      // one (which would conflict), inject our logic into the existing block.
      if (podfile.includes('[withMinDeploymentTarget]')) {
        return config; // already injected
      }

      if (podfile.includes('post_install do |installer|')) {
        // Inject into existing post_install block
        podfile = podfile.replace(
          /post_install do \|installer\|/,
          `post_install do |installer|
    # [withMinDeploymentTarget] Bump all pod targets to the project minimum
    installer.pods_project.targets.each do |target|
      target.build_configurations.each do |bc|
        current = bc.build_settings['IPHONEOS_DEPLOYMENT_TARGET']
        if current && Gem::Version.new(current) < Gem::Version.new('${minimumTarget}')
          bc.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '${minimumTarget}'
        end
      end
    end`
        );
      } else {
        // No existing post_install – append one
        podfile += snippet;
      }

      fs.writeFileSync(podfilePath, podfile, 'utf8');
      return config;
    },
  ]);
};
