import { BenchmarkResult } from "./benchmark";
import table from "markdown-table";

export const BENCHMARK_HEADING = `## Benchmark report`;

type ParsedResult = [name: string, newResult: string, oldResult: string, ...extraFields: string[]];

export function formatResults(newResults: BenchmarkResult[], previousResults: BenchmarkResult[]): string {
    const parsedResults: {
        [category: string]: ParsedResult[];
    } = {};

    for (const newResult of newResults) {
        const oldResult = previousResults.find((it) => it.name === newResult.name);

        const parsedResult: ParsedResult = [
            newResult.name,
            newResult.result,
            oldResult?.name ?? "-",
            // TODO check that all benchmarks in category have the same fields
            ...Object.values(newResult.extraFields),
        ];

        if (!parsedResults[newResult.category]) {
            const newCategory: ParsedResult[] = [];
            newCategory.push(["Name", "New", "Old", ...Object.keys(newResult.extraFields)]);
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
