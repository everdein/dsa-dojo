export const maximumParenthesesCharacters = 16;
const bracketCharacters = new Set(["(", ")", "[", "]", "{", "}"]);
const matchingOpener = new Map([[")", "("], ["]", "["], ["}", "{"]]);

export function validateParenthesesInput(text) {
  if (typeof text !== "string") throw new Error("Valid Parentheses requires text.");
  const characters = Array.from(text);
  if (characters.length === 0 || characters.length > maximumParenthesesCharacters) {
    throw new Error(`Enter 1-${maximumParenthesesCharacters} bracket characters.`);
  }
  let bracketCount = 0;
  for (const character of characters) {
    if (bracketCharacters.has(character)) {
      bracketCount += 1;
    } else if (!/^\s$/u.test(character)) {
      throw new Error("Use only (), [], {}, and whitespace.");
    }
  }
  if (bracketCount === 0) throw new Error("Enter at least one bracket.");
  return text;
}

export function isValidParentheses(text) {
  validateParenthesesInput(text);
  const stack = [];
  for (const character of Array.from(text)) {
    if (/^\s$/u.test(character)) continue;
    if (!matchingOpener.has(character)) {
      stack.push(character);
      continue;
    }
    if (stack.pop() !== matchingOpener.get(character)) return false;
  }
  return stack.length === 0;
}

export function isOpeningBracket(character) {
  return character === "(" || character === "[" || character === "{";
}

export function expectedOpeningBracket(character) {
  return matchingOpener.get(character) ?? null;
}
