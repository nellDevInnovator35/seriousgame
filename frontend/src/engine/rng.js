// ========== GENERATEUR PSEUDO-ALEATOIRE SEEDABLE (mulberry32) ==========
// L'etat du generateur (rngState) est stocke dans le state du jeu :
// -> deux parties avec le meme seed sont strictement identiques
//    (meme carte, memes aleas) => rejouable, comparable, testable.

// Tire un nombre dans [0,1) en faisant avancer obj.rngState.
export function nextRand(obj) {
  if (obj.rngState == null) {
    // Retro-compatibilite : anciennes sauvegardes sans seed
    obj.rngState = (Math.random() * 4294967296) >>> 0;
  }
  let t = (obj.rngState = (obj.rngState + 0x6D2B79F5) >>> 0);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

// Convertit une saisie utilisateur (nombre, texte ou vide) en seed 32 bits.
export function seedFrom(input) {
  if (input == null || input === "") return (Math.random() * 4294967296) >>> 0;
  const n = Number(input);
  if (Number.isFinite(n)) return n >>> 0;
  let h = 2166136261 >>> 0;
  const str = String(input);
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
