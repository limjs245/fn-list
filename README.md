# fn-list

A JavaScript library for managing functions as a list of executable steps.

`fn-list` lets you build executable functions from a list of small steps.  
Each step receives a context object, transforms it, and returns the next context or a control signal.

```js
import {
  fnList,
  let_,
  set_,
  return_
} from "fn-list";

const f = fnList.param("x").pipe(
  let_("y")(({ x }) => x + 1),
  set_("x")(({ x, y }) => x + y),
  return_(({ x }) => x)
);

f(10);     // 21
f.run(10); // 21
```

---

## Installation

```bash
npm install fn-list
```

If you want to use the GitHub repository directly:

```bash
git clone https://github.com/limjs245/fn-list.git
```

---

## Features

- Treat functions as a list of executable steps
- Run a function with `f(...)` or `f.run(...)`
- Inspect, trace, and step through execution
- Immutable list operations such as `append`, `prepend`, `insert`, `remove`, `replace`, `slice`, and `concat`
- DSL-style control flow:
  - `let_`
  - `const_`
  - `set_`
  - `if_`
  - `switch_`
  - `for_`
  - `while_`
  - `return_`
  - `throw_`
  - `try_`
  - `break_`
  - `continue_`
  - `block_`

---

## Basic Usage

```js
import {
  fnList,
  return_
} from "fn-list";

const add = fnList.param("x, y").pipe(
  return_(({ x, y }) => x + y)
);

add(10, 20);     // 30
add.run(10, 20); // 30
```

You can pass parameters in either form:

```js
fnList.param("x, y");
fnList.param("x", "y");
```

---

## Steps and Context

Each step is a function that receives a context object.

```js
const step = (ctx) => {
  ctx.x = ctx.x + 1;
  return ctx;
};
```

Most DSL helpers create steps for you:

```js
let_("y")(10);
set_("x")(({ x }) => x + 1);
return_(({ x }) => x);
```

---

## Variables

### let_

Declares mutable variables.

```js
const f = fnList.param("x").pipe(
  let_("y")(({ x }) => x * 2),
  return_(({ y }) => y)
);

f(5); // 10
```

Multiple variables are supported:

```js
let_("x", "y")(10, 20);
let_("x, y")(10, 20);
```

---

### const_

Declares constant variables.

```js
const f = fnList.param().pipe(
  const_("x")(10),
  return_(({ x }) => x)
);

f(); // 10
```

Trying to assign to a constant variable throws an error.

```js
const f = fnList.param().pipe(
  const_("x")(10),
  set_("x")(20)
);

f(); // Error
```

---

### set_

Assigns a new value to an existing variable.

```js
const f = fnList.param().pipe(
  let_("x")(1),
  set_("x")(({ x }) => x + 9),
  return_(({ x }) => x)
);

f(); // 10
```

`set_` requires the variable to already exist.

---

## return_

Returns a final value from the pipeline.

```js
const f = fnList.param("x").pipe(
  return_(({ x }) => x + 1)
);

f(10); // 11
```

You can also return a static value:

```js
return_("done");
```

---

## if_ / elseIf_ / else_

```js
const f = fnList.param("x").pipe(
  if_(({ x }) => x > 10)(
    return_("big")
  ).elseIf_(({ x }) => x > 5)(
    return_("middle")
  ).else_(
    return_("small")
  )
);

f(20); // "big"
f(7);  // "middle"
f(3);  // "small"
```

---

## switch_

`switch_` supports fallthrough behavior.

```js
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

f(1); // "AB"
f(2); // "B"
f(3); // "D"
```

Use `break_()` to stop fallthrough.

---

## for_

```js
const sum = fnList.param("n").pipe(
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

sum(5); // 15
```

`continue_()` and `break_()` can be used inside `for_`.

---

## while_

```js
const f = fnList.param("n").pipe(
  let_("i")(0),
  while_(({ i, n }) => i < n)(
    set_("i")(({ i }) => i + 1)
  ),
  return_(({ i }) => i)
);

f(5); // 5
```

---

## break_ and continue_

`break_()` and `continue_()` are intended for loops and switch blocks.

```js
break_();
continue_();
```

Using them outside a loop or switch may throw an error.

---

## throw_ and try_

```js
const f = fnList.param().pipe(
  try_(
    throw_("boom")
  ).catch_("error")(
    return_(({ error }) => error)
  )
);

f(); // "boom"
```

`finally_` is also supported:

```js
const f = fnList.param().pipe(
  let_("done")(false),
  try_(
    throw_("boom")
  ).catch_("error")(
    set_("done")(true),
    return_(({ error }) => error)
  ).finally_(
    // cleanup steps
  )
);
```

---

## call_

