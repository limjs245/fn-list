import assert from "node:assert/strict";

import { fnList } from "../lib/core.js";
import {
  _,
  let_,
  const_,
  set_,
  return_,
  if_,
  switch_,
  for_,
  while_,
  break_,
  continue_,
  throw_,
  try_,
  block_,
} from "../lib/dsl.js";

function test(name, fn) {
  try {
    fn();
    console.log("✅", name);
  } catch (error) {
    console.error("❌", name);
    throw error;
  }
}

test("1. return_ 기본 반환", () => {
  const f = fnList.param("x").pipe(
    return_(({ x }) => x + 1)
  );

  assert.equal(f(10), 11);
  assert.equal(f.run(10), 11);
});

test("2. 여러 파라미터 반환", () => {
  const f = fnList.param("x, y").pipe(
    return_(({ x, y }) => x + y)
  );

  assert.equal(f(10, 20), 30);
});

test("3. let_ 변수 선언 후 반환", () => {
  const f = fnList.param("x").pipe(
    let_("y")(({ x }) => x * 2),
    return_(({ y }) => y)
  );

  assert.equal(f(5), 10);
});

test("4. const_ 변수 선언 후 반환", () => {
  const f = fnList.param().pipe(
    const_("x")(100),
    return_(({ x }) => x)
  );

  assert.equal(f(), 100);
});

test("5. set_ 변수 대입", () => {
  const f = fnList.param().pipe(
    let_("x")(1),
    set_("x")(({ x }) => x + 9),
    return_(({ x }) => x)
  );

  assert.equal(f(), 10);
});

test("6. if_ / elseIf_ / else_ 분기", () => {
  const f = fnList.param("x").pipe(
    if_(({ x }) => x > 10)(
      return_("big")
    ).elseIf_(({ x }) => x > 5)(
      return_("middle")
    ).else_(
      return_("small")
    )
  );

  assert.equal(f(20), "big");
  assert.equal(f(7), "middle");
  assert.equal(f(3), "small");
});

test("7. switch_ fallthrough + break_", () => {
  const f = fnList.param("x").pipe(
    let_("out")(""),
    switch_(({ x }) => x)
      .case_(1)(
        set_("out")(({ out }) => out + "A")
      )
      .case_(2)(
        set_("out")(({ out }) => out + "B"),
        break_()
      )
      .default_(
        set_("out")(({ out }) => out + "D")
      ),
    return_(({ out }) => out)
  );

  assert.equal(f(1), "AB");
  assert.equal(f(2), "B");
  assert.equal(f(3), "D");
});

test("8. for_ 합계 계산", () => {
  const f = fnList.param("n").pipe(
    let_("sum")(0),
    for_(
      let_("i")(1),
      ({ i, n }) => i <= n,
      set_("i")(({ i }) => i + 1)
    )(
      set_("sum")(({ sum, i }) => sum + i)
    ),
    return_(({ sum }) => sum)
  );

  assert.equal(f(5), 15);
});

test("9. while_ 반복", () => {
  const f = fnList.param("n").pipe(
    let_("i")(0),
    while_(({ i, n }) => i < n)(
      set_("i")(({ i }) => i + 1)
    ),
    return_(({ i }) => i)
  );

  assert.equal(f(5), 5);
});

test("10. try_ / catch_ / finally_ 동작", () => {
  const f = fnList.param().pipe(
    let_("done")(false),
    try_(
      throw_("boom")
    ).catch_("error")(
      set_("done")(true),
      return_(({ error, done }) => done ? error : "failed")
    ).finally_(
      _()
    )
  );

  assert.equal(f(), "boom");
});

test("오류 1. param은 문자열만 허용", () => {
  assert.throws(
    () => fnList.param(123),
    /Parameter name must be a string/
  );
});

test("오류 2. 중복 파라미터 금지", () => {
  assert.throws(
    () => fnList.param("x", "x"),
    /Duplicate parameter name/
  );
});

test("오류 3. 잘못된 파라미터 이름 금지", () => {
  assert.throws(
    () => fnList.param("1x"),
    /Invalid parameter name/
  );
});

test("오류 4. pipe에는 함수 step만 들어갈 수 있음", () => {
  assert.throws(
    () => fnList.param("x").pipe(123),
    /Step must be a function/
  );
});

test("오류 5. let_ 변수 개수와 값 개수 불일치", () => {
  assert.throws(
    () => let_("x", "y")(1),
    /Expected 2 values, but got 1/
  );
});

test("오류 6. let_ 재선언 금지", () => {
  const f = fnList.param("x").pipe(
    let_("x")(10)
  );

  assert.throws(
    () => f(1),
    /Variable already declared/
  );
});

test("오류 7. const_ 변수에 set_ 금지", () => {
  const f = fnList.param().pipe(
    const_("x")(1),
    set_("x")(2)
  );

  assert.throws(
    () => f(),
    /Cannot assign to constant variable/
  );
});

test("오류 8. set_ 미선언 변수 대입 금지", () => {
  const f = fnList.param().pipe(
    set_("x")(10)
  );

  assert.throws(
    () => f(),
    /Variable is not declared/
  );
});

test("오류 9. if_ condition은 함수여야 함", () => {
  assert.throws(
    () => if_(true)(_()),
    /if_ condition must be a function/
  );
});

test("오류 10. switch_ 중복 case 금지", () => {
  assert.throws(
    () => switch_(({ x }) => x)
      .case_(1)(_())
      .case_(1)(_()),
    /Duplicate case value/
  );
});

console.log("All tests passed.");