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

export async function executeBenchmarkScript(
    buildScript: string,
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

    await exec(`${manager} run ${buildScript}`, [], {
        cwd: workingDirectory,
    });

    let benchmarks: string = "";
    await exec(`${manager} run ${benchmarkScript}`, [], {
        cwd: workingDirectory,
        listeners: {
            stdout(data) {
                benchmarks += data.toString();
            },
            stderr(data) {
                console.log(data.toString());
            },
        },
    });

    return JSON.parse(benchmarks);
}