`call_` runs a custom step function and uses its return value.

```js
const f = fnList.param("x").pipe(
  call_((ctx) => {
    ctx.x = ctx.x + 1;
    return ctx;
  }),
  return_(({ x }) => x)
);

f(10); // 11
```

The function passed to `call_` must return a context object or a signal object.

---

## tap_

`tap_` runs a side effect and keeps the current context.

```js
const f = fnList.param("x").pipe(
  tap_(({ x }) => console.log(x)),
  return_(({ x }) => x)
);

f(10); // logs 10, returns 10
```

---

## consoleLog_

```js
const f = fnList.param("x").pipe(
  consoleLog_(({ x }) => x),
  return_(({ x }) => x)
);
```

---

## block_

`block_` groups multiple steps into a single step.

```js
const b = block_(
  let_("y")(({ x }) => x + 1),
  set_("x")(({ x, y }) => x + y)
);

const f = fnList.param("x").pipe(
  b,
  return_(({ x }) => x)
);

f(10); // 21
```

You can also use:

```js
fnList.block(...steps);
fnList.from([step1, step2]);
```

---

## List Operations

A pipeline can be treated like a list.

```js
const f = fnList.param("x").pipe(
  let_("y")(({ x }) => x + 1),
  return_(({ y }) => y)
);

f.size;       // 2
f.params;     // ["x"]
f.at(0);      // first step
f.toArray();  // step array
```

Immutable modification methods are supported:

```js
const f2 = f.append(step);
const f3 = f.prepend(step);
const f4 = f.insert(1, step);
const f5 = f.remove(0);
const f6 = f.replace(0, step);
const f7 = f.slice(0, 1);
const f8 = f.concat(other);
```

The original function is not changed.

```js
const f2 = f.append(step);
// f remains unchanged
```

---

## block_ List Operations

Blocks also support list-style operations.

```js
const b = block_(
  let_("x")(1),
  set_("x")(({ x }) => x + 1)
);

b.size;
b.at(0);
b.toArray();

const b2 = b.append(step);
const b3 = b.concat(otherBlock);
```

---

## trace

`trace` executes the pipeline and records each step.

```js
const f = fnList.param("x").pipe(
  let_("y")(({ x }) => x + 1),
  return_(({ y }) => y)
);

const result = f.trace(10);

console.log(result.result); // 11
console.log(result.steps);
```

Example trace result:

```js
{
  params: ["x"],
  args: [10],
  steps: [
    {
      index: 0,
      before: { x: 10 },
      after: { x: 10, y: 11 },
      signal: null
    },
    {
      index: 1,
      before: { x: 10, y: 11 },
      after: null,
      signal: {
        type: "return",
        value: 11
      }
    }
  ],
  result: 11
}
```

---

## runner

`runner` lets you execute a pipeline step by step.

```js
const f = fnList.param("x").pipe(
  let_("y")(({ x }) => x + 1),
  return_(({ y }) => y)
);

const r = f.runner(10);

r.next();
r.next();
```

Example:

```js
const first = r.next();

console.log(first.done);
console.log(first.before);
console.log(first.after);
```

You can also run the rest:

```js
const result = r.run();
```

---

## inspect

`inspect` returns static structure information without running the pipeline.

```js
const f = fnList.param("x").pipe(
  let_("y")(({ x }) => x + 1),
  return_(({ y }) => y)
);

console.log(f.inspect());
```

Example result:

```js
{
  type: "fnList",
  size: 2,
  params: ["x"],
  steps: [
    {
      index: 0,
      name: "step",
      kind: "function",
      meta: {
        type: "let",
        vars: ["y"]
      }
    },
    {
      index: 1,
      name: "step",
      kind: "function",
      meta: {
        type: "return"
      }
    }
  ]
}
```

Blocks also support `inspect()`.

```js
const b = block_(
  let_("x")(1)
);

b.inspect();
```

---

## Testing

```bash
npm test
```

The default test script runs:

```bash
node test/dsl.test.js
```

---

## Repository

GitHub: https://github.com/limjs245/fn-list.git

---

## License

MIT

---

# fn-list 한국어 문서

함수를 실행 가능한 단계별 리스트로 관리하기 위한 JavaScript 라이브러리입니다.

`fn-list`는 작은 step들을 리스트처럼 조합해서 하나의 실행 가능한 함수를 만들 수 있게 해줍니다.  
각 step은 context 객체를 받고, 다음 context 또는 제어 signal을 반환합니다.

```js
import {
  fnList,
  let_,
  set_,
  return_
} from "fn-list";

const f = fnList.param("x").pipe(
  let_("y")(({ x }) => x + 1),
  set_("x")(({ x, y }) => x + y),
  return_(({ x }) => x)
);

f(10);     // 21
f.run(10); // 21
```

