import { exec } from "@actions/exec";
import hasYarn from "has-yarn";
import { readFile } from "fs";
import { join } from "path";
import { promisify } from "util";

export interface BenchmarkResult {
    name: string;
    category: string;
    result: string;
    opsPerSecond: number;
    extraFields?: Record<string, string>;
}

const readFilePromise = promisify(readFile);

export async function executeBenchmarkScript(
    outputFile: string,
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
        return exec(cmd, [], {
            cwd,
        });
    }

    await execWithCwd(`${manager} install`, workingDirectory);

    const packageJsonContent = await readFilePromise(join(workingDirectory ?? "", "package.json"));
    const packageJsonScripts = JSON.parse(packageJsonContent.toString()).scripts;
    if (!(benchmarkScript in packageJsonScripts)) {
        console.log(`Script ${benchmarkScript} not found in your package.json, skipping comparison`);
        return [];
    }

    await execWithCwd(`${manager} run ${benchmarkScript}`, workingDirectory);

    const outFileJsonContent = await readFilePromise(join(workingDirectory ?? "", outputFile));
    console.log(`Received result ${outFileJsonContent}`);
    return JSON.parse(outFileJsonContent.toString());
}
