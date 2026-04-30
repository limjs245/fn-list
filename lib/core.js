import { parameters, fnListTrace, runSteps } from "./utils.js";
import { fnListRunner } from "./runner.js";

export const fnList = {
    /**
     * @param {string[]} params
     */
    param: (...params) => {
        for (let p of params) {
            if (typeof p !== 'string') {
                throw new Error("Parameter name must be a string.");
            }
        }

        const paramsList = parameters(params);
        
        return {
            /**
             * @param {Function[]} funs
             */
            pipe: (...funs) => {
                for (let fun of funs) {
                    if (typeof fun !== 'function') {
                        throw new Error("Step must be a function.");
                    }
                }

                const run = (...args) => {
                    return fnListRun(paramsList, args, funs);
                };
                const f = (...args) => {
                    return run(...args);
                };

                Object.defineProperty(f, "run", {
                    value: run,
                    writable: false,
                    configurable: false,
                    enumerable: true
                });
                Object.defineProperty(f, "size", {
                    value: funs.length,
                    writable: false,
                    configurable: false,
                    enumerable: true
                });
                Object.defineProperty(f, "params", {
                    value: Object.freeze([...paramsList]),
                    writable: false,
                    configurable: false,
                    enumerable: true
                });
                const at = (index) => {
                    if (f.size === 0) {
                        throw new Error("Step index out of range: no steps available.");
                    }
                    if (typeof index !== 'number' || !Number.isInteger(index)) {
                        throw new Error("Step index must be a non-negative integer.");
                    }
                    if (index > f.size - 1 || index < 0) {
                        throw new Error("Step index out of range: expected 0 to " + (f.size - 1) + ", but got " + index + ".");
                    }

                    return funs[index];
                };
                const toArray = () => [...funs];
                const append = (step) => {
                    const newFuns = [...funs];

                    if (typeof step !== 'function') {
                        throw new Error("Step must be a function.");
                    }

                    newFuns.push(step);
                    return fnList.param(...paramsList).pipe(...newFuns);
                };
                const prepend = (step) => {
                    const newFuns = [...funs];

                    if (typeof step !== 'function') {
                        throw new Error("Step must be a function.");
                    }

                    newFuns.unshift(step);
                    return fnList.param(...paramsList).pipe(...newFuns);
                };
                const insert = (index, step) => {
                    const newFuns = [...funs];

                    if (typeof index !== 'number' || !Number.isInteger(index)) {
                        throw new Error("Insert index must be a non-negative integer.");
                    }
                    if (index > newFuns.length || index < 0) {
                        throw new Error("Insert index out of range: expected 0 to " + newFuns.length + ", but got " + index + ".");
                    }
                    if (typeof step !== 'function') {
                        throw new Error("Step must be a function.");
                    }

                    newFuns.splice(index, 0, step);
                    return fnList.param(...paramsList).pipe(...newFuns);
                };
                const remove = (index) => {
                    const newFuns = [...funs];

                    if (f.size === 0) {
                        throw new Error("Step index out of range: no steps available.");
                    }
                    if (typeof index !== 'number' || !Number.isInteger(index)) {
                        throw new Error("Step index must be a non-negative integer.");
                    }
                    if (index > newFuns.length - 1 || index < 0) {
                        throw new Error("Step index out of range: expected 0 to " + (newFuns.length - 1) + ", but got " + index + ".");
                    }

                    newFuns.splice(index, 1);
                    return fnList.param(...paramsList).pipe(...newFuns);
                };
                const replace = (index, step) => {
                    const newFuns = [...funs];

                    if (f.size === 0) {
                        throw new Error("Step index out of range: no steps available.");
                    }
                    if (typeof index !== 'number' || !Number.isInteger(index)) {
                        throw new Error("Step index must be a non-negative integer.");
                    }
                    if (index > newFuns.length - 1 || index < 0) {
                        throw new Error("Step index out of range: expected 0 to " + (newFuns.length - 1) + ", but got " + index + ".");
                    }
                    if (typeof step !== 'function') {
                        throw new Error("Step must be a function.");
                    }

                    newFuns.splice(index, 1, step);
                    return fnList.param(...paramsList).pipe(...newFuns);
                };
                const slice = (start = 0, end = funs.length) => {
                    const newFuns = [...funs]
                    
                    if (typeof start !== 'number' || !Number.isInteger(start)) {
                        throw new Error("Slice start index must be a non-negative integer.");
                    }
                    if (typeof end !== 'number' || !Number.isInteger(end)) {
                        throw new Error("Slice end index must be a non-negative integer.");
                    }
                    if (start > newFuns.length || start < 0) {
                        throw new Error("Slice start index out of range: expected 0 to " + newFuns.length + ", but got " + start + ".");
                    }
                    if (end > newFuns.length || end < 0) {
                        throw new Error("Slice end index out of range: expected 0 to " + newFuns.length + ", but got " + end + ".");
                    }
                    if (start > end) {
                        throw new Error("Slice start index must be less than or equal to end index.");
                    }

                    const sliceFuns = newFuns.slice(start, end);
                    return fnList.param(...paramsList).pipe(...sliceFuns);
                };
                const concat = (other) => {
                    if (other == null) {
                        throw new Error("Concat target must be a fnList or block-like object with toArray().");
                    }

                    if (typeof other.toArray !== 'function') {
                        throw new Error("Concat target must be a fnList or block-like object with toArray().");
                    }

                    const otherArray = other.toArray();

                    if (!Array.isArray(otherArray)) {
                        throw new Error("Concat target toArray() must return an array.");
                    }

                    if (!otherArray.every(item => typeof item === 'function')) {
                        throw new Error("Concat target contains a non-function step.");
                    }

                    const newFuns = [...funs].concat(otherArray);
                    return fnList.param(...paramsList).pipe(...newFuns);
                };
                const trace = (...args) => {
                    return fnListTrace(paramsList, args, funs);
                };
                const runner = (...args) => {
                    return fnListRunner(paramsList, args, funs);
                }
                const inspect = () => {
                    return {
                        type: "fnList",
                        size: funs.length,
                        params: [...paramsList],
                        steps: funs.map((fun, index) => {
                            return {
                                index,
                                name: fun.name || "anonymous",
                                kind: typeof fun,
                                meta: fun.__k__meta__ ? { ...fun.__k__meta__ } : null
                            };
                        })
                    };
                };

                Object.defineProperty(f, "at", {
                    value: at,
                    writable: false,
                    configurable: false,
                    enumerable: true
                });
                Object.defineProperty(f, "toArray", {
                    value: toArray,
                    writable: false,
                    configurable: false,
                    enumerable: true
                });
                Object.defineProperty(f, "append", {
                    value: append,
                    writable: false,
                    configurable: false,
                    enumerable: true
                });
                Object.defineProperty(f, "prepend", {
                    value: prepend,
                    writable: false,
                    configurable: false,
                    enumerable: true
                });
                Object.defineProperty(f, "insert", {
                    value: insert,
                    writable: false,
                    configurable: false,
                    enumerable: true
                });
                Object.defineProperty(f, "remove", {
                    value: remove,
                    writable: false,
                    configurable: false,
                    enumerable: true
                });
                Object.defineProperty(f, "replace", {
                    value: replace,
                    writable: false,
                    configurable: false,
                    enumerable: true
                });
                Object.defineProperty(f, "slice", {
                    value: slice,
                    writable: false,
                    configurable: false,
                    enumerable: true
                });
                Object.defineProperty(f, "concat", {
                    value: concat,
                    writable: false,
                    configurable: false,
                    enumerable: true
                });
                Object.defineProperty(f, "trace", {
                    value: trace,
                    writable: false,
                    configurable: false,
                    enumerable: true
                });
                Object.defineProperty(f, "runner", {
                    value: runner,
                    writable: false,
                    configurable: false,
                    enumerable: true
                });
                Object.defineProperty(f, "inspect", {
                    value: inspect,
                    writable: false,
                    configurable: false,
                    enumerable: true
                });
                
                return f;
            }
        }
    }
}