---

## 설치

```bash
npm install fn-list
```

GitHub 저장소를 직접 사용할 수도 있습니다.

```bash
git clone https://github.com/limjs245/fn-list.git
```

---

## 주요 기능

- 함수를 실행 가능한 step 리스트로 관리
- `f(...)` 또는 `f.run(...)`으로 실행
- `trace`, `runner`, `inspect`를 통한 디버깅
- `append`, `prepend`, `insert`, `remove`, `replace`, `slice`, `concat` 지원
- DSL 스타일 제어 흐름 제공:
  - `let_`
  - `const_`
  - `set_`
  - `if_`
  - `switch_`
  - `for_`
  - `while_`
  - `return_`
  - `throw_`
  - `try_`
  - `break_`
  - `continue_`
  - `block_`

---

## 기본 사용법

```js
import {
  fnList,
  return_
} from "fn-list";

const add = fnList.param("x, y").pipe(
  return_(({ x, y }) => x + y)
);

add(10, 20);     // 30
add.run(10, 20); // 30
```

파라미터는 두 방식 모두 가능합니다.

```js
fnList.param("x, y");
fnList.param("x", "y");
```

---

## Step과 Context

각 step은 context 객체를 받습니다.

```js
const step = (ctx) => {
  ctx.x = ctx.x + 1;
  return ctx;
};
```

대부분은 DSL helper로 step을 만들 수 있습니다.

```js
let_("y")(10);
set_("x")(({ x }) => x + 1);
return_(({ x }) => x);
```

---

## 변수

### let_

변경 가능한 변수를 선언합니다.

```js
const f = fnList.param("x").pipe(
  let_("y")(({ x }) => x * 2),
  return_(({ y }) => y)
);

f(5); // 10
```

여러 변수 선언도 가능합니다.

```js
let_("x", "y")(10, 20);
let_("x, y")(10, 20);
```

---

### const_

상수 변수를 선언합니다.

```js
const f = fnList.param().pipe(
  const_("x")(10),
  return_(({ x }) => x)
);

f(); // 10
```

상수 변수에 다시 대입하면 에러가 발생합니다.

```js
const f = fnList.param().pipe(
  const_("x")(10),
  set_("x")(20)
);

f(); // Error
```

---

### set_

이미 선언된 변수에 값을 대입합니다.

```js
const f = fnList.param().pipe(
  let_("x")(1),
  set_("x")(({ x }) => x + 9),
  return_(({ x }) => x)
);

f(); // 10
```

`set_`은 이미 존재하는 변수에만 사용할 수 있습니다.

---

## return_

파이프라인의 최종 값을 반환합니다.

```js
const f = fnList.param("x").pipe(
  return_(({ x }) => x + 1)
);

f(10); // 11
```

고정값을 반환할 수도 있습니다.

```js
return_("done");
```

---

## if_ / elseIf_ / else_

```js
const f = fnList.param("x").pipe(
  if_(({ x }) => x > 10)(
    return_("big")
  ).elseIf_(({ x }) => x > 5)(
    return_("middle")
  ).else_(
    return_("small")
  )
);

f(20); // "big"
f(7);  // "middle"
f(3);  // "small"
```

---

## switch_

`switch_`는 fallthrough 동작을 지원합니다.

```js
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

f(1); // "AB"
f(2); // "B"
f(3); // "D"
```

fallthrough를 멈추려면 `break_()`를 사용합니다.

---

## for_

```js
const sum = fnList.param("n").pipe(
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

sum(5); // 15
```

`for_` 내부에서 `continue_()`와 `break_()`를 사용할 수 있습니다.

---

## while_

```js
const f = fnList.param("n").pipe(
  let_("i")(0),
  while_(({ i, n }) => i < n)(
    set_("i")(({ i }) => i + 1)
  ),
  return_(({ i }) => i)
);

f(5); // 5
```

---

## break_와 continue_

`break_()`와 `continue_()`는 loop 또는 switch 내부에서 사용합니다.

```js
break_();
continue_();
```

loop 또는 switch 밖에서 사용하면 에러가 발생할 수 있습니다.

---

## throw_와 try_

```js
const f = fnList.param().pipe(
  try_(
    throw_("boom")
  ).catch_("error")(
    return_(({ error }) => error)
  )
);

f(); // "boom"
```

`finally_`도 지원합니다.

```js
const f = fnList.param().pipe(
  let_("done")(false),
  try_(
    throw_("boom")
  ).catch_("error")(
    set_("done")(true),
    return_(({ error }) => error)
  ).finally_(
    // cleanup steps
  )
);
```

---

## call_

