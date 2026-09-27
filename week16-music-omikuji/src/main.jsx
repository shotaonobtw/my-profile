import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { restoreSession } from './spotify';

const root = createRoot(document.getElementById('root'));
root.render(<p className="p-8" role="status">Spotifyの接続状態を確認しています…</p>);
restoreSession().then((initialSession) => {
  root.render(<StrictMode><App initialSession={initialSession} /></StrictMode>);
}).catch(() => {
  root.render(<p className="p-8" role="alert">ブラウザの保存機能が利用できません。通常のブラウザウィンドウで再度開いてください。</p>);
});
