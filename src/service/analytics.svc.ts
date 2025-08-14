import os from 'node:os';
import { Identify, Types, track as _track, identify, init, setOptOut } from '@amplitude/analytics-node';
import NodeMachineId from 'node-machine-id';
import { config } from '../config/constants.ts';

const device_id = NodeMachineId.machineIdSync(true);
const started_at = new Date();
const session_id = started_at.getTime();

interface AnalyticsContext {
  // Session & Identity
  locale?: string;
  os_platform?: string;
  os_release?: string;
  started_at?: Date;
  ended_at?: Date;

  // CLI Context
  app_used?: string;
  ci_provider?: string;
  cli_version?: string;
  command?: string;
  command_flags?: string;
  error?: string;

  // Scan Results
  scan_location?: string;
  eol_true_count?: number;
  eol_unknown_count?: number;
  nes_available_count?: number;
  nes_remediation_count?: number;
  number_of_packages?: number;
  sbom_created?: boolean;
  scan_load_time?: number;
  scanned_ecosystems?: string[];
  scan_failure_reason?: string;
  web_report_link?: string;
}

const defaultAnalyticsContext: AnalyticsContext = {
  locale: Intl.DateTimeFormat().resolvedOptions().locale,
  os_platform: os.platform(),
  os_release: os.release(),
  cli_version: process.env.npm_package_version ?? 'unknown',
  ci_provider: getCIProvider(),
  app_used: getTerminal(),
  started_at,
};

let analyticsContext: AnalyticsContext = defaultAnalyticsContext;

export function initializeAnalytics() {
  init('0', {
    flushQueueSize: 2,
    flushIntervalMillis: 250,
    logLevel: Types.LogLevel.None,
    serverUrl: config.analyticsUrl,
  });
  setOptOut(process.env.TRACKING_OPT_OUT === 'true');
  identify(new Identify(), {
    device_id,
    platform: analyticsContext.os_platform,
    os_name: getOSName(analyticsContext.os_platform ?? ''),
    os_version: analyticsContext.os_release,
    session_id,
    app_version: analyticsContext.cli_version,
  });
}

export function track(event: string, getProperties?: (context: AnalyticsContext) => Partial<AnalyticsContext>) {
  const localContext = getProperties?.(analyticsContext);
  if (localContext) {
    analyticsContext = { ...analyticsContext, ...localContext };
  }
  return _track(event, localContext, { device_id, session_id });
}

function getCIProvider(env = process.env): string | undefined {
  if (env.GITHUB_ACTIONS) return 'github';
  if (env.GITLAB_CI) return 'gitlab';
  if (env.CIRCLECI) return 'circleci';
  if (env.TF_BUILD) return 'azure';
  if (env.BITBUCKET_COMMIT || env.BITBUCKET_BUILD_NUMBER) return 'bitbucket';
  if (env.JENKINS_URL) return 'jenkins';
  if (env.BUILDKITE) return 'buildkite';
  if (env.TRAVIS) return 'travis';
  if (env.TEAMCITY_VERSION) return 'teamcity';
  if (env.CODEBUILD_BUILD_ID) return 'codebuild';
  if (env.CI) return 'unknown_ci';
  return undefined;
}

function getTerminal(env = process.env): string {
  if (env.TERM_PROGRAM === 'vscode' || env.VSCODE_PID) return 'vscode';
  if (env.TERM_PROGRAM === 'iTerm.app' || env.ITERM_SESSION_ID) return 'iterm';
  if (env.TERM_PROGRAM === 'Apple_Terminal') return 'apple_terminal';
  if (env.TERM_PROGRAM === 'WarpTerminal' || env.WARP_IS_LOCAL_SHELL_SESSION) return 'warp';
  if (env.TERM_PROGRAM === 'ghostty' || env.GHOSTTY_RESOURCES_DIR || env.GHOSTTY_CONFIG_DIR) return 'ghostty';
  if (env.TERM_PROGRAM === 'WezTerm' || env.WEZTERM_EXECUTABLE || env.WEZTERM_PANE) return 'wezterm';
  if (env.TERM === 'alacritty' || env.ALACRITTY_LOG || env.ALACRITTY_SOCKET) return 'alacritty';
  if (env.TERM === 'xterm-kitty' || env.KITTY_WINDOW_ID) return 'kitty';
  if (env.WT_SESSION || env.WT_PROFILE_ID) return 'windows_terminal';
  if (env.ConEmuPID || env.ConEmuDir || env.CONEMU_BUILD) return 'conemu';
  if (env.TERM_PROGRAM === 'mintty' || env.MINTTY_SHORTCUT) return 'mintty';
  if (env.TILIX_ID) return 'tilix';
  if (env.GNOME_TERMINAL_SCREEN || env.GNOME_TERMINAL_SERVICE || env.VTE_VERSION) return 'gnome';
  if (env.KONSOLE_VERSION) return 'konsole';
  if (env.TERM_PROGRAM === 'Hyper') return 'hyper';
  return 'unknown_terminal';
}

function getOSName(platform: string): string {
  if (platform === 'darwin') return 'macOS';
  if (platform === 'win32') return 'Windows';
  if (platform === 'linux') return 'Linux';
  if (platform === 'android') return 'Android';
  if (platform === 'ios') return 'iOS';
  return platform;
}
