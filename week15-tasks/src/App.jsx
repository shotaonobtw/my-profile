import { useEffect, useState } from 'react';

// 他の課題の保存データと混ざらない名前にする
const STORAGE_KEY = 'posse-week15-tasks';

// 最初に保存データを読み込む
function loadTasks() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (saved === null) {
      return [];
    }

    const data = JSON.parse(saved);

    // 保存されたデータの形を確認
    if (
      !Array.isArray(data) ||
      !data.every(
        (task) =>
          task !== null &&
          typeof task === 'object' &&
          typeof task.id === 'string' &&
          typeof task.text === 'string' &&
          typeof task.done === 'boolean'
      )
    ) {
      return [];
    }

    return data;
  } catch {
    // 読み込めない場合もアプリは使えるようにする
    return [];
  }
}

export default function App() {
  // タスク一覧
  const [tasks, setTasks] = useState(loadTasks);

  // 入力欄の文字
  const [input, setInput] = useState('');

  // 表示する種類
  const [filter, setFilter] = useState('all');

  // 入力エラー
  const [error, setError] = useState('');

  // 保存に失敗したときのメッセージ
  const [saveError, setSaveError] = useState('');

  // tasksが変わったらブラウザに保存
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
      setSaveError('');
    } catch {
      setSaveError(
        '保存できませんでした。再読み込みすると変更が失われる場合があります。'
      );
    }
  }, [tasks]);

  // タスクを追加
  function addTask(event) {
    event.preventDefault();

    // 前後の空白を取り除く
    const text = input.trim();

    if (text === '') {
      setError('タスクを入力してください。');
      return;
    }

    const newTask = {
      id: crypto.randomUUID(),
      text,
      done: false,
    };

    // 元の配列を変更せず、新しい配列を作る
    setTasks((previousTasks) => [...previousTasks, newTask]);

    setInput('');
    setError('');

    // 絞り込み中でも、追加したタスクが見えるようにする
    setFilter('all');
  }

  // 完了・未完了を切り替える
  function toggleTask(id) {
    setTasks((previousTasks) =>
      previousTasks.map((task) =>
        task.id === id
          ? { ...task, done: !task.done }
          : task
      )
    );
  }

  // 指定したタスクを除いた、新しい配列を作る
  function deleteTask(id) {
    setTasks((previousTasks) =>
      previousTasks.filter((task) => task.id !== id)
    );
  }

  // 表示用のタスクだけを取り出す
  const visibleTasks = tasks.filter((task) => {
    if (filter === 'active') {
      return !task.done;
    }

    if (filter === 'done') {
      return task.done;
    }

    return true;
  });

  // tasksから計算できるので、別のstateにはしない
  const remainingCount = tasks.filter((task) => !task.done).length;

  const filters = [
    { value: 'all', label: 'すべて' },
    { value: 'active', label: '未完了' },
    { value: 'done', label: '完了済み' },
  ];

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-10 text-slate-800">
      <main className="mx-auto max-w-2xl">
        <header className="mb-8">
          <p className="text-sm font-bold tracking-widest text-indigo-600">
            MY TASKS
          </p>

          <h1 className="mt-3 text-3xl font-bold">
            今日のやること
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-500">
            一つずつ終わらせて、できたことを増やそう。
          </p>
        </header>

        <section
          aria-label="タスク管理"
          className="rounded-2xl bg-white p-5 shadow-sm sm:p-8"
        >
          <form onSubmit={addTask} noValidate>
            <label
              htmlFor="task-input"
              className="mb-2 block text-sm font-bold"
            >
              新しいタスク
            </label>

            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                id="task-input"
                type="text"
                value={input}
                onChange={(event) => {
                  setInput(event.target.value);
                  setError('');
                }}
                placeholder="例：Reactの課題に取り組む"
                required
                aria-invalid={error !== ''}
                aria-describedby="input-error"
                className="min-w-0 flex-1 rounded-lg border border-slate-300 px-4 py-3 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              />

              <button
                type="submit"
                className="cursor-pointer rounded-lg bg-indigo-600 px-6 py-3 font-bold text-white transition hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              >
                追加する
              </button>
            </div>

            <p
              id="input-error"
              role="alert"
              className="mt-2 text-sm text-red-600"
            >
              {error}
            </p>
          </form>

          <div
            role="group"
            aria-label="タスクを絞り込む"
            className="mt-6 flex flex-wrap gap-2"
          >
            {filters.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setFilter(item.value)}
                aria-pressed={filter === item.value}
                className={`cursor-pointer rounded-full px-4 py-2 text-sm font-bold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 ${
                  filter === item.value
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <p
            role="status"
            className="mt-5 text-sm text-slate-500"
          >
            全{tasks.length}件・未完了{remainingCount}件・
            表示中{visibleTasks.length}件
          </p>

          {visibleTasks.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-500">
              {tasks.length === 0
                ? 'タスクはまだありません。追加してみましょう。'
                : 'この条件に当てはまるタスクはありません。'}
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {visibleTasks.map((task) => (
                <li
                  key={task.id}
                  className={`flex items-start gap-3 rounded-xl border p-4 ${
                    task.done
                      ? 'border-slate-200 bg-slate-50'
                      : 'border-indigo-100 bg-white'
                  }`}
                >
                  <label className="flex min-w-0 flex-1 cursor-pointer items-start gap-3">
                    <input
                      type="checkbox"
                      checked={task.done}
                      onChange={() => toggleTask(task.id)}
                      className="mt-1 h-5 w-5 shrink-0 accent-indigo-600"
                    />

                    <span
                      className={`min-w-0 break-words leading-7 ${
                        task.done
                          ? 'text-slate-500 line-through'
                          : 'text-slate-800'
                      }`}
                    >
                      {task.text}
                    </span>
                  </label>

                  <button
                    type="button"
                    onClick={() => deleteTask(task.id)}
                    aria-label={`${task.text}を削除`}
                    className="shrink-0 cursor-pointer rounded-lg px-3 py-2 text-sm font-bold text-red-600 transition hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-red-600"
                  >
                    削除
                  </button>
                </li>
              ))}
            </ul>
          )}

          <p role="alert" className="mt-4 text-sm text-red-600">
            {saveError}
          </p>
        </section>

        <footer className="mt-6 text-center text-xs leading-6 text-slate-500">
          タスクは、このブラウザに保存されます。
        </footer>
      </main>
    </div>
  );
}