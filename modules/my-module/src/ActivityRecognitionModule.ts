import { NativeModule, requireNativeModule } from 'expo';

import type { ActivityRecognitionModuleEvents } from './ActivityRecognition.types';

declare class ActivityRecognitionModuleClass extends NativeModule<ActivityRecognitionModuleEvents> {
  startMonitoring(): Promise<void>;
  stopMonitoring(): Promise<void>;
  isAvailable(): Promise<boolean>;
}

export default requireNativeModule<ActivityRecognitionModuleClass>(
  'ActivityRecognition',
);