`call_`은 사용자 정의 step 함수를 실행하고 그 반환값을 다음 결과로 사용합니다.

```js
const f = fnList.param("x").pipe(
  call_((ctx) => {
    ctx.x = ctx.x + 1;
    return ctx;
  }),
  return_(({ x }) => x)
);

f(10); // 11
```

`call_`에 전달한 함수는 context 객체 또는 signal 객체를 반환해야 합니다.

---

## tap_

`tap_`은 부수 효과를 실행하고 현재 context를 그대로 유지합니다.

```js
const f = fnList.param("x").pipe(
  tap_(({ x }) => console.log(x)),
  return_(({ x }) => x)
);

f(10); // 10을 출력하고 10 반환
```

---

## consoleLog_

```js
const f = fnList.param("x").pipe(
  consoleLog_(({ x }) => x),
  return_(({ x }) => x)
);
```

---

## block_

`block_`은 여러 step을 하나의 step으로 묶습니다.

```js
const b = block_(
  let_("y")(({ x }) => x + 1),
  set_("x")(({ x, y }) => x + y)
);

const f = fnList.param("x").pipe(
  b,
  return_(({ x }) => x)
);

f(10); // 21
```

다음 방식도 사용할 수 있습니다.

```js
fnList.block(...steps);
fnList.from([step1, step2]);
```

---

## 리스트 조작

파이프라인은 리스트처럼 다룰 수 있습니다.

```js
const f = fnList.param("x").pipe(
  let_("y")(({ x }) => x + 1),
  return_(({ y }) => y)
);

f.size;       // 2
f.params;     // ["x"]
f.at(0);      // 첫 번째 step
f.toArray();  // step 배열
```

불변 조작 메서드를 지원합니다.

```js
const f2 = f.append(step);
const f3 = f.prepend(step);
const f4 = f.insert(1, step);
const f5 = f.remove(0);
const f6 = f.replace(0, step);
const f7 = f.slice(0, 1);
const f8 = f.concat(other);
```

원래 함수는 변경되지 않습니다.

```js
const f2 = f.append(step);
// f는 그대로 유지됩니다.
```

---

## block_ 리스트 조작

block도 리스트처럼 조작할 수 있습니다.

```js
const b = block_(
  let_("x")(1),
  set_("x")(({ x }) => x + 1)
);

b.size;
b.at(0);
b.toArray();

const b2 = b.append(step);
const b3 = b.concat(otherBlock);
```

---

## trace

`trace`는 파이프라인을 실행하면서 각 step의 실행 전후 context를 기록합니다.

```js
const f = fnList.param("x").pipe(
  let_("y")(({ x }) => x + 1),
  return_(({ y }) => y)
);

const result = f.trace(10);

console.log(result.result); // 11
console.log(result.steps);
```

예시 결과:

```js
{
  params: ["x"],
  args: [10],
  steps: [
    {
      index: 0,
      before: { x: 10 },
      after: { x: 10, y: 11 },
      signal: null
    },
    {
      index: 1,
      before: { x: 10, y: 11 },
      after: null,
      signal: {
        type: "return",
        value: 11
      }
    }
  ],
  result: 11
}
```

---

## runner

`runner`는 파이프라인을 한 step씩 실행할 수 있게 해줍니다.

```js
const f = fnList.param("x").pipe(
  let_("y")(({ x }) => x + 1),
  return_(({ y }) => y)
);

const r = f.runner(10);

r.next();
r.next();
```

예시:

```js
const first = r.next();

console.log(first.done);
console.log(first.before);
console.log(first.after);
```

나머지를 끝까지 실행할 수도 있습니다.

```js
const result = r.run();
```

---

## inspect

`inspect`는 파이프라인을 실행하지 않고 정적 구조 정보를 반환합니다.

```js
const f = fnList.param("x").pipe(
  let_("y")(({ x }) => x + 1),
  return_(({ y }) => y)
);

console.log(f.inspect());
```

예시 결과:

```js
{
  type: "fnList",
  size: 2,
  params: ["x"],
  steps: [
    {
      index: 0,
      name: "step",
      kind: "function",
      meta: {
        type: "let",
        vars: ["y"]
      }
    },
    {
      index: 1,
      name: "step",
      kind: "function",
      meta: {
        type: "return"
      }
    }
  ]
}
```

block도 `inspect()`를 지원합니다.

```js
const b = block_(
  let_("x")(1)
);

b.inspect();
```

---

## 테스트

```bash
npm test
```

기본 테스트 스크립트는 다음 명령을 실행합니다.

```bash
node test/dsl.test.js
```

---

## 저장소

GitHub: https://github.com/limjs245/fn-list.git

---

## 라이선스

MIT