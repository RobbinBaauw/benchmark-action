import { BenchmarkResult } from "./benchmark";
import table from "markdown-table";

export const BENCHMARK_HEADING = `## Benchmark report`;

type ParsedResult = [name: string, code: string, newResult: string, oldResult: string];

function formatResult(result: BenchmarkResult): string {
    return `${result.opsPerSecond} ops/sec, ±${result.deviation}%, ${result.samples} samples`;
}

export function formatResults(previousResults: BenchmarkResult[], newResults: BenchmarkResult[]): string {
    const parsedResults: {
        [category: string]: ParsedResult[];
    } = {};

    for (const newResult of newResults) {
        const oldResult = newResults.find((it) => it.name === newResult.name);

        const parsedResult: ParsedResult = [
            newResult.name,
            newResult.code,
            formatResult(newResult),
            oldResult ? formatResult(oldResult) : "-",
        ];

        if (!parsedResults[newResult.category]) parsedResults[newResult.category] = [];
        parsedResults[newResult.category].push(parsedResult);
    }

    const body = [BENCHMARK_HEADING];
    for (const category in parsedResults) {
        body.push(`### ${category}`, table(parsedResults[category]));
    }

    return body.join("\r\n");
}
