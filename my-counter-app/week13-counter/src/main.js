// CSSをJavaScriptから読み込む
import './style.css';

// 現在のカウントを保存する変数
let count = 0;

// 操作するHTML要素を取得
const countElement = document.getElementById('count');
const increaseButton = document.getElementById('increase');
const decreaseButton = document.getElementById('decrease');
const resetButton = document.getElementById('reset');

// 数字と色を画面に反映する
function renderCount() {
  countElement.textContent = count;

  // countがマイナスならnegativeクラスを付け、それ以外なら外す
  countElement.classList.toggle('negative', count < 0);
}

// 増やす
increaseButton.addEventListener('click', () => {
  count += 1;
  renderCount();
});

// 減らす
decreaseButton.addEventListener('click', () => {
  count -= 1;
  renderCount();
});

// リセット
resetButton.addEventListener('click', () => {
  count = 0;
  renderCount();
});

// 初期状態を表示
renderCount();