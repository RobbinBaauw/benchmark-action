import { exec } from "@actions/exec";
import hasYarn from "has-yarn";

export interface BenchmarkResult {
    name: string;
    category: string;
    code: string;
    opsPerSecond: number;
    deviation: number;
    samples: number;
}

const BENCHMARK_LABEL = "Benchmark results: ";

export async function executeBenchmarkScript(
    benchmarkScript: string,
    branch?: string,
    workingDirectory?: string,
): Promise<BenchmarkResult[]> {
    const manager = hasYarn() ? "yarn" : "npm";

    if (branch) {
        try {
            await exec(`git fetch origin ${branch} --depth=1`);
        } catch (error) {
            console.log("Fetch failed", error.message);
        }

        await exec(`git checkout -f ${branch}`);
    }

    await exec(`${manager} install`, [], {
        cwd: workingDirectory,
    });

    let commandOutput: string = "";
    await exec(`${manager} run ${benchmarkScript}`, [], {
        cwd: workingDirectory,
        listeners: {
            stdout(data) {
                commandOutput += data.toString();
            },
            stderr(data) {
                console.log(data.toString());
            },
        },
    });

    const benchmarkResult = commandOutput
        .split("\n")
        .find((line) => line.startsWith(BENCHMARK_LABEL))
        ?.split(BENCHMARK_LABEL)?.[1];

    if (!benchmarkResult) {
        throw new Error(
            `No benchmark results found, make sure you output it on a single line as JSON as such: '${BENCHMARK_LABEL}[...]`,
        );
    }

    return JSON.parse(benchmarkResult);
}