/**
 * 
 * @param {string[]} paramsList 
 * @param {*[]} args 
 * @param {Function[]} funs 
 */
function fnListRun(paramsList, args, funs) {
    if (paramsList.length !== args.length) {
        throw new Error("Expected " + paramsList.length + " arguments, but got " + args.length + ".");
    }

    let ctx = Object.create(null);

    paramsList.forEach((name, index) => {
        ctx[name] = args[index];
    });

    const result = runSteps(ctx, funs);

    if (Object.hasOwn(result, "__k__signal__")) {
        if (result.__k__signal__ === "return") {
            if (!Object.hasOwn(result, "__k__value__")) {
                throw new Error("Return signal must have a value.");
            }
            return result.__k__value__;
        } else if (result.__k__signal__ === "break") {
            throw new Error("Unexpected signal outside loop: \"break\".");
        } else if (result.__k__signal__ === "continue") {
            throw new Error("Unexpected signal outside loop: \"continue\".");
        } else if (result.__k__signal__ === "throw") {
            if (!Object.hasOwn(result, "__k__value__")) {
                throw new Error("Throw signal must have a value.");
            }
            throw result.__k__value__;
        } else {
            throw new Error("Unknown signal: \"" + result.__k__signal__ + "\".");
        }
    }

    return result;
}