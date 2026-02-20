import { randomUUID } from 'node:crypto';
import os from 'node:os';
import { track as _track, Identify, identify, init, setOptOut, Types } from '@amplitude/analytics-node';
import NodeMachineId from 'node-machine-id';
import { config } from '../config/constants.ts';
import { getStoredTokens, type StoredTokens } from './auth-token.svc.ts';
import { decodeJwtPayload } from './jwt.svc.ts';
import { debugLogger, getErrorMessage } from './log.svc.ts';

const SOURCE = 'cli';

const device_id = resolveDeviceId();
const started_at = new Date();
const session_id = started_at.getTime();
const IDENTITY_FIELDS: (keyof IdentityClaims)[] = ['email', 'organization_name', 'role', 'user_id'];
const CONTEXT_IDENTITY_FIELDS: (keyof AnalyticsContext)[] = ['email', 'organization_name', 'role', 'user_id'];

interface AnalyticsContext {
  // Session & Identity
  locale?: string;
  os_platform?: string;
  os_release?: string;
  started_at?: Date;
  ended_at?: Date;
  email?: string;
  organization_name?: string;
  role?: string;
  user_id?: string;

  // CLI Context
  app_used?: string;
  ci_provider?: string;
  cli_version?: string;
  command?: string;
  command_flags?: string;
  error?: string;

