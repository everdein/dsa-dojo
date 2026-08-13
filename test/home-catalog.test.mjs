import test from "node:test";
import assert from "node:assert/strict";
import { curriculumLessons } from "../studio/src/curriculum-manifest.mjs";
import {
  curriculumTopicId,
  groupCurriculumByTopic
} from "../studio/src/home-catalog.mjs";

test("home catalog groups all lessons once by first topic appearance", () => {
  const groups = groupCurriculumByTopic(curriculumLessons);
  const expectedTopics = [...new Set(curriculumLessons.map(({ topic }) => topic))];

  assert.equal(curriculumLessons.length, 55);
  assert.equal(groups.length, 20);
  assert.deepEqual(groups.map(({ topic }) => topic), expectedTopics);
  assert.equal(groups.reduce((total, { lessons }) => total + lessons.length, 0), 55);
  assert.equal(
    new Set(groups.flatMap(({ lessons }) => lessons.map(({ id }) => id))).size,
    55
  );
});

test("each topic preserves its lessons' manifest order", () => {
  const groups = groupCurriculumByTopic(curriculumLessons);

  for (const group of groups) {
    assert.deepEqual(
      group.lessons.map(({ id }) => id),
      curriculumLessons
        .filter(({ topic }) => topic === group.topic)
        .map(({ id }) => id),
      group.topic
    );
  }
});

test("topic anchors are stable, unique, and independent of topic position", () => {
  const groups = groupCurriculumByTopic(curriculumLessons);
  const ids = groups.map(({ topic }) => curriculumTopicId(topic));

  assert.equal(new Set(ids).size, groups.length);
  assert.equal(ids[0], "curriculum-topic-arrays");
  assert.equal(ids.at(-1), "curriculum-topic-bit-manipulation");
  assert.deepEqual(
    [...groups].reverse().map(({ topic }) => curriculumTopicId(topic)).reverse(),
    ids
  );
  assert.ok(ids.every((id) => /^curriculum-topic-[a-z0-9-]+$/.test(id)));
});

test("catalog grouping rejects malformed collection and topic input", () => {
  assert.throws(() => groupCurriculumByTopic(null), /array/i);
  assert.throws(() => groupCurriculumByTopic([{}]), /topic/i);
  assert.throws(() => groupCurriculumByTopic([{ topic: " " }]), /topic/i);
  assert.throws(() => curriculumTopicId(""));
  assert.throws(() => curriculumTopicId(null));
});
