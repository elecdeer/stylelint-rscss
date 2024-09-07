import { describe, expect, it } from "vitest";
import { splitBy } from "./split_by";

describe("splitBy", () => {
	it("should split the list by a function", () => {
		const list = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
		const isSeparator = (item: number) => item % 3 === 0;

		const result = splitBy(list, isSeparator);

		expect(result).toEqual([[1, 2], [4, 5], [7, 8], [10]]);
	});

	it("should split the list by a function with one separator", () => {
		const list = [1, 2, 3];
		const isSeparator = (item: number) => item % 3 === 0;

		const result = splitBy(list, isSeparator);

		expect(result).toEqual([[1, 2]]);
	});

	it("should split the list by a function with empty list", () => {
		const list: number[] = [];
		const isSeparator = (item: number) => item % 2 === 0;

		const result = splitBy(list, isSeparator);

		expect(result).toEqual([]);
	});

	it("should split the list by a function with no separators", () => {
		const list = [1, 3, 5, 7, 9];
		const isSeparator = (item: number) => item % 2 === 0;

		const result = splitBy(list, isSeparator);

		expect(result).toEqual([[1, 3, 5, 7, 9]]);
	});
});
