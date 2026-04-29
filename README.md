# fnList

`fnList`는 함수를 **실행 가능한 step 리스트**로 다루기 위한 JavaScript 라이브러리입니다.

일반적인 함수처럼 실행할 수 있고, 동시에 리스트처럼 조회·수정·조합·추적할 수 있습니다.

```js
const f = fnList.param("x").pipe(
  x => x + 1,
  x => x * 2,
  x => x - 5
);

f(10);      // 17
f.run(10);  // 17
```

---

## 핵심 아이디어

`fnList`는 하나의 함수를 여러 단계의 리스트로 표현합니다.

```js
const f = fnList.param("x").pipe(
  x => x + 1,
  x => x * 2,
  x => x - 5
);
```

위 코드는 다음과 같은 흐름을 가집니다.

```txt
10
→ 11
→ 22
→ 17
```

즉, `pipe(...)` 안의 각 요소는 하나의 step입니다.

---

## 설치

```bash
npm install fn-list
```

또는:

```bash
pnpm add fn-list
```

---

## 기본 사용법

```js
import {
  fnList,
  let_,
  const_,
  set_,
  if_,
  switch_,
  for_,
  while_,
  return_,
  throw_,
  try_,
  break_,
  continue_,
  tap_,
  consoleLog_,
  call_,
  _
} from "fnlist";
```

```js
const myFun = fnList.param("x").pipe(
  x => x + 1,
  x => x * 2
);

myFun(10); // 22
```

---

## 파라미터 선언

파라미터는 문자열로 선언합니다.

```js
const f = fnList.param("x").pipe(...);
```

여러 파라미터를 사용할 수 있습니다.

```js
const f = fnList.param("x", "y").pipe(...);
```

또는 문자열 하나로 선언할 수도 있습니다.

```js
const f = fnList.param("x, y").pipe(...);
```

추천 방식은 다음과 같습니다.

```js
fnList.param("x", "y")
```

---

# 실행

`fnList.param(...).pipe(...)`의 결과는 실행 가능한 함수입니다.

```js
const f = fnList.param("x").pipe(
  x => x + 1,
  x => x * 2
);

f(10);     // 22
f.run(10); // 22
```

`f(...)`와 `f.run(...)`은 같은 의미입니다.

```txt
f(10) === f.run(10)
```

---

# 리스트처럼 다루기

`fnList`는 함수처럼 실행되지만, 내부적으로는 step 리스트를 가집니다.

```js
const f = fnList.param("x").pipe(
  x => x + 1,
  x => x * 2,
  x => x - 5
);
```

## `.size`

step 개수를 반환합니다.

```js
f.size; // 3
```

## `.params`

파라미터 이름 목록을 반환합니다.

```js
f.params; // ["x"]
```

## `.at(index)`

특정 step을 가져옵니다.

```js
const firstStep = f.at(0);
```

## `.toArray()`

step 배열을 반환합니다.

```js
const steps = f.toArray();
```

`toArray()`는 내부 배열을 직접 노출하지 않고 복사본을 반환하는 것을 권장합니다.

---

# 리스트 조작

`fnList`는 기존 함수를 직접 수정하지 않습니다.

대신 새로운 `fnList`를 반환합니다.

```js
const f2 = f.append(step);

// f는 그대로 유지됨
// f2는 step이 추가된 새 함수
```

이 불변성 덕분에 기본 파이프라인을 안전하게 재사용할 수 있습니다.

```js
const base = fnList.param("x").pipe(
  validate,
  normalize
);

const create = base.append(save);
const preview = base.append(render);
```

---

## `.append(step)`

마지막에 step을 추가합니다.

```js
const f2 = f.append(x => x + 100);
```

---

## `.prepend(step)`

처음에 step을 추가합니다.

```js
const f2 = f.prepend(x => x - 1);
```

---

## `.insert(index, step)`

특정 위치에 step을 삽입합니다.

