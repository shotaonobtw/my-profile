import BookCard from './components/BookCard.jsx';

const books = [
  {
    id: 'book-001',
    title: '吾輩は猫である',
    author: '夏目漱石',
    rating: 4,
    comment:
      '猫の視点から人間を見る語り口が面白い作品です。いつもと違う視点で物事を見るきっかけになります。',
  },
  {
    id: 'book-002',
    title: '銀河鉄道の夜',
    author: '宮沢賢治',
    rating: 5,
    comment:
      '幻想的な世界を旅しながら、友情や幸せについて考えられる作品です。',
  },
  {
    id: 'book-003',
    title: '走れメロス',
    author: '太宰治',
    rating: 4,
    comment:
      '約束を守ることや、人を信じることについて考えさせられます。短くて読み始めやすい一冊です。',
  },
];

export default function App() {
  return (
    <div className="min-h-screen bg-slate-100 text-slate-800">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <p className="text-sm font-bold tracking-widest text-indigo-600">
            MY BOOKSHELF
          </p>

          <h1 className="mt-4 text-3xl font-bold sm:text-4xl">
            おすすめの本
          </h1>

          <p className="mt-4 leading-7 text-slate-500">
            お気に入りの本を紹介します。
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        <p className="mb-6 text-sm text-slate-500">
          {books.length}冊のおすすめ
        </p>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {books.map((book) => (
            <BookCard
              key={book.id}
              title={book.title}
              author={book.author}
              rating={book.rating}
              comment={book.comment}
            />
          ))}
        </div>
      </main>

      <footer className="px-6 py-8 text-center text-xs text-slate-500">
        MY BOOKSHELF — POSSE Week14
      </footer>
    </div>
  );
}