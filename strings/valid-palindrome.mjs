export const maximumPalindromeCharacters = 48;

const unicodeAlphanumeric = /^[\p{L}\p{N}]$/u;

/**
 * Valid Palindrome works with Unicode code points rather than UTF-16 code
 * units. Punctuation and whitespace are ignored; letters are compared with a
 * deterministic English-locale lowercase transform.
 */
export function isPalindrome(text) {
  validatePalindromeInput(text);

  const characters = Array.from(text);
  let left = 0;
  let right = characters.length - 1;

  while (left < right) {
    while (left < right && !isPalindromeCharacter(characters[left])) {
      left += 1;
    }
    while (left < right && !isPalindromeCharacter(characters[right])) {
      right -= 1;
    }
    if (left >= right) break;

    const normalizedLeft = normalizePalindromeCharacter(characters[left]);
    const normalizedRight = normalizePalindromeCharacter(characters[right]);
    if (normalizedLeft !== normalizedRight) {
      return false;
    }

    left += 1;
    right -= 1;
  }

  return true;
}

export function validatePalindromeInput(text) {
  if (typeof text !== "string") {
    throw new Error("Valid Palindrome requires text.");
  }

  const characters = Array.from(text);
  if (characters.length === 0) {
    throw new Error("Enter at least one character.");
  }
  if (characters.length > maximumPalindromeCharacters) {
    throw new Error(`Keep the lesson to ${maximumPalindromeCharacters} characters or fewer.`);
  }
  if (!characters.some(isPalindromeCharacter)) {
    throw new Error("Include at least one letter or number.");
  }

  return text;
}

export function isPalindromeCharacter(character) {
  return typeof character === "string"
    && Array.from(character).length === 1
    && unicodeAlphanumeric.test(character);
}

export function normalizePalindromeCharacter(character) {
  if (!isPalindromeCharacter(character)) {
    throw new Error("Only a single Unicode letter or number can be normalized.");
  }
  return character.toLocaleLowerCase("en-US");
}
