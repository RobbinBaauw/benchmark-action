import { BenchmarkResult } from "./benchmark";
import table from "markdown-table";

export const BENCHMARK_HEADING = `## Benchmark report`;

type ParsedResult = [name: string, newResult: string, oldResult: string, difference: string, ...extraFields: string[]];

export function formatResults(newResults: BenchmarkResult[], previousResults: BenchmarkResult[]): string {
    const parsedResults: {
        [category: string]: ParsedResult[];
    } = {};

    for (const newResult of newResults) {
        const oldResult = previousResults.find((it) => it.name === newResult.name);

        let difference = "-";
        if (oldResult) {
            const differenceRatio = (newResult.opsPerSecond - oldResult.opsPerSecond) / oldResult.opsPerSecond;
            const emoji = differenceRatio > 0 ? "🟢" : "🔴";
            difference = `${emoji} ${differenceRatio * 100}%`;
        }

        const parsedResult: ParsedResult = [
            newResult.name,
            newResult.result,
            oldResult?.name ?? "-",
            difference,
            // TODO check that all benchmarks in category have the same fields
            ...Object.values(newResult.extraFields ?? {}),
        ];

        if (!parsedResults[newResult.category]) {
            const newCategory: ParsedResult[] = [];
            newCategory.push(["Name", "New", "Old", "Difference", ...Object.keys(newResult.extraFields ?? {})]);
            parsedResults[newResult.category] = newCategory;
        }

        parsedResults[newResult.category].push(parsedResult);
    }

    const body = [BENCHMARK_HEADING];
    for (const category in parsedResults) {
        body.push(`### ${category}`, table(parsedResults[category]));
    }

    return body.join("\r\n");
}
