import { exec } from "@actions/exec";
import hasYarn from "has-yarn";
import { readFile } from "fs";
import { join } from "path";
import { promisify } from "util";

export interface BenchmarkResult {
    name: string;
    category: string;
    result: string;
    extraFields: Record<string, string>;
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

    async function execWithCwd(cmd: string, cwd?: string) {
        let stdout = "";
        let stderr = "";

        await exec(cmd, [], {
            cwd,
            listeners: {
                stdout(data) {
                    stdout += data.toString();
                },
                stderr(data) {
                    stderr += data.toString();
                },
            },
        });

        return Promise.resolve([stdout, stderr]);
    }

    await execWithCwd(`${manager} install`, workingDirectory);

    const packageJsonContent = await promisify(readFile)(join(workingDirectory ?? "", "package.json"));
    const packageJsonScripts = JSON.parse(packageJsonContent.toString()).scripts;
    if (!(benchmarkScript in packageJsonScripts)) {
        console.log(`Script ${benchmarkScript} not found in your package.json, skipping comparison`);
        return [];
    }

    const [benchmarkStdout, benchmarkStderr] = await execWithCwd(`${manager} run ${benchmarkScript}`, workingDirectory);
    if (benchmarkStderr.length > 0) console.log(`Received stderr: ${benchmarkStderr}`);

    const benchmarkResult = benchmarkStdout
        .split("\n")
        .find((line) => line.startsWith(BENCHMARK_LABEL))
        ?.split(BENCHMARK_LABEL)?.[1];

    if (!benchmarkResult) {
        throw new Error(
            `No benchmark results found, make sure you output it on a single line as JSON as such: '${BENCHMARK_LABEL}[...]`,
        );
    }

    console.log(`Parsing result ${benchmarkResult}`);
    const parse = JSON.parse(benchmarkResult);
    console.log(`Parsing successful, ${parse}`);
    return parse;
}
