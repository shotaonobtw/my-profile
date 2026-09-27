export default function BookCard({ title, author, rating, comment }) {
  const stars = '★'.repeat(rating) + '☆'.repeat(5 - rating);

  return (
    <article className="h-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
      <p className="text-xs font-bold tracking-widest text-indigo-600">
        RECOMMENDED BOOK
      </p>

      <h2 className="mt-4 break-words text-xl font-bold text-slate-800">
        {title}
      </h2>

      <p className="mt-2 text-sm text-slate-500">
        著者：{author}
      </p>

      <p
        className="mt-5 text-xl tracking-wider text-amber-600"
        aria-label={`5点満点中${rating}点`}
      >
        <span aria-hidden="true">{stars}</span>
      </p>

      <p className="mt-5 break-words text-sm leading-7 text-slate-600">
        {comment}
      </p>
    </article>
  );
}