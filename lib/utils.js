const regex = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/;
const keyword = [
    "await",
    "break",
    "case",
    "catch",
    "class",
    "const",
    "continue",
    "debugger",
    "default",
    "delete",
    "do",
    "else",
    "enum",
    "export",
    "extends",
    "false",
    "finally",
    "for",
    "function",
    "if",
    "import",
    "in",
    "instanceof",
    "new",
    "null",
    "return",
    "super",
    "switch",
    "this",
    "throw",
    "true",
    "try",
    "typeof",
    "var",
    "void",
    "while",
    "with",
    "yield",
    "let",
    "static",
    "implements",
    "interface",
    "package",
    "private",
    "protected",
    "public"
];
const keyword2 = [
    "undefined",
    "NaN",
    "Infinity",
    "eval",
    "arguments",

    "Object",
    "Array",
    "Number",
    "String",
    "Boolean",
    "Function",
    "Symbol",
    "Error",
    "Math",
    "JSON",
    "Promise",
    "Reflect",
    "Proxy",
    "Intl",

    "window",
    "document",
    "location",
    "history",
    "navigator",
    "screen",
    "console",
    "process",
    "global",
    "globalThis",
    "module",
    "exports",

    "__proto__",
    "prototype",
    "constructor",
];
const keyword3 = [
    "__k__signal__",
    "__k__value__",
    "__k__loop__",
    "__k__constVars__",
    "__k__ctx__"
];

export function parameters(params) {
    const tempParams0 = [];

    for (let p of params) {
        if (typeof p !== 'string') {
            throw new Error("Name must be a string.");
        }

        const trimP = p.trim();

        if (trimP === "") {
            throw new Error("Parameter name cannot be empty.");
        }

        const tempParams1 = trimP.split(",").map(para => para.trim());

        for (let p1 of tempParams1) {
            if (p1 === "") {
                throw new Error("Parameter name cannot be empty.");
            }
        }

        if (tempParams1.length > 1) {
            tempParams0.push(...tempParams1);
        } else {
            tempParams0.push(trimP);
        }
    }

    for (let p of tempParams0) {
        if (!regex.test(p)) {
            throw new Error("Invalid parameter name: \"" + p + "\", Parameter names must be valid JavaScript identifiers.")
        }
        if (keyword.includes(p)) {
            throw new Error("Invalid parameter name: \"" + p + "\", Reserved JavaScript keywords cannot be used as parameter names.")
        }
        if (keyword3.includes(p) || keyword2.includes(p)) {
            throw new Error("Reserved parameter name: \"" + p + "\".");
        }
    }

    if (tempParams0.length !== new Set(tempParams0).size) {
        const duplicates = tempParams0.filter((name, index) => {
            return tempParams0.indexOf(name) !== index;
        });

        const uniqueDuplicates = Array.from(new Set(duplicates)).map(name => "\"" + name + "\"");
        const duplicateNames = uniqueDuplicates.join(", ");
        
        if (uniqueDuplicates.length > 1) {
            throw new Error("Duplicate parameter names: " + duplicateNames + ".");
        }

        throw new Error("Duplicate parameter name: " + duplicateNames + ".");
    }

    return [...tempParams0];
};
export function runSteps(ctx, steps) {
    for (let fun of steps) {
        if (typeof fun !== 'function') {
            throw new Error("Step must be a function.");
        }
    }

    let currentCtx = ctx;

    for (let fun of steps) {
        const result = fun(currentCtx);

        if (result == null) {
            throw new Error("Step must return a context object or a signal object.");
        }
        if (typeof result !== 'object') {
            throw new Error("Step must return a context object or a signal object.");
        }
        if (Object.hasOwn(result, "__k__signal__")) {
            return result;
        }

        currentCtx = result;
    }

    return currentCtx;
};
export function createSignal(ctx, signal, value) {
    Object.defineProperty(ctx, signal, {
        value: value,
        enumerable: false,
        configurable: false,
        writable: false,
    });
};
export function fnListTrace(paramsList, args, funs) {
    if (paramsList.length !== args.length) {
        throw new Error("Expected " + paramsList.length + " arguments, but got " + args.length + ".");
    }

    let ctx = Object.create(null);
    const traces = [];

    paramsList.forEach((name, index) => {
        ctx[name] = args[index];
    });

    for (let i = 0; i < funs.length; i++) {
        const fun = funs[i];
        const before = snapshot(ctx);
        const result = fun(ctx);

        if (result == null || typeof result !== "object") {
            throw new Error("Step must return a context object or a signal object.");
        }

        if (Object.hasOwn(result, "__k__signal__")) {
            const signal = {
                type: result.__k__signal__
            };

            if (Object.hasOwn(result, "__k__value__")) {
                signal.value = result.__k__value__;
            }

            traces.push({
                index: i,
                step: fun,
                before,
                after: null,
                signal
            });

            if (result.__k__signal__ === "return") {
                return {
                    params: [...paramsList],
                    args: [...args],
                    steps: traces,
                    result: result.__k__value__
                };
            }

            if (result.__k__signal__ === "throw") {
                throw result.__k__value__;
            }

            if (result.__k__signal__ === "break") {
                throw new Error("Unexpected signal outside loop: \"break\".");
            }

            if (result.__k__signal__ === "continue") {
                throw new Error("Unexpected signal outside loop: \"continue\".");
            }

            throw new Error("Unknown signal: \"" + result.__k__signal__ + "\".");
        }

        ctx = result;

        traces.push({
            index: i,
            step: fun,
            before,
            after: snapshot(ctx),
            signal: null
        });
    }

    return {
        params: [...paramsList],
        args: [...args],
        steps: traces,
        result: snapshot(ctx)
    };
};

export function snapshot(ctx) {
    const copy = {};

    for (const key of Object.keys(ctx)) {
        copy[key] = ctx[key];
    }

    return copy;
}