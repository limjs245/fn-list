import { snapshot } from "./utils.js";

export function fnListRunner(paramsList, args, funs) {
    if (paramsList.length !== args.length) {
        throw new Error("Expected " + paramsList.length + " arguments, but got " + args.length + ".");
    }

    let index = 0;
    let ctx = Object.create(null);
    let done = false;
    let value;

    paramsList.forEach((name, index) => {
        ctx[name] = args[index];
    });

    const validateResult = (result) => {
        if (result == null) {
            throw new Error("Step must return a context object or a signal object.");
        }

        if (typeof result !== "object") {
            throw new Error("Step must return a context object or a signal object.");
        }
    }

    const runner = {
        next: () => {
            if (done) {
                return {
                    done: true,
                    value,
                    index,
                    ctx: snapshot(ctx)
                }
            }

            if (index >= funs.length) {
                done = true;
                value = snapshot(ctx);
                
                return {
                    done: true,
                    value,
                    index,
                    ctx: snapshot(ctx)
                }
            }

            const stepIndex = index;
            const fun = funs[index];
            const before = snapshot(ctx);
            index++
            const result = fun(ctx);
            validateResult(result);

            if (Object.hasOwn(result, "__k__signal__")) {
                if (result.__k__signal__ === "return") {
                    if (!Object.hasOwn(result, "__k__value__")) {
                        throw new Error("Return signal must have a value.");
                    }

                    done = true;
                    value = result.__k__value__;

                    return {
                        done: true,
                        index: stepIndex,
                        signal: "return",
                        value,
                        before,
                        after: snapshot(ctx)
                    };
                }
                if (result.__k__signal__ === "break") {
                    done = true;
                    throw new Error("Unexpected signal outside loop: \"break\".");
                }
                if (result.__k__signal__ === "continue") {
                    done = true;
                    throw new Error("Unexpected signal outside loop: \"continue\".");
                }
                if (result.__k__signal__ === "throw") {
                    if (!Object.hasOwn(result, "__k__value__")) {
                        throw new Error("Throw signal must have a value.");
                    }

                    done = true;
                    throw result.__k__value__;
                }

                done = true;
                throw new Error("Unknown signal: \"" + result.__k__signal__ + "\".");
            }

            ctx = result;

            return {
                done: false,
                index: stepIndex,
                signal: null,
                value: snapshot(ctx),
                before,
                after: snapshot(ctx)
            }
        },
        run: () => {
            let current;

            do {
                current = runner.next();
            } while (!current.done);

            return current.value;
        },
        get index() {
            return index;
        },
        get done() {
            return done;
        },
        get ctx() {
            return snapshot(ctx);
        }
    };

    return runner;
}