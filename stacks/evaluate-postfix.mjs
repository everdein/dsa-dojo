export const maximumPostfixTokens = 15;
export const postfixOperators = Object.freeze(["+", "-", "*", "/"]);

const decimalNumberPattern = /^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i;
const operatorSet = new Set(postfixOperators);

export function parsePostfixProgram(program) {
  if (typeof program !== "string" || program.trim() === "") {
    throw new Error("Enter a postfix program with at least one token.");
  }

  const rawTokens = program.trim().split(/\s+/u);
  if (rawTokens.length > maximumPostfixTokens) {
    throw new Error(`Keep the postfix program to ${maximumPostfixTokens} tokens or fewer.`);
  }

  const tokens = rawTokens.map((token, index) => {
    if (operatorSet.has(token)) return token;
    if (!decimalNumberPattern.test(token)) {
      throw new Error(`Token ${index + 1} must be a finite number or +, -, *, or /.`);
    }
    const value = Number(token);
    if (!Number.isFinite(value)) {
      throw new Error(`Token ${index + 1} must be a finite number.`);
    }
    return value;
  });

  return validatePostfixTokens(tokens);
}

export function validatePostfixTokens(tokens) {
  if (!Array.isArray(tokens) || tokens.length === 0) {
    throw new Error("Postfix evaluation requires at least one token.");
  }
  if (tokens.length > maximumPostfixTokens) {
    throw new Error(`Keep postfix evaluation to ${maximumPostfixTokens} tokens or fewer.`);
  }

  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (
      !Object.hasOwn(tokens, index)
      || !(Number.isFinite(token) || typeof token === "string" && operatorSet.has(token))
    ) {
      throw new Error(`Token ${index + 1} must be a finite number or postfix operator.`);
    }
  }
  return tokens;
}

/**
 * Evaluate a tokenized postfix expression. Operators always consume the right
 * operand first and then the left operand, preserving subtraction and division
 * order without needing parentheses.
 */
export function evaluatePostfix(tokens) {
  validatePostfixTokens(tokens);
  const stack = [];
  for (let tokenIndex = 0; tokenIndex < tokens.length; tokenIndex += 1) {
    const token = tokens[tokenIndex];
    if (typeof token === "number") {
      stack.push(token);
      continue;
    }
    if (stack.length < 2) {
      throw new Error(`Operator ${token} at token ${tokenIndex + 1} requires two operands.`);
    }
    const right = stack.pop();
    const left = stack.pop();
    const result = applyPostfixOperator(left, token, right, tokenIndex);
    stack.push(result);
  }
  if (stack.length !== 1) {
    throw new Error(`Postfix program ended with ${stack.length} operands instead of one result.`);
  }
  return stack[0];
}

export function formatPostfixProgram(tokens) {
  validatePostfixTokens(tokens);
  return tokens.map((token) => (
    typeof token === "number" && Object.is(token, -0) ? "-0" : String(token)
  )).join(" ");
}

export function applyPostfixOperator(left, operator, right, tokenIndex = 0) {
  if (!Number.isFinite(left) || !Number.isFinite(right) || !operatorSet.has(operator)) {
    throw new Error("A postfix operation requires finite operands and a supported operator.");
  }
  if (operator === "/" && right === 0) {
    throw new Error(`Division by zero at token ${tokenIndex + 1} is not allowed.`);
  }

  const result = operator === "+"
    ? left + right
    : operator === "-"
      ? left - right
      : operator === "*"
        ? left * right
        : left / right;
  if (!Number.isFinite(result)) {
    throw new Error(`Operator ${operator} at token ${tokenIndex + 1} produced a non-finite result.`);
  }
  return result;
}