```js
const f2 = f.insert(1, tap_(x => console.log(x)));
```

---

## `.remove(index)`

특정 위치의 step을 제거합니다.

```js
const f2 = f.remove(1);
```

---

## `.replace(index, step)`

특정 위치의 step을 교체합니다.

```js
const f2 = f.replace(1, x => x * 10);
```

---

## `.slice(start, end)`

일부 step만 가진 새 `fnList`를 만듭니다.

```js
const f2 = f.slice(0, 2);
```

---

## `.concat(other)`

다른 `fnList` 또는 block을 이어 붙입니다.

```js
const f3 = f.concat(other);
```

---

# 실행 추적

## `.trace(...)`

각 step의 실행 과정을 기록합니다.

```js
const f = fnList.param("x").pipe(
  x => x + 1,
  x => x * 2,
  x => x - 5
);

f.trace(10);
```

예상 결과:

```js
[
  {
    index: 0,
    input: 10,
    output: 11
  },
  {
    index: 1,
    input: 11,
    output: 22
  },
  {
    index: 2,
    input: 22,
    output: 17
  }
]
```

`let_`, `set_`, `if_`, `for_` 같은 DSL step을 사용할 때는 context 변화를 추적할 수 있습니다.

```js
const f = fnList.param("x", "y").pipe(
  let_("sum")(0),
  set_("sum")(({ x, y }) => x + y),
  return_(({ sum }) => sum)
);

f.trace(10, 20);
```

예상 구조:

```js
[
  {
    index: 0,
    type: "let",
    before: { x: 10, y: 20 },
    after: { x: 10, y: 20, sum: 0 }
  },
  {
    index: 1,
    type: "set",
    before: { x: 10, y: 20, sum: 0 },
    after: { x: 10, y: 20, sum: 30 }
  },
  {
    index: 2,
    type: "return",
    returned: 30
  }
]
```

---

# 단계별 실행

`next()`는 `fnList` 자체가 아니라 실행 세션에서 사용합니다.

```js
const runner = f.runner(10);

runner.next();
runner.next();
runner.next();
```

예:

```js
const f = fnList.param("x").pipe(
  x => x + 1,
  x => x * 2
);

const runner = f.runner(10);

runner.next();
// { index: 0, input: 10, output: 11, done: false }

runner.next();
// { index: 1, input: 11, output: 22, done: false }

runner.next();
// { value: 22, done: true }
```

`f.next()`를 직접 제공하지 않는 이유는 `next()`에는 실행 중인 입력값과 현재 위치가 필요하기 때문입니다.

따라서 실행 상태는 `runner`가 관리합니다.

---

# 구조 확인

## `.inspect()`

`inspect()`는 함수를 실행하지 않고 구조만 확인합니다.

```js
const f = fnList.param("x", "y").pipe(
  let_("sum")(0),
  set_("sum")(({ x, y }) => x + y),
  return_(({ sum }) => sum)
);

f.inspect();
```

예상 결과:

```js
{
  params: ["x", "y"],
  size: 3,
  steps: [
    { index: 0, type: "let", name: "sum" },
    { index: 1, type: "set", name: "sum" },
    { index: 2, type: "return" }
  ]
}
```

---

# Context 기반 DSL

`fnList`는 단순 함수 파이프라인뿐 아니라, 변수와 제어 흐름을 표현하는 DSL을 제공합니다.

여러 변수를 사용할 때는 context 객체를 사용합니다.

```js
const f = fnList.param("x", "y").pipe(
  let_("z")(10),
  return_(({ x, y, z }) => x + y + z)
);

f(1, 2); // 13
```

실행 중 context는 대략 다음과 같습니다.

```js
{
  x: 1,
  y: 2,
  z: 10
}
```

---

# `_`

아무 일도 하지 않는 빈 step입니다.

```js
const f = fnList.param("x").pipe(
  _()
);
```

