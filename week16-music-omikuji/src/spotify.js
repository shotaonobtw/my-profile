// Client IDは公開されるアプリ識別子。Client Secretは使わない。
export const CLIENT_ID = '0cc9ef6918414db0a27656772dc2a26b';
export const REDIRECT_URI = new URL(import.meta.env.BASE_URL, window.location.origin).href;
const SESSION_KEY = 'music-omikuji-session';
const LOGIN_KEY = 'music-omikuji-login';
const SCOPES = 'streaming user-read-email user-read-private user-modify-playback-state';
let tokens = null;
let refreshPromise = null;

function randomString() {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)),
    (byte) => byte.toString(16).padStart(2, '0')).join('');
}

// PKCE: ログインを始めたブラウザだけが認証を完了できるようにする。
export async function login() {
  const verifier = randomString();
  const state = randomString();
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
  const challenge = btoa(String.fromCharCode(...new Uint8Array(hash)))
    .replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
  sessionStorage.setItem(LOGIN_KEY, JSON.stringify({ verifier, state, createdAt: Date.now() }));
  const query = new URLSearchParams({
    client_id: CLIENT_ID, response_type: 'code', redirect_uri: REDIRECT_URI,
    scope: SCOPES, state, code_challenge_method: 'S256', code_challenge: challenge,
  });
  window.location.assign(`https://accounts.spotify.com/authorize?${query}`);
}

async function requestTokens(fields) {
  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: CLIENT_ID, ...fields }),
    signal: AbortSignal.timeout(20000),
  });
  if (!response.ok) throw new Error('Spotifyの認証が完了しませんでした。もう一度接続してください。');
  const data = await response.json();
  if (!data.access_token || !data.expires_in) throw new Error('認証の返答を読み取れませんでした。');
  tokens = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? tokens?.refreshToken,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(tokens));
  return tokens.accessToken;
}

// Reactの描画前に一度だけ呼ぶ。StrictModeでも認証コードを二重送信しない。
export async function restoreSession() {
  const query = new URLSearchParams(window.location.search);
  const hasCallback = query.has('code') || query.has('error');
  try {
    if (hasCallback) {
      const pending = JSON.parse(sessionStorage.getItem(LOGIN_KEY) || 'null');
      if (!pending || query.get('state') !== pending.state || Date.now() - pending.createdAt > 600000) {
        throw new Error('ログイン確認の有効期限が切れました。同じタブから接続し直してください。');
      }
      if (query.has('error')) throw new Error('Spotify接続が許可されませんでした。必要なときに再接続できます。');
      await requestTokens({
        grant_type: 'authorization_code', code: query.get('code'),
        redirect_uri: REDIRECT_URI, code_verifier: pending.verifier,
      });
    } else {
      tokens = JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null');
      if (tokens) await getAccessToken();
    }
    return { connected: Boolean(tokens), error: '' };
  } catch (error) {
    tokens = null;
    sessionStorage.removeItem(SESSION_KEY);
    return { connected: false, error: error.message };
  } finally {
    if (hasCallback) {
      sessionStorage.removeItem(LOGIN_KEY);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }
}

// 有効期限が近ければ更新。重なった要求は同じ更新処理を待つ。
export async function getAccessToken() {
  if (!tokens?.accessToken) throw new Error('Spotifyに接続してください。');
  if (Date.now() < tokens.expiresAt - 60000) return tokens.accessToken;
  if (!tokens.refreshToken) throw new Error('接続の有効期限が切れました。再接続してください。');
  if (!refreshPromise) {
    refreshPromise = requestTokens({ grant_type: 'refresh_token', refresh_token: tokens.refreshToken })
      .finally(() => { refreshPromise = null; });
  }
  return refreshPromise;
}

export function logout() {
  tokens = null;
  sessionStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(LOGIN_KEY);
  window.location.assign(REDIRECT_URI);
}

export function parseTrackId(value) {
  const text = value.trim();
  if (/^spotify:track:[A-Za-z0-9]{22}$/.test(text)) return text.split(':')[2];
  try {
    const url = new URL(text);
    if (url.protocol !== 'https:' || url.hostname !== 'open.spotify.com') return null;
    return url.pathname.match(/^\/(?:intl-[a-z-]+\/)?track\/([A-Za-z0-9]{22})\/?$/)?.[1] ?? null;
  } catch { return null; }
}

export async function playTrack(deviceId, trackId) {
  const token = await getAccessToken();
  const response = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${encodeURIComponent(deviceId)}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ uris: [`spotify:track:${trackId}`] }),
    signal: AbortSignal.timeout(20000),
  });
  if (response.ok) return;
  const messages = {
    401: '接続の有効期限が切れました。Spotifyに再接続してください。',
    403: '再生が許可されませんでした。Premium契約と、Spotify開発画面のUser Managementに自分が登録されているか確認してください。開発モードの制限の場合もあります。',
    404: 'プレーヤーまたは曲が見つかりません。接続し直すか、別の曲のリンクを試してください。',
    429: 'リクエストが多すぎます。少し時間をおいて再試行してください。',
  };
  throw new Error(messages[response.status] ?? `再生できませんでした（HTTP ${response.status}）。`);
}

let sdkPromise;
export function loadSDK() {
  if (window.Spotify) return Promise.resolve(window.Spotify);
  if (!sdkPromise) {
    sdkPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      const timeout = setTimeout(() => {
        script.remove(); sdkPromise = null;
        reject(new Error('Spotifyの読み込みがタイムアウトしました。ページを再読み込みしてください。'));
      }, 20000);
      window.onSpotifyWebPlaybackSDKReady = () => {
        clearTimeout(timeout); resolve(window.Spotify);
      };
      script.src = 'https://sdk.scdn.co/spotify-player.js';
      script.onerror = () => {
        clearTimeout(timeout); script.remove(); sdkPromise = null;
        reject(new Error('Spotifyを読み込めませんでした。接続やコンテンツブロッカーを確認してください。'));
      };
      document.head.appendChild(script);
    });
  }
  return sdkPromise;
}
