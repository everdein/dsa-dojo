import {
  isPalindromeCharacter,
  maximumPalindromeCharacters,
  normalizePalindromeCharacter,
  validatePalindromeInput
} from "./valid-palindrome.mjs";

export const maximumFirstNonRepeatingCharacters = maximumPalindromeCharacters;

/**
 * Returns the first raw code-point position whose case-normalized
 * alphanumeric key occurs exactly once. Formatting characters remain part of
 * the raw position sequence but do not participate in counting.
 */
export function findFirstNonRepeatingCharacter(text) {
  validateFirstNonRepeatingInput(text);

  const characters = Array.from(text);
  const counts = new Map();

  for (const character of characters) {
    if (!isPalindromeCharacter(character)) continue;
    const normalized = normalizePalindromeCharacter(character);
    counts.set(normalized, (counts.get(normalized) ?? 0) + 1);
  }

  for (let index = 0; index < characters.length; index += 1) {
    const character = characters[index];
    if (!isPalindromeCharacter(character)) continue;
    const normalized = normalizePalindromeCharacter(character);
    if (counts.get(normalized) === 1) {
      return { index, character, normalized };
    }
  }

  return null;
}

export function validateFirstNonRepeatingInput(text) {
  if (typeof text !== "string") {
    throw new Error("First Non-Repeating Character requires text.");
  }
  validatePalindromeInput(text);
  return text;
}