주로 `for_`에서 초기식이 필요 없을 때 사용합니다.

```js
for_(
  _(),
  ({ i }) => i < 10,
  set_("i")(({ i }) => i + 1)
)(
  ...
)
```

---

# `let_`

변수를 선언합니다.

```js
const f = fnList.param("x").pipe(
  let_("a")(10),
  return_(({ a }) => a)
);

f(0); // 10
```

여러 변수를 선언할 수 있습니다.

```js
const f = fnList.param("x").pipe(
  let_("a", "b")(10, 20),
  return_(({ a, b }) => a + b)
);
```

---

# `const_`

상수를 선언합니다.

```js
const f = fnList.param("x").pipe(
  const_("limit")(10),
  return_(({ limit }) => limit)
);
```

`const_`로 선언한 값은 `set_`으로 변경할 수 없습니다.

```js
fnList.param("x").pipe(
  const_("a")(10),
  set_("a")(20) // error
);
```

---

# `set_`

변수에 값을 대입합니다.

```js
const f = fnList.param("x").pipe(
  let_("a")(10),
  set_("a")(20),
  return_(({ a }) => a)
);
```

현재 context를 기준으로 값을 계산할 수 있습니다.

```js
const f = fnList.param("x").pipe(
  let_("a")(10),
  set_("a")(({ a }) => a + 1),
  return_(({ a }) => a)
);
```

여러 변수에 한 번에 대입할 수 있습니다.

```js
const f = fnList.param("x").pipe(
  let_("a", "b")(0, 0),
  set_("a", "b")(10, 20),
  return_(({ a, b }) => a + b)
);
```

실행 중 계산해야 하는 값은 함수로 전달해야 합니다.

```js
set_("x")(({ x }) => x + 1)
```

다음 형태는 사용할 수 없습니다.

```js
set_("x")(x + 1)
```

`x + 1`이 실행 시점이 아니라 선언 시점에 평가되기 때문입니다.

---

# `return_`

결과값을 반환합니다.

```js
const f = fnList.param("x").pipe(
  return_(x => x + 1)
);

f(10); // 11
```

여러 변수를 사용할 때는 context 객체를 구조분해합니다.

```js
const f = fnList.param("x", "y").pipe(
  return_(({ x, y }) => x + y)
);

f(10, 20); // 30
```

`return_` 이후의 step은 실행되지 않습니다.

```js
const f = fnList.param("x").pipe(
  return_(x => x + 1),
  x => x * 100
);

f(10); // 11
```

---

# `if_`, `.elseIf_`, `.else_`

조건 분기를 표현합니다.

```js
const f = fnList.param("x").pipe(
  if_(x => x > 10)(
    return_(() => "big")
  ).else_(
    return_(() => "small")
  )
);
```

여러 변수를 사용할 수 있습니다.

```js
const f = fnList.param("x", "y").pipe(
  if_(({ x, y }) => x > y)(
    return_(() => "x is bigger")
  ).elseIf_(({ x, y }) => x === y)(
    return_(() => "same")
  ).else_(
    return_(() => "y is bigger")
  )
);
```

기본 형태:

```js
if_(condition)(
  ...
).elseIf_(condition)(
  ...
).else_(
  ...
)
```

---

# `switch_`

값에 따라 분기합니다.

```js
const f = fnList.param("x").pipe(
  switch_(x => x)
    .case_(1)(
      return_(() => "one")
    )
    .case_(2)(
      return_(() => "two")
    )
    .default_(
      return_(() => "unknown")
    )
);
```

context를 사용할 수도 있습니다.

```js
const f = fnList.param("type", "value").pipe(
  switch_(({ type }) => type)
    .case_("number")(
      return_(({ value }) => value * 2)
    )
    .case_("string")(
      return_(({ value }) => value.length)
    )
    .default_(
      throw_(new Error("Unknown type"))
    )
);
```

---

