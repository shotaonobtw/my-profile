import { songs } from './songs.js';

export const genres = ['すべて', 'クラシック', '洋楽', 'J-pop'];

// 同じ曲が連続しないよう、直前の曲を候補から外す。
export function drawSong(genre, previousId, random = Math.random) {
  const candidates = songs.filter((song) =>
    (genre === 'すべて' || song.genre === genre) && song.id !== previousId);
  if (candidates.length === 0) return null;
  return candidates[Math.floor(random() * candidates.length)];
}
