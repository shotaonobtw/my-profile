import { useEffect, useRef, useState } from 'react';
import { login, logout, loadSDK, getAccessToken, playTrack } from './spotify';

import { genres, drawSong } from './lottery';
import { songs } from './songs';

export default function App({ initialSession }) {
  const [status, setStatus] = useState(initialSession.connected ? 'プレーヤーを準備しています…' : 'Spotify未接続');
  const [error, setError] = useState(initialSession.error);
  const [deviceId, setDeviceId] = useState('');
  const [busy, setBusy] = useState(false);
  const [genre, setGenre] = useState('すべて');
  const [selected, setSelected] = useState(null);
  const [drawCount, setDrawCount] = useState(0);
  const [revealing, setRevealing] = useState(false);
  const revealingRef = useRef(false);
  const resultRef = useRef(null);

  useEffect(() => {
    if (drawCount > 0 && window.matchMedia('(max-width: 767px)').matches) {
      resultRef.current?.scrollIntoView({ block: 'start', behavior: 'instant' });
    }
  }, [drawCount]);
  const [track, setTrack] = useState(null);
  const [paused, setPaused] = useState(true);
  // SDKのプレーヤーそのものは描画に使わないのでrefに保持する。
  const playerRef = useRef(null);
  const busyRef = useRef(false);

  useEffect(() => {
    if (!initialSession.connected) return;
    let cancelled = false;
    let player;
    let readyTimeout;
    const showError = (text) => {
      clearTimeout(readyTimeout);
      if (!cancelled) setError(text);
    };
    readyTimeout = setTimeout(() => showError('プレーヤーの準備が30秒以内に完了しませんでした。Chromeの通常ウィンドウで http://127.0.0.1:5173/ を開き、接続し直してください。解消しない場合は、同じアカウントでSpotify公式Webプレーヤーが再生できるか確認してください。'), 30000);
    loadSDK().then((Spotify) => {
      if (cancelled) return;
      player = new Spotify.Player({
        name: '音楽おみくじ',
        volume: 0.3,
        getOAuthToken: (callback) => {
          getAccessToken().then((token) => { if (!cancelled) callback(token); })
            .catch(() => showError('認証を更新できませんでした。Spotifyに再接続してください。'));
        },
      });
      playerRef.current = player;
      player.addListener('ready', ({ device_id }) => {
        clearTimeout(readyTimeout);
        if (cancelled) return;
        setDeviceId(device_id); setStatus('再生準備ができました'); setError('');
      });
      player.addListener('not_ready', () => {
        if (cancelled) return;
        setDeviceId(''); setPaused(true); setStatus('接続が切れました。再接続してください。');
      });
      player.addListener('player_state_changed', (state) => {
        if (cancelled) return;
        setTrack(state?.track_window.current_track ?? null);
        setPaused(state?.paused ?? true);
        if (state) setStatus(state.paused ? '一時停止中' : '再生中');
      });
      player.addListener('autoplay_failed', () => showError('ブラウザが再生を止めました。「再開」を押してください。'));
      player.addListener('initialization_error', () => showError('このブラウザではSpotifyプレーヤーを初期化できません。最新版のChromeで試してください。'));
      player.addListener('authentication_error', () => showError('Spotifyの認証に失敗しました。再接続してください。'));
      player.addListener('account_error', () => showError('再生には、このアカウントのSpotify Premium契約が必要です。'));
      player.addListener('playback_error', () => showError('曲の再生に失敗しました。別の曲か、再生ボタンで再試行してください。'));
      return player.connect();
    }).then((connected) => {
      if (connected === false) showError('プレーヤーを接続できませんでした。再接続してください。');
    }).catch((err) => showError(err.message));
    // 画面を離れたときは接続を解除。StrictModeの再実行にも対応する。
    return () => {
      cancelled = true; clearTimeout(readyTimeout);
      player?.disconnect();
      if (playerRef.current === player) playerRef.current = null;
    };
  }, [initialSession.connected]);

  async function connectSpotify() {
    setError('');
    try { await login(); }
    catch { setError('ログインを開始できません。ブラウザの保存設定を確認してください。'); }
  }

  async function playSelected(song) {
    if (!song || !deviceId || !playerRef.current || busyRef.current) return;
    busyRef.current = true; setBusy(true); setError('');
    try {
      // ボタンクリックから音声を有効化し、選んだ曲を再生する。
      await playerRef.current.activateElement();
      await playTrack(deviceId, song.trackId);
      setStatus('再生をリクエストしました。音が出なければ「再開」を押してください。');
    } catch (err) {
      setError(err.message || '通信に失敗しました。同じ曲を再生し直せます。');
    } finally { busyRef.current = false; setBusy(false); }
  }

  function drawFortune() {
    if (busyRef.current || revealingRef.current) return;
    const next = drawSong(genre, selected?.id);
    if (!next) return;
    revealingRef.current = true;
    setRevealing(true);
    setDrawCount((count) => count + 1);
    setSelected(next);
    // 接続前でも占いは楽しめる。準備済みなら、そのまま曲も流す。
    if (deviceId) void playSelected(next);
  }

  async function controlPlayback() {
    if (!playerRef.current || busyRef.current) return;
    busyRef.current = true; setBusy(true); setError('');
    try {
      await playerRef.current.activateElement();
      await playerRef.current.togglePlay();
    } catch { setError('操作できませんでした。再生する曲を選んで試してください。'); }
    finally { busyRef.current = false; setBusy(false); }
  }

  return (
    <main className="mx-auto max-w-5xl px-5 py-8 sm:px-10 sm:py-12">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-500/20 pb-6">
        <span className="text-sm tracking-[0.25em]">MUSIC OMIKUJI</span>
        <span className="text-xs text-[#67502d]">30 SONGS · YOUR DAILY SOUNDTRACK</span>
      </header>
      <div className="grid gap-8 py-10 md:grid-cols-2 md:gap-12">
        <section className="min-w-0">
          <p className="text-sm text-[#67502d]">今日のあなたに、音楽を。</p>
          <h1 className="mt-5 text-4xl leading-snug font-semibold sm:text-5xl">一曲との出会いが、<br />今日のおまもり。</h1>
          <p className="mt-6 text-sm leading-8 text-[#53647c]">ひとつ引いて、ひと息つこう。<br />30曲から届く、音楽と小さなメッセージ。</p>
          <fieldset className="mt-8">
            <legend className="mb-3 text-sm">今日聴きたいジャンル</legend>
            <div className="flex flex-wrap gap-2">
              {genres.map((item) => <button key={item} type="button" aria-pressed={genre === item} disabled={busy || revealing} onClick={() => setGenre(item)} className={`rounded-full border px-4 py-2 text-sm transition-all duration-200 ${genre === item ? 'border-[#e9cc7d] bg-[#e9cc7d] text-[#18271f]' : 'border-slate-500/30 hover:bg-white/60'}`}>{item}</button>)}
            </div>
          </fieldset>
          <button onClick={drawFortune} disabled={busy || revealing} className="mt-6 w-full rounded-2xl bg-[#e9cc7d] px-6 py-5 text-lg font-bold text-[#18271f] transition-all duration-200 hover:-translate-y-1 motion-reduce:transform-none">{revealing ? '運勢を開いています…' : busy ? '曲を準備しています…' : selected ? 'もう一度、おみくじを引く' : '今日のおみくじを引く'}</button>
          <p className="mt-3 text-xs leading-6 text-[#53647c]">Spotifyの再生準備ができていれば、引いた曲が流れます。<br />占いだけなら、接続前でも楽しめます。</p>
          <section aria-label="Spotifyプレーヤー" className="mt-8 rounded-2xl border border-white/70 bg-white/45 p-5 shadow-sm backdrop-blur-sm">
            <h2 className="text-sm font-semibold">Spotifyで聴く</h2>
            <p role="status" className="mt-2 text-sm leading-6 text-[#53647c]">{status}</p>
            {!initialSession.connected ? <button onClick={connectSpotify} className="mt-4 rounded-full bg-[#1ed760] px-5 py-3 text-sm font-bold text-[#10251b]">Spotifyに接続する</button> : <div className="mt-3 flex flex-wrap gap-4 text-xs"><button onClick={connectSpotify} className="underline underline-offset-4">再接続</button><button onClick={logout} className="underline underline-offset-4">接続情報を消す</button></div>}
            <div className="mt-4 flex flex-wrap gap-3">
              <button onClick={() => playSelected(selected)} disabled={!selected || !deviceId || busy} className="rounded-full border border-slate-500/30 px-4 py-3 text-sm">この曲を最初から再生</button>
              <button onClick={controlPlayback} disabled={!deviceId || busy || !track} className="rounded-full border border-slate-500/30 px-4 py-3 text-sm">{paused ? '再開' : '一時停止'}</button>
            </div>
            {track && <div className="mt-5 flex items-center gap-3 border-t border-slate-500/20 pt-4">
              {track.album.images[0] && <img src={track.album.images[0].url} alt={`${track.album.name}のジャケット`} className="h-14 w-14 shrink-0 rounded" />}
              <div className="min-w-0"><p className="text-xs text-[#53647c]">プレーヤーの曲</p><p className="break-words text-sm">{track.name}</p><p className="text-xs text-[#53647c]">{track.artists.map((artist) => artist.name).join(', ')}</p><a href={`https://open.spotify.com/track/${track.id}`} target="_blank" rel="noreferrer" className="text-xs text-[#087044] underline">Spotifyで開く ↗</a></div>
            </div>}
            {error && <p role="alert" className="mt-4 rounded-xl bg-red-950/60 p-4 text-sm leading-7 text-red-200">{error}</p>}
          </section>
        </section>
        <section ref={resultRef} aria-label="おみくじの結果" aria-live="polite" aria-atomic="true" className="fortune-stage min-w-0 self-start">
          <div key={drawCount} className={`fortune-frame ${selected ? 'fortune-frame--drawn' : ''}`} onAnimationEnd={(event) => {
            if (event.target !== event.currentTarget || event.animationName !== 'frame-arrive') return;
            revealingRef.current = false;
            setRevealing(false);
          }}>
          <div className={`fortune-card ${selected ? 'fortune-card--drawn' : ''}`}>
          {selected && <span className="rainbow-sweep" aria-hidden="true" />}
          <div className="fortune-content">
          {selected ? <>
            <p className="text-xs tracking-widest">YOUR MUSIC FORTUNE · {selected.genre}</p>
            <h2 className="mt-6 text-3xl font-semibold">{selected.luck}</h2>
            <p className="mt-5 text-base leading-8">{selected.fortune}</p>
            <div className="mt-6 border-y border-[#20372c]/20 py-5"><p className="text-xs font-bold">今日の小さなアクション</p><p className="mt-2 text-sm leading-7">{selected.action}</p></div>
            <p className="mt-6 text-xs">今日の一曲</p>
            <h3 className="mt-2 break-words text-2xl font-semibold">{selected.title}</h3>
            <p className="mt-2 text-sm">{selected.artist}</p>
            <a href={`https://open.spotify.com/track/${selected.trackId}`} target="_blank" rel="noreferrer" className="mt-4 inline-block text-sm underline underline-offset-4">Spotifyでこの曲を見る ↗</a>
            <p className="mt-6 text-xs leading-6 text-[#516359]">曲から生まれた、創作のおみくじです。今日を楽しむ小さなヒントに。</p>
          </> : <div className="py-14 text-center"><p className="text-5xl" aria-hidden="true">♫</p><h2 className="mt-7 text-2xl">どんな一日を、奏でよう。</h2><p className="mt-4 text-sm leading-8">おみくじを引くと、ここに<br />今日の一曲と運勢が届きます。</p><p className="mt-10 text-xs">CLASSICAL / POP / J-POP</p></div>}
          </div></div></div>
        </section>
      </div>
      <details className="border-t border-slate-500/20 py-6"><summary className="cursor-pointer text-sm text-[#53647c]">出会える30曲を見る</summary><ul className="mt-5 grid gap-3 sm:grid-cols-2">{songs.map((song) => <li key={song.id} className="min-w-0 text-sm"><span className="mr-2 text-xs text-[#67502d]">{song.genre}</span><a className="underline underline-offset-4" href={`https://open.spotify.com/track/${song.trackId}`} target="_blank" rel="noreferrer">{song.title}</a><span className="block text-xs leading-6 text-[#53647c]">{song.artist}</span></li>)}</ul></details>
      <footer className="border-t border-slate-500/20 pt-5 text-xs leading-6 text-[#53647c]">MUSIC OMIKUJI · 自分のSpotify Premiumで楽しむ音楽おみくじ。<br />再生にはChromeなどの対応ブラウザを使用してください。配信状況により再生できない曲があります。</footer>
    </main>
  );
}