# `for_`

반복문입니다.

```js
const f = fnList.param("limit").pipe(
  let_("sum")(0),

  for_(
    let_("i")(0),
    ({ i, limit }) => i <= limit,
    set_("i")(({ i }) => i + 1)
  )(
    set_("sum")(({ sum, i }) => sum + i)
  ),

  return_(({ sum }) => sum)
);
```

형태는 JavaScript의 `for`와 비슷합니다.

```js
for_(
  init,
  condition,
  update
)(
  body
)
```

초기식이 필요 없으면 `_()`를 사용할 수 있습니다.

```js
for_(
  _(),
  ({ i }) => i < 10,
  set_("i")(({ i }) => i + 1)
)(
  ...
)
```

---

# `while_`

조건이 참인 동안 반복합니다.

```js
const f = fnList.param("x").pipe(
  let_("i")(0),

  while_(({ i }) => i < 10)(
    consoleLog_(({ i }) => i),
    set_("i")(({ i }) => i + 1)
  ),

  return_(({ i }) => i)
);
```

---

# `break_`

`for_`, `while_`, `switch_`를 종료합니다.

```js
const f = fnList.param("x").pipe(
  for_(
    let_("i")(0),
    ({ i }) => i < 10,
    set_("i")(({ i }) => i + 1)
  )(
    if_(({ i }) => i === 5)(
      break_()
    )
  )
);
```

---

# `continue_`

현재 반복을 건너뛰고 다음 반복으로 넘어갑니다.

```js
const f = fnList.param("x").pipe(
  for_(
    let_("i")(0),
    ({ i }) => i < 10,
    set_("i")(({ i }) => i + 1)
  )(
    if_(({ i }) => i % 2 === 0)(
      continue_()
    ),

    consoleLog_(({ i }) => i)
  )
);
```

`while_`에서 `continue_()`를 사용할 때는 무한 루프에 주의해야 합니다.

```js
while_(({ i }) => i < 10)(
  set_("i")(({ i }) => i + 1),

  if_(({ i }) => i === 5)(
    continue_()
  ),

  consoleLog_(({ i }) => i)
)
```

---

# `throw_`

에러를 던집니다.

```js
const f = fnList.param("x").pipe(
  throw_("에러입니다")
);
```

다양한 값을 던질 수 있습니다.

```js
throw_(404)
throw_(new Error("에러입니다"))
throw_({ code: 400, message: "에러입니다" })
```

조건과 함께 사용할 수 있습니다.

```js
const f = fnList.param("x").pipe(
  if_(x => x < 0)(
    throw_(new Error("x must be positive"))
  ),

  return_(x => x)
);
```

---

# `try_`, `.catch_`, `.finally_`

예외 처리를 표현합니다.

```js
const f = fnList.param("x").pipe(
  try_(
    throw_(new Error("에러입니다"))
  )
  .catch_("error")(
    consoleLog_(({ error }) => error.message),
    return_(() => "recovered")
  )
  .finally_(
    consoleLog_(() => "done")
  )
);
```

기본 형태:

```js
try_(
  ...
).catch_("error")(
  ...
).finally_(
  ...
)
```

`catch_("error")`는 잡은 에러를 `"error"`라는 이름의 변수로 context에 저장합니다.

---

# `call_`

함수를 호출하고 그 결과를 다음 값으로 넘깁니다.

```js
const f = fnList.param("x").pipe(
  call_(x => myFun2(x))
);
```

context를 사용할 수도 있습니다.

```js
const f = fnList.param("x", "y").pipe(
  call_(({ x, y }) => myFun2(x, y))
);
```

단순한 경우에는 일반 함수를 그대로 써도 됩니다.

```js
const f = fnList.param("x").pipe(
  x => myFun2(x)
);
```

`call_`은 해당 step이 명시적인 함수 호출임을 드러내고 싶을 때 사용합니다.

---

# `tap_`

