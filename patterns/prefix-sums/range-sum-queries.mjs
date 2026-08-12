export const maximumRangeSumValues = 10;
export const maximumRangeSumQueries = 8;

export function validateRangeSumInput(values, queries) {
  if (!Array.isArray(values) || values.length === 0) {
    throw new Error("Range Sum Queries requires at least one value.");
  }
  if (values.length > maximumRangeSumValues) {
    throw new Error(`Keep Range Sum Queries to ${maximumRangeSumValues} values or fewer.`);
  }
  for (let index = 0; index < values.length; index += 1) {
    if (!Object.hasOwn(values, index) || !Number.isFinite(values[index])) {
      throw new Error("Range Sum Queries only accepts finite numbers.");
    }
  }

  if (!Array.isArray(queries) || queries.length === 0) {
    throw new Error("Range Sum Queries requires at least one query.");
  }
  if (queries.length > maximumRangeSumQueries) {
    throw new Error(`Keep Range Sum Queries to ${maximumRangeSumQueries} queries or fewer.`);
  }
  for (let index = 0; index < queries.length; index += 1) {
    if (!Object.hasOwn(queries, index)) {
      throw new Error(`Query ${index + 1} is invalid.`);
    }
    assertValidQuery(queries[index], values.length, index);
  }

  return { values, queries };
}

/**
 * Builds prefix[0] = 0, then answers inclusive [start, end] queries with
 * prefix[end + 1] - prefix[start]. Every derived number is kept finite so a
 * trace can render exactly the same result as the solver.
 */
export function rangeSumQueries(values, queries) {
  validateRangeSumInput(values, queries);

  const prefix = [0];
  for (const value of values) {
    const next = prefix.at(-1) + value;
    assertFinitePrefix(next);
    prefix.push(next);
  }

  const answers = queries.map(([start, end]) => {
    const answer = prefix[end + 1] - prefix[start];
    assertFiniteAnswer(answer);
    return answer;
  });

  return { prefix, answers };
}

export const answerRangeSumQueries = rangeSumQueries;

export function parseRangeQueries(raw, valueCount) {
  if (!Number.isInteger(valueCount) || valueCount < 1 || valueCount > maximumRangeSumValues) {
    throw new Error(`Query bounds require between 1 and ${maximumRangeSumValues} values.`);
  }
  const text = String(raw ?? "").trim();
  if (!text) throw new Error("Enter at least one range query.");

  const parts = text.split(",").map((part) => part.trim());
  if (parts.some((part) => part === "")) {
    throw new Error("Enter one range query between each comma.");
  }
  if (parts.length > maximumRangeSumQueries) {
    throw new Error(`Keep Range Sum Queries to ${maximumRangeSumQueries} queries or fewer.`);
  }

  const queries = parts.map((part, index) => {
    const match = part.match(/^(\d+)\s*-\s*(\d+)$/);
    if (!match) {
      throw new Error(`Query ${index + 1} must use start-end, such as 0-2.`);
    }
    const query = [Number(match[1]), Number(match[2])];
    assertValidQuery(query, valueCount, index);
    return query;
  });

  return queries;
}

function assertValidQuery(query, valueCount, queryIndex) {
  if (
    !Array.isArray(query)
    || query.length !== 2
    || !Object.hasOwn(query, 0)
    || !Object.hasOwn(query, 1)
    || !Number.isInteger(query[0])
    || !Number.isInteger(query[1])
  ) {
    throw new Error(`Query ${queryIndex + 1} must contain two whole-number indices.`);
  }

  const [start, end] = query;
  if (start < 0 || start > end || end >= valueCount) {
    throw new Error(`Query ${queryIndex + 1} must satisfy 0 <= start <= end < ${valueCount}.`);
  }
}

export function assertFinitePrefix(value) {
  if (!Number.isFinite(value)) {
    throw new Error("Prefix sums must remain finite.");
  }
}

export function assertFiniteAnswer(value) {
  if (!Number.isFinite(value)) {
    throw new Error("Range sum answers must remain finite.");
  }
}