  // Scan Results
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

type IdentityClaims = Pick<AnalyticsContext, 'email' | 'organization_name' | 'role' | 'user_id'>;

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
let identifiedUserId: string | undefined;
let lastIdentitySignature = '';

export async function initializeAnalytics(): Promise<void> {
  try {
    await toSafeAnalyticsResult(
      init('0', {
        flushQueueSize: 2,
        flushIntervalMillis: 250,
        logLevel: Types.LogLevel.None,
        serverUrl: config.analyticsUrl,
      }),
      'init',
    ).promise;
    void toSafeAnalyticsResult(setOptOut(process.env.TRACKING_OPT_OUT === 'true'), 'setOptOut').promise;

    const identifiedFromToken = await refreshIdentityFromStoredToken();
    if (!identifiedFromToken) {
      void toSafeAnalyticsResult(identify(new Identify(), buildIdentifyEventOptions()), 'identify-anonymous').promise;
    }
  } catch (error) {
    logAnalyticsError('initialize', error);
  }
}

export async function refreshIdentityFromStoredToken(): Promise<boolean> {
  try {
    const tokens = await getStoredTokens();
    const claims = resolveIdentityClaims(tokens);
    if (!claims) {
      clearTrackedIdentity();
      return false;
    }

    const entries = toIdentityEntries(claims);
    const signature = buildIdentitySignature(entries);
    if (signature === lastIdentitySignature) {
      return false;
    }
    applyIdentityClaims(claims, signature);
    emitIdentify(entries, claims.user_id);
    return true;
  } catch (error) {
    logAnalyticsError('refreshIdentityFromStoredToken', error);
    return false;
  }
}

export function clearTrackedIdentity(): void {
  identifiedUserId = undefined;
  lastIdentitySignature = '';
  analyticsContext = clearIdentityFromContext(analyticsContext);
}

export function track(event: string, getProperties?: (context: AnalyticsContext) => Partial<AnalyticsContext>) {
  try {
    const localContext = getProperties?.(analyticsContext);
    if (localContext) {
      analyticsContext = { ...analyticsContext, ...localContext };
    }

    const eventProperties = { source: SOURCE, ...(localContext ?? {}) };
    return toSafeAnalyticsResult(
      _track(event, eventProperties, buildEventOptions(identifiedUserId || analyticsContext.user_id)),
      `track:${event}`,
    );
  } catch (error) {
    logAnalyticsError(`track:${event}`, error);
    return toSafeAnalyticsResult(undefined, `track:${event}:noop`);
  }
}

function buildEventOptions(userId?: string) {
  if (userId) {
    return { device_id, session_id, user_id: userId };
  }
  return { device_id, session_id };
}

function buildIdentifyEventOptions(userId?: string) {
  return {
    ...buildEventOptions(userId),
    platform: analyticsContext.os_platform,
    os_name: getOSName(analyticsContext.os_platform ?? ''),
    os_version: analyticsContext.os_release,
    app_version: analyticsContext.cli_version,
  };
}

function normalizeClaim(value: unknown): string {
  if (typeof value !== 'string') {
    return '';
  }
  return value.trim();
}

function extractIdentityClaims(accessToken: string | undefined): IdentityClaims | undefined {
  const payload = decodeJwtPayload(accessToken);
  if (!payload) {
    return;
  }

  const identity: IdentityClaims = {
    user_id: normalizeClaim(payload.sub) || undefined,
    email: normalizeClaim(payload.email) || undefined,
    organization_name: normalizeClaim(payload.company) || undefined,
    role: normalizeClaim(payload.role) || undefined,
  };

  if (toIdentityEntries(identity).length === 0) {
    return;
  }

  return identity;
}

function resolveIdentityClaims(tokens: StoredTokens | undefined): IdentityClaims | undefined {
  const tokenCandidates = new Set(
    [tokens?.accessToken, config.ciTokenFromEnv].map((token) => normalizeClaim(token)).filter(Boolean),
  );

  for (const tokenCandidate of tokenCandidates) {
    const claims = extractIdentityClaims(tokenCandidate);
    if (claims) {
      return claims;
    }
  }

  return;
}

function toIdentityEntries(identity: IdentityClaims): Array<[keyof IdentityClaims, string]> {
  const entries: Array<[keyof IdentityClaims, string]> = [];
  for (const field of IDENTITY_FIELDS) {
    const value = identity[field];
    if (value) {
      entries.push([field, value]);
    }
  }
  return entries;
}

function buildIdentitySignature(entries: Array<[keyof IdentityClaims, string]>): string {
  return entries.map(([field, value]) => `${field}:${value}`).join('|');
}

function applyIdentityClaims(claims: IdentityClaims, signature: string): void {
  identifiedUserId = claims.user_id;
  lastIdentitySignature = signature;
  analyticsContext = { ...analyticsContext, ...claims };
}

function emitIdentify(entries: Array<[keyof IdentityClaims, string]>, userId?: string): void {
  const amplitudeIdentify = new Identify();
  for (const [field, value] of entries) {
    amplitudeIdentify.set(field, value);
  }

  const eventOptions = buildIdentifyEventOptions(userId);
  void toSafeAnalyticsResult(identify(amplitudeIdentify, eventOptions), 'identify').promise;
  void toSafeAnalyticsResult(_track('Identify Call', { source: SOURCE }, eventOptions), 'track:Identify Call').promise;
}

function resolveDeviceId(): string {
  try {
    return NodeMachineId.machineIdSync(true);
  } catch (error) {
    logAnalyticsError('resolveDeviceId', error);
    return randomUUID();
  }
}

function toSafeAnalyticsResult(
  result: unknown,
  operation: string,
): {
  promise: Promise<void>;
} {
  const resultPromise = extractResultPromise(result);
  if (!resultPromise) {
    return { promise: Promise.resolve() };
  }

  return {
    promise: resultPromise
      .then(() => undefined)
      .catch((error) => {
        logAnalyticsError(operation, error);
      }),
  };
}

function extractResultPromise(result: unknown): Promise<unknown> | undefined {
  if (!result || typeof result !== 'object') {
    return;
  }

  const candidate = (result as { promise?: unknown }).promise;
  if (candidate instanceof Promise) {
    return candidate;
  }

  if (candidate && typeof (candidate as { then?: unknown }).then === 'function') {
    return candidate as Promise<unknown>;
  }
}

function logAnalyticsError(operation: string, error: unknown): void {
  debugLogger('Analytics operation failed (%s): %s', operation, getErrorMessage(error));
}

function clearIdentityFromContext(context: AnalyticsContext): AnalyticsContext {
  const nextContext = { ...context };
  for (const field of CONTEXT_IDENTITY_FIELDS) {
    delete nextContext[field];
  }
  return nextContext;
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