현재 값을 바꾸지 않고 부수 효과만 실행합니다.

```js
const f = fnList.param("x").pipe(
  tap_(x => console.log(x)),
  x => x + 1
);
```

`tap_`은 콜백의 반환값을 버리고 원래 값을 그대로 다음 step으로 넘깁니다.

```js
tap_(x => console.log(x))
```

은 다음과 비슷합니다.

```js
x => {
  console.log(x);
  return x;
}
```

context를 사용할 수도 있습니다.

```js
const f = fnList.param("x", "y").pipe(
  tap_(({ x, y }) => console.log(x, y)),
  return_(({ x, y }) => x + y)
);
```

---

# `consoleLog_`

`console.log` 전용 편의 함수입니다.

```js
const f = fnList.param("x").pipe(
  consoleLog_(),
  x => x + 1
);
```

특정 값을 출력할 수도 있습니다.

```js
const f = fnList.param("x", "y").pipe(
  consoleLog_(({ x, y }) => x + y),
  return_(({ x, y }) => x + y)
);
```

다음 두 코드는 비슷합니다.

```js
consoleLog_(({ x }) => x)
```

```js
tap_(({ x }) => console.log(x))
```

---

# Block

block은 여러 step을 묶은 재사용 가능한 조각입니다.

```js
const validation = fnList.block(
  if_(({ x }) => x == null)(
    throw_(new Error("x is required"))
  ),

  if_(({ x }) => x < 0)(
    throw_(new Error("x must be positive"))
  )
);
```

block은 `fnList` 안에서 하나의 step처럼 사용할 수 있습니다.

```js
const f = fnList.param("x").pipe(
  validation,
  return_(({ x }) => x * 2)
);
```

---

## `fnList.block(...)`

재사용 가능한 block을 만듭니다.

```js
const normalize = fnList.block(
  set_("x")(({ x }) => Number(x))
);
```

```js
const calculate = fnList.block(
  set_("x")(({ x }) => x * 2)
);
```

```js
const f = fnList.param("x").pipe(
  normalize,
  calculate,
  return_(({ x }) => x)
);
```

---

## `block_(...)`

`block_`는 `fnList.block(...)`의 별칭으로 사용할 수 있습니다.

```js
const block_ = fnList.block;
```

```js
const f = fnList.param("x").pipe(
  block_(
    let_("a")(10),
    set_("a")(({ a }) => a + 1)
  ),

  return_(({ a }) => a)
);
```

---

# Block도 리스트처럼 다루기

block도 step 리스트입니다.

따라서 `fnList`와 비슷한 리스트 API를 가질 수 있습니다.

```js
const validation = fnList.block(
  if_(({ x }) => x == null)(
    throw_(new Error("x is required"))
  ),

  if_(({ x }) => x < 0)(
    throw_(new Error("x must be positive"))
  )
);
```

```js
validation.size;
validation.at(0);
validation.toArray();
validation.inspect();
```

block도 불변 조작을 지원합니다.

```js
const validation2 = validation.append(
  consoleLog_(({ x }) => x)
);
```

기존 `validation`은 바뀌지 않고, `validation2`가 새 block이 됩니다.

---

# 조합

`fnList`의 가장 큰 장점은 작은 step과 block을 조합해서 큰 함수를 만들 수 있다는 점입니다.

```js
const validate = fnList.block(
  if_(({ x }) => x == null)(
    throw_(new Error("x is required"))
  )
);

const normalize = fnList.block(
  set_("x")(({ x }) => Number(x))
);

const calculate = fnList.block(
  set_("x")(({ x }) => x * 2)
);

const f = fnList.param("x").pipe(
  validate,
  normalize,
  calculate,
  return_(({ x }) => x)
);
```

또는 `concat`으로 조합할 수 있습니다.

```js
const f = fnList
  .param("x")
  .pipe(return_(({ x }) => x))
  .concat(validate)
  .concat(normalize);
```

