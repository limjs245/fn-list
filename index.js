import { fnList } from "./lib/core.js";

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
  call_,
  tap_,
  consoleLog_,
  block_
} from "./lib/dsl.js";

Object.defineProperty(fnList, "block", {
  value: block_,
  writable: false,
  configurable: false,
  enumerable: true
});
Object.defineProperty(fnList, "from", {
  value: (steps) => {
    if (!Array.isArray(steps)) {
      throw new Error("fnList.from() argument must be an array.");
    }
    for (const step of steps) {
      if (typeof step !== "function") {
        throw new Error("Step must be a function.");
      }
    }

    return block_(...steps);
  },
  writable: false,
  configurable: false,
  enumerable: true
});

export {
  fnList,
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
  call_,
  tap_,
  consoleLog_,
  block_
};