export const maximumAnagramWords = 10;
export const maximumAnagramWordCharacters = 20;

const unicodeLetter = /^\p{L}$/u;

export function groupAnagrams(words) {
  validateGroupAnagramsInput(words);

  const groups = new Map();
  for (const word of words) {
    const signature = anagramSignature(word);
    if (!groups.has(signature)) groups.set(signature, []);
    groups.get(signature).push(word);
  }

  return [...groups.values()].map((group) => [...group]);
}

export function validateGroupAnagramsInput(words) {
  if (!Array.isArray(words) || words.length === 0) {
    throw new Error("Group Anagrams requires at least one word.");
  }
  if (words.length > maximumAnagramWords) {
    throw new Error(`Keep Group Anagrams to ${maximumAnagramWords} words or fewer.`);
  }

  for (let index = 0; index < words.length; index += 1) {
    if (!Object.hasOwn(words, index) || typeof words[index] !== "string") {
      throw new Error("Every Group Anagrams item must be a word.");
    }
    const characters = Array.from(words[index]);
    if (characters.length === 0 || characters.length > maximumAnagramWordCharacters) {
      throw new Error(`Each Group Anagrams word must contain 1-${maximumAnagramWordCharacters} Unicode letters.`);
    }
    if (!characters.every((character) => unicodeLetter.test(character))) {
      throw new Error("Group Anagrams words may contain Unicode letters only.");
    }
  }
  return words;
}

export function normalizeAnagramWord(word) {
  if (typeof word !== "string") {
    throw new Error("Anagram normalization requires a word.");
  }
  return word.toLocaleLowerCase("en-US");
}

export function anagramSignature(word) {
  const normalized = normalizeAnagramWord(word);
  return Array.from(normalized)
    .sort((left, right) => left.codePointAt(0) - right.codePointAt(0))
    .join("");
}