---

# `fnList.from(...)`

기존 step 배열에서 block 또는 fnList를 만듭니다.

```js
const steps = [
  x => x + 1,
  x => x * 2
];

const block = fnList.from(steps);
```

파라미터와 함께 완전한 실행 가능한 fnList를 만들 수도 있습니다.

```js
const f = fnList.from(steps, {
  params: ["x"]
});

f(10); // 22
```

---

# 전체 예제

```js
const sumUntil = fnList.param("limit").pipe(
  let_("sum")(0),

  for_(
    let_("i")(0),
    ({ i, limit }) => i <= limit,
    set_("i")(({ i }) => i + 1)
  )(
    if_(({ i }) => i === 5)(
      continue_()
    ),

    set_("sum")(({ sum, i }) => sum + i),

    if_(({ sum }) => sum > 100)(
      break_()
    )
  ),

  return_(({ sum }) => sum)
);

sumUntil(10);
```

---

# 디버깅 예제

```js
const f = fnList.param("x").pipe(
  x => x + 1,
  tap_(x => console.log("after +1:", x)),
  x => x * 2
);

f(10);
// after +1: 11
// 22
```

실행 과정을 추적할 수도 있습니다.

```js
f.trace(10);
```

```js
[
  { index: 0, input: 10, output: 11 },
  { index: 1, input: 11, output: 11 },
  { index: 2, input: 11, output: 22 }
]
```

---

# API 요약

## 생성

```js
fnList.param("x").pipe(...)
fnList.param("x", "y").pipe(...)
fnList.block(...)
fnList.from(steps)
fnList.from(steps, { params: ["x"] })
```

## 실행

```js
f(10)
f.run(10)
f.runner(10).next()
```

## 리스트 조회

```js
f.size
f.params
f.at(index)
f.toArray()
f.inspect()
```

## 리스트 조작

```js
f.append(step)
f.prepend(step)
f.insert(index, step)
f.remove(index)
f.replace(index, step)
f.slice(start, end)
f.concat(other)
```

## 추적

```js
f.trace(...args)
```

## DSL

```js
_()

let_("x")(value)
const_("x")(value)
set_("x")(value)
set_("x")(({ x }) => x + 1)

if_(condition)(...)
  .elseIf_(condition)(...)
  .else_(...)

switch_(selector)
  .case_(value)(...)
  .default_(...)

for_(init, condition, update)(...)
while_(condition)(...)

break_()
continue_()

return_(valueFn)
throw_(error)

try_(...)
  .catch_("error")(...)
  .finally_(...)

call_(fn)
tap_(fn)
consoleLog_()
consoleLog_(fn)
```

---

# 중요한 규칙

변수 이름은 문자열로 전달합니다.

```js
let_("x")(10)
```

실행 중 계산해야 하는 값은 함수로 전달합니다.

```js
set_("x")(({ x }) => x + 1)
```

여러 변수를 사용할 때는 객체 구조분해를 사용합니다.

```js
({ x, y }) => x + y
```

부수 효과는 `tap_` 또는 `consoleLog_`로 처리합니다.

```js
tap_(({ x }) => console.log(x))
```

결과를 반환하고 실행을 끝내려면 `return_`을 사용합니다.

```js
return_(({ x }) => x)
```

기존 `fnList`와 block은 직접 수정하지 않습니다.

```js
const f2 = f.append(step);
```

---

# 설계 철학

`fnList`는 단순한 `pipe` 유틸이 아닙니다.

`fnList`는 함수를 다음처럼 다룰 수 있게 합니다.

```txt
함수처럼 실행한다.
리스트처럼 조회한다.
리스트처럼 조작한다.
block 단위로 조합한다.
실행 과정을 trace한다.
```

즉, `fnList`는 하나의 함수를 **실행 가능한 step 리스트**로 만들어주는 라이브러리입니다.