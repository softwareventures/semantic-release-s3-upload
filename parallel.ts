import {notNull} from "@softwareventures/nullable";
import * as os from "os";

export default async function parallel<T>(tasks: ReadonlyArray<() => Promise<T>>, threads = 0): Promise<T[]> {
    if (threads <= 0) {
        threads = os.cpus().length * 2;
    }

    const results: Array<Promise<T>> = new Array(tasks.length);
    let nextTaskIndex = 0;

    async function run(): Promise<void> {
        const i = nextTaskIndex++;
        if (i < tasks.length) {
            const result = notNull(tasks[i])();
            results[i] = result;

            return result.then(run);
        } else {
            return Promise.resolve();
        }
    }

    const runs: Array<Promise<void>> = [];
    for (let i = 0; i < threads; ++i) {
        runs.push(run());
    }

    return Promise.all(runs)
        .then(() => Promise.all(results));
}
