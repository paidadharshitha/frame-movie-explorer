import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Standalone review build: bundled JavaScript, arm64, development signing key.
// No account or private token is needed. This is not a store-signing workflow.
const project = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sdk = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT;
const required = [
  'platforms/android-37.0',
  'build-tools/37.0.0',
  'ndk/27.1.12297006',
  'cmake/3.30.5',
];

if (!sdk || required.some((entry) => !existsSync(join(sdk, entry)))) {
  console.error(
    'Set ANDROID_HOME to an Android SDK with platforms;android-37.0, build-tools37.0.0, NDK27.1.12297006 and CMake3.30.5. Install missing packages in Android Studio first.',
  );
  process.exit(1);
}

const environment = {
  ...process.env,
  ANDROID_HOME: sdk,
  CI: '1',
  EXPO_PUBLIC_TMDB_READ_ACCESS_TOKEN: '',
};
function run(command, args, cwd = project) {
  const result = spawnSync(command, args, { cwd, env: environment, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0)
    throw new Error(`${command} failed with exit code ${result.status ?? 'unknown'}`);
}

const manifestPath = join(project, 'package.json');
const scripts = JSON.parse(readFileSync(manifestPath, 'utf8')).scripts;
try {
  try {
    run(process.platform === 'win32' ? 'npx.cmd' : 'npx', [
      'expo',
      'prebuild',
      '--platform',
      'android',
      '--no-install',
    ]);
  } finally {
    // Prebuild rewrites the android/ios npm scripts; keep the project's own commands.
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
    manifest.scripts = scripts;
    writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  }
  run(
    process.platform === 'win32' ? 'gradlew.bat' : './gradlew',
    [
      ':app:assembleRelease',
      '-PreactNativeArchitectures=arm64-v8a',
      '--no-daemon',
      '--console=plain',
      '--max-workers=2',
    ],
    join(project, 'android'),
  );
  const output = join(project, 'artifacts');
  mkdirSync(output, { recursive: true });
  const apk = join(output, 'frame-preview-arm64.apk');
  copyFileSync(join(project, 'android/app/build/outputs/apk/release/app-release.apk'), apk);
  run(
    join(sdk, 'build-tools/37.0.0', process.platform === 'win32' ? 'apksigner.bat' : 'apksigner'),
    ['verify', '--verbose', '--print-certs', apk],
  );
  const hash = createHash('sha256').update(readFileSync(apk)).digest('hex');
  writeFileSync(`${apk}.sha256`, `${hash}  frame-preview-arm64.apk\n`);
  console.log(`Preview APK and checksum saved in ${output}`);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
