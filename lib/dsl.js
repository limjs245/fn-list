import { parameters, runSteps, createSignal } from "./utils.js";

export const _ = () => {
    const step = (ctx) => {
        return ctx;
    }

    Object.defineProperty(step, "__k__meta__", {
        value: {
            type: "empty"
        },
        enumerable: false,
        writable: false,
        configurable: false
    });

    return step;
};
export const let_ = (...varNames) => (...values) => {
    const varList = parameters(varNames);
    
    if (varList.length !== values.length) {
        throw new Error("Expected " + varList.length + " values, but got " + values.length + ".");
    }

    const step = (ctx) => {
        varList.forEach((name) => {
            if (Object.hasOwn(ctx, name)) {
                throw new Error("Variable already declared: \"" + name + "\".");
            }
        });

        let tempValues = [];

        varList.forEach((name, index) => {
            let value = values[index];
            
            if (typeof value === 'function') {
                value = value(ctx);
            }

            tempValues.push(value);
        });

        varList.forEach((name, index) => {
            ctx[name] = tempValues[index];
        });

        return ctx;
    }

    Object.defineProperty(step, "__k__meta__", {
    value: {
        type: "let",
        vars: varList
    },
    enumerable: false,
    writable: false,
    configurable: false
    });

    return step;
};
export const const_ = (...varNames) => (...values) => {
    const varList = parameters(varNames);
    
    if (varList.length !== values.length) {
        throw new Error("Expected " + varList.length + " values, but got " + values.length + ".");
    }

    const step = (ctx) => {
        varList.forEach((name) => {
            if (Object.hasOwn(ctx, name)) {
                throw new Error("Variable already declared: \"" + name + "\".");
            }
        });

        if (!Object.hasOwn(ctx, "__k__constVars__")) {
            Object.defineProperty(ctx, '__k__constVars__', {
                value: new Set(),
                enumerable: false,
                configurable: false,
                writable: false,
            });
        }

        let tempValues = [];

        varList.forEach((name, index) => {
            let value = values[index];
            
            if (typeof value === 'function') {
                value = value(ctx);
            }

            tempValues.push(value);
        });

        varList.forEach((name, index) => {
            ctx[name] = tempValues[index];
            ctx["__k__constVars__"].add(name);
        });

        return ctx;
    }

    Object.defineProperty(step, "__k__meta__", {
        value: {
            type: "const",
            vars: varList
        },
        enumerable: false,
        writable: false,
        configurable: false
    });

    return step
};
export const set_ = (...varNames) => (...values) => {
    const varList = parameters(varNames);
    
    if (varList.length !== values.length) {
        throw new Error("Expected " + varList.length + " values, but got " + values.length + ".");
    }

    const step = (ctx) => {
        if (Object.hasOwn(ctx, "__k__constVars__")) {
            varList.forEach((name) => {
                if (ctx["__k__constVars__"].has(name)) {
                    throw new Error("Cannot assign to constant variable: \"" + name + "\".");
                }
            });
        }

        varList.forEach((name) => {
            if (!Object.hasOwn(ctx, name)) {
                throw new Error("Variable is not declared: \"" + name + "\".");
            }
        });

        let tempValues = [];

        varList.forEach((name, index) => {
            let value = values[index];
            
            if (typeof value === 'function') {
                value = value(ctx);
            }

            tempValues.push(value);
        });

        varList.forEach((name, index) => {
            ctx[name] = tempValues[index];
        });

        return ctx;
    }

    Object.defineProperty(step, "__k__meta__", {
        value: {
            type: "set",
            vars: varList
        },
        enumerable: false,
        writable: false,
        configurable: false
    });

    return step;
}
export const return_ = (rt) => {
    const step = (ctx) => {
        let returnCtx = Object.create(null);
        createSignal(returnCtx, "__k__signal__", "return");
        
        if (typeof rt === 'function') {
            createSignal(returnCtx, "__k__value__", rt(ctx));
        } else {
            createSignal(returnCtx, "__k__value__", rt);
        }

        return returnCtx;
    }

    Object.defineProperty(step, "__k__meta__", {
        value: {
            type: "return"
        },
        enumerable: false,
        writable: false,
        configurable: false
    });

    return step;
};
export const if_ = (con) => (...steps) => {
    if (typeof con !== 'function') {
        throw new Error("if_ condition must be a function.");
    }
    for (let fun of steps) {
        if (typeof fun !== 'function') {
            throw new Error("Step must be a function.");
        }
    }

    const branches = [{con: con, steps: steps}];
    const step = (ctx) => {
        for (const branch of branches) {
            if (branch.con === null || branch.con(ctx)) {
                return runSteps(ctx, branch.steps);
            }
        }

        return ctx;
    };
    let hasElse = false;
    
    step.elseIf_ = (con) => (...steps) => {
        if (hasElse) {
            throw new Error("elseIf_ cannot be used after else_.");
        }
        if (typeof con !== 'function') {
            throw new Error("elseIf_ condition must be a function.");
        }
        for (let fun of steps) {
            if (typeof fun !== 'function') {
                throw new Error("Step must be a function.");
            }
        }

        branches.push({con: con, steps: steps});
        return step;
    };
    step.else_ = (...steps) => {
        if (hasElse) {
            throw new Error("else_ can only be used once.");
        }
        for (let fun of steps) {
            if (typeof fun !== 'function') {
                throw new Error("Step must be a function.");
            }
        }

        hasElse = true;
        branches.push({con: null, steps: steps});
        return step;
    };

    Object.defineProperty(step, "__k__meta__", {
        value: {
            type: "if",
            branches: branches
        },
        enumerable: false,
        writable: false,
        configurable: false
    });

    return step;
};
export const switch_ = (selector) => {
    if (typeof selector !== 'function') {
        throw new Error("switch_ selector must be a function.");
    }

    const branches = [];
    let index = 0;
    const step = (ctx) => {
        let startIndex = -1;
        let defaultIndex = -1;
        const selectorValue = selector(ctx);

        for (const branch of branches) {
            if (branch.type === "case" && branch.value === selectorValue) {
                startIndex = branch.index;
            }
        }
        for (const branch of branches) {
            if (branch.type === "default") {
                defaultIndex = branch.index;
            }
        }
        if (startIndex === -1) {
            if (defaultIndex === -1) {
                return ctx;
            }

            startIndex = defaultIndex;
        }

        for (let i = startIndex; i < branches.length; i++) {
            const result = runSteps(ctx, branches[i].steps);
            
            if (Object.hasOwn(result, "__k__signal__")) {
                if (result.__k__signal__ === "break") {
                    return result.__k__ctx__;
                }

                return result;
            }
            
            ctx = result;
        }

        return ctx;
    };
    let hasDefault = false;

    step.case_ = (value) => (...steps) => {
        for (let fun of steps) {
            if (typeof fun !== 'function') {
                throw new Error("Step must be a function.");
            }
        }
        for (let branch of branches) {
            if (branch.type === "case") {
                if (value === branch.value) {
                    throw new Error("Duplicate case value: " + value + ".");
                }
            }
        }

        branches.push({type: "case", index: index, value: value, steps: steps});
        index++;
        return step;
    };
    step.default_ = (...steps) => {
        if (hasDefault) {
            throw new Error("default_ can only be used once.");
        }
        for (let fun of steps) {
            if (typeof fun !== 'function') {
                throw new Error("Step must be a function.");
            }
        }

        hasDefault = true;
        branches.push({type: "default", index: index, steps: steps});
        index++;
        return step;
    };

    Object.defineProperty(step, "__k__meta__", {
        value: {
            type: "switch",
            cases: branches
        },
        enumerable: false,
        writable: false,
        configurable: false
    });

    return step;
}
export const for_ = (init, con, update) => (...steps) => {
    if (typeof init !== 'function') {
        throw new Error("for_ init must be a function.");
    }
    if (typeof con !== 'function') {
        throw new Error("for_ condition must be a function.");
    }
    if (typeof update !== 'function') {
        throw new Error("for_ update must be a function.");
    }
    for (let fun of steps) {
        if (typeof fun !== 'function') {
            throw new Error("Step must be a function.");
        }
    }

    const step = (ctx) => {
        ctx = init(ctx);

        if (ctx == null) {
            throw new Error("for_ init must return a context object.");
        }
        if (typeof ctx !== 'object') {
            throw new Error("for_ init must return a context object.");
        }
        if (Object.hasOwn(ctx, "__k__signal__")) {
            throw new Error("for_ init must return a context object.");
        }

        while (true) {
            if (!con(ctx)) {
                break;
            }

            const result = runSteps(ctx, steps);

            if (Object.hasOwn(result, "__k__signal__")) {
                if (result.__k__signal__ === "break") {
                    return result.__k__ctx__;
                } else if (result.__k__signal__ === "continue") {
                    ctx = result.__k__ctx__;
                    ctx = update(ctx);

                    if (ctx == null) {
                        throw new Error("for_ update must return a context object.");
                    }
                    if (typeof ctx !== 'object') {
                        throw new Error("for_ update must return a context object.");
                    }
                    if (Object.hasOwn(ctx, "__k__signal__")) {
                        throw new Error("for_ update must return a context object.");
                    }

                    continue;
                } else {
                    return result;
                };
            }

            ctx = result;
            ctx = update(ctx);

            if (ctx == null) {
                throw new Error("for_ update must return a context object.");
            }
            if (typeof ctx !== 'object') {
                throw new Error("for_ update must return a context object.");
            }
            if (Object.hasOwn(ctx, "__k__signal__")) {
                throw new Error("for_ update must return a context object.");
            }
        }

        return ctx;
    }

    Object.defineProperty(step, "__k__meta__", {
        value: {
            type: "for"
        },
        enumerable: false,
        writable: false,
        configurable: false
    });

    return step;
}
export const while_ = (con) => (...steps) => {
    if (typeof con !== 'function') {
        throw new Error("while_ condition must be a function.");
    }
    for (let fun of steps) {
        if (typeof fun !== 'function') {
            throw new Error("Step must be a function.");
        }
    }

    const step = (ctx) => {
        while (true) {
            if (!con(ctx)) {
                break;
            }

            const result = runSteps(ctx, steps);

            if (Object.hasOwn(result, "__k__signal__")) {
                if (result.__k__signal__ === "break") {
                    return result.__k__ctx__;
                } else if (result.__k__signal__ === "continue") {
                    ctx = result.__k__ctx__;
                    continue;
                } else {
                    return result;
                };
            }

            ctx = result;
        }

        return ctx;
    }

    Object.defineProperty(step, "__k__meta__", {
        value: {
            type: "while"
        },
        enumerable: false,
        writable: false,
        configurable: false
    });

    return step;
}
export const break_ = () => {
    const step = (ctx) => {
        let breakCtx = Object.create(null);
        createSignal(breakCtx, "__k__signal__", "break");
        createSignal(breakCtx, "__k__ctx__", ctx);
        return breakCtx;
    }

    Object.defineProperty(step, "__k__meta__", {
        value: {
            type: "break"
        },
        enumerable: false,
        writable: false,
        configurable: false
    });

    return step;
}
export const continue_ = () => {
    const step = (ctx) => {
        let continueCtx = Object.create(null);
        createSignal(continueCtx, "__k__signal__", "continue");
        createSignal(continueCtx, "__k__ctx__", ctx);
        return continueCtx;
    }

    Object.defineProperty(step, "__k__meta__", {
        value: {
            type: "continue"
        },
        enumerable: false,
        writable: false,
        configurable: false
    });

    return step;
}
export const throw_ = (value) => {
    const step = (ctx) => {
        let throwCtx = Object.create(null);
        createSignal(throwCtx, "__k__signal__", "throw");

        if (typeof value === 'function') {
            createSignal(throwCtx, "__k__value__", value(ctx));
        } else {
            createSignal(throwCtx, "__k__value__", value);
        }
        
        createSignal(throwCtx, "__k__ctx__", ctx);
        return throwCtx;
    }

    Object.defineProperty(step, "__k__meta__", {
        value: {
            type: "throw"
        },
        enumerable: false,
        writable: false,
        configurable: false
    });

    return step;
};
export const try_ = (...steps) => {
    for (let fun of steps) {
        if (typeof fun !== 'function') {
            throw new Error("Step must be a function.");
        }
    }
    
    let hasFinally = false;
    let hasCatch = false;
    let catchBranch;
    let finallyBranch;
    const meta = {
        type: "try",
        hasCatch: false,
        hasFinally: false
    };
    const step = (ctx) => {
        let result;
        let caughtError;
        let mainResult;
        let finallyResult;
        let hasCaughtError = false;
        let pendingError;
        let hasPendingError = false;

        if (!(hasCatch || hasFinally)) {
            throw new Error("try_ requires catch_ or finally_.");
        }
        try {
            result = runSteps(ctx, steps);
            
            if (Object.hasOwn(result, "__k__signal__")) {
                if (result.__k__signal__ === "throw") {
                    caughtError = result.__k__value__;
                    hasCaughtError = true;
                } else {
                    mainResult = result;
                }
            } else {
                ctx = result;
                mainResult = result;
            }
        } catch (error) {
            caughtError = error;
            hasCaughtError = true;
        }
        if (hasCaughtError) {
            if (hasCatch) {
                const errorName = catchBranch.errorName;

                if (Object.hasOwn(ctx, errorName)) {
                    pendingError = new Error("Variable already declared: \"" + errorName + "\".");
                    hasPendingError = true
                } else {
                    ctx[errorName] = caughtError;
                    result = runSteps(ctx, catchBranch.steps);    
                    
                    if (Object.hasOwn(result, "__k__signal__")) {
                        mainResult = result;
                    } else {
                        ctx = result;
                        mainResult = result;
                    }
                }
            } else {
                pendingError = caughtError;
                hasPendingError = true;
            }
        }
        if (hasFinally) {
            finallyResult = runSteps(ctx, finallyBranch);

            if (Object.hasOwn(finallyResult, "__k__signal__")) {
                return finallyResult;
            }

            ctx = finallyResult;
        }
        if (hasPendingError) {
            throw pendingError;
        }
        if (mainResult != null) {
            if (Object.hasOwn(mainResult, "__k__signal__")) {
                return mainResult;
            }
        }

        return ctx;
    };
    
    step.catch_ = (errorName) => (...steps) => {
        if (typeof errorName !== 'string') {
            throw new Error("catch_ error name must be a string.");
        }

        const errorNames = parameters([errorName]);
        
        if (errorNames.length !== 1) {
            throw new Error("catch_ must receive exactly one error name.");
        }

        const realErrorName = errorNames[0];

        if (hasFinally) {
            throw new Error("catch_ cannot be used after finally_.");
        }
        if (hasCatch) {
            throw new Error("catch_ can only be used once.");
        }
        for (let fun of steps) {
            if (typeof fun !== 'function') {
                throw new Error("Step must be a function.");
            }
        }

        hasCatch = true;
        meta.hasCatch = true;
        catchBranch = {errorName: realErrorName, steps: steps};
        return step;
    };
    step.finally_ = (...steps) => {
        if (hasFinally) {
            throw new Error("finally_ can only be used once.");
        }
        for (let fun of steps) {
            if (typeof fun !== 'function') {
                throw new Error("Step must be a function.");
            }
        }

        hasFinally = true;
        meta.hasFinally = true;
        finallyBranch = steps;
        return step;
    };

    Object.defineProperty(step, "__k__meta__", {
        value: meta,
        enumerable: false,
        writable: false,
        configurable: false
    });

    return step;
};
export const call_ = (fun) => {
    if (typeof fun !== 'function') {
        throw new Error("call_ argument must be a function.");
    }

    const step = (ctx) => {
        return fun(ctx);
    }

    Object.defineProperty(step, "__k__meta__", {
        value: {
            type: "call"
        },
        enumerable: false,
        writable: false,
        configurable: false
    });

    return step;
};
export const tap_ = (fun) => {
    if (typeof fun !== 'function') {
        throw new Error("tap_ argument must be a function.");
    }

    const step = (ctx) => {
        fun(ctx);
        return ctx;
    }

    Object.defineProperty(step, "__k__meta__", {
        value: {
            type: "tap"
        },
        enumerable: false,
        writable: false,
        configurable: false
    });

    return step;
};
export const consoleLog_ = (value) => {
    const step = (ctx) => {
        if (typeof value === 'function') {
            console.log(value(ctx));
        } else {
            console.log(value);
        }

        return ctx;
    }

    Object.defineProperty(step, "__k__meta__", {
        value: {
            type: "consoleLog"
        },
        enumerable: false,
        writable: false,
        configurable: false
    });

    return step;
}
export const block_ = (...steps) => {
    for (let fun of steps) {
        if (typeof fun !== 'function') {
            throw new Error("Step must be a function.");
        }
    }

    const block = (ctx) => {
        return runSteps(ctx, steps);
    };

    Object.defineProperty(block, "size", {
        value: steps.length,
        writable: false,
        configurable: false,
        enumerable: true
    });
    const at = (index) => {
        if (block.size === 0) {
            throw new Error("Step index out of range: no steps available.");
        }
        if (typeof index !== 'number' || !Number.isInteger(index)) {
            throw new Error("Step index must be a non-negative integer.");
        }
        if (index > block.size - 1 || index < 0) {
            throw new Error("Step index out of range: expected 0 to " + (block.size - 1) + ", but got " + index + ".");
        }

        return steps[index];
    };
    const toArray = () => [...steps];
    const append = (step) => {
        const newFuns = [...steps];

        if (typeof step !== 'function') {
            throw new Error("Step must be a function.");
        }

        newFuns.push(step);
        return block_(...newFuns);
    };
    const prepend = (step) => {
        const newFuns = [...steps];

        if (typeof step !== 'function') {
            throw new Error("Step must be a function.");
        }

        newFuns.unshift(step);
        return block_(...newFuns);
    };
    const insert = (index, step) => {
        const newFuns = [...steps];

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
        return block_(...newFuns);
    };
    const remove = (index) => {
        const newFuns = [...steps];

        if (block.size === 0) {
            throw new Error("Step index out of range: no steps available.");
        }
        if (typeof index !== 'number' || !Number.isInteger(index)) {
            throw new Error("Step index must be a non-negative integer.");
        }
        if (index > newFuns.length - 1 || index < 0) {
            throw new Error("Step index out of range: expected 0 to " + (newFuns.length - 1) + ", but got " + index + ".");
        }

        newFuns.splice(index, 1);
        return block_(...newFuns);
    };
    const replace = (index, step) => {
        const newFuns = [...steps];

        if (block.size === 0) {
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
        return block_(...newFuns);
    };
    const slice = (start = 0, end = steps.length) => {
        const newFuns = [...steps]
        
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
        return block_(...sliceFuns);
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

        const newFuns = [...steps].concat(otherArray);
        return block_(...newFuns);
    };
    const inspect = () => {
        return {
            type: "block",
            size: steps.length,
            steps: steps.map((fun, index) => ({
                index,
                name: fun.name || "anonymous",
                kind: typeof fun,
                meta: fun.__k__meta__ ? { ...fun.__k__meta__ } : null
            }))
        };
    };
    Object.defineProperty(block, "at", {
        value: at,
        writable: false,
        configurable: false,
        enumerable: true
    });
    Object.defineProperty(block, "toArray", {
        value: toArray,
        writable: false,
        configurable: false,
        enumerable: true
    });
    Object.defineProperty(block, "append", {
        value: append,
        writable: false,
        configurable: false,
        enumerable: true
    });
    Object.defineProperty(block, "prepend", {
        value: prepend,
        writable: false,
        configurable: false,
        enumerable: true
    });
    Object.defineProperty(block, "insert", {
        value: insert,
        writable: false,
        configurable: false,
        enumerable: true
    });
    Object.defineProperty(block, "remove", {
        value: remove,
        writable: false,
        configurable: false,
        enumerable: true
    });
    Object.defineProperty(block, "replace", {
        value: replace,
        writable: false,
        configurable: false,
        enumerable: true
    });
    Object.defineProperty(block, "slice", {
        value: slice,
        writable: false,
        configurable: false,
        enumerable: true
    });
    Object.defineProperty(block, "concat", {
        value: concat,
        writable: false,
        configurable: false,
        enumerable: true
    });
    Object.defineProperty(block, "inspect", {
        value: inspect,
        writable: false,
        configurable: false,
        enumerable: true
    });

    Object.defineProperty(block, "__k__meta__", {
        value: {
            type: "block",
            size: block.size
        },
        enumerable: false,
        writable: false,
        configurable: false
    });

    return block;
}