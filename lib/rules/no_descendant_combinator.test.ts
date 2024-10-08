import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { getTestRule } from "vitest-stylelint-utils";

import plugin from "./no_descendant_combinator";

const testRule = getTestRule({
	plugins: [plugin],
	describe,
	expect,
	it,
});

const childCssCode = fs.readFileSync(
	path.resolve(__dirname, "../../fixtures/child.css"),
	"utf-8",
);

const childScssCode = fs.readFileSync(
	path.resolve(__dirname, "../../fixtures/child.scss"),
	"utf-8",
);

describe("no descendant combinator - css", () => {
	testRule({
		ruleName: "rscss/no-descendant-combinator",
		config: [true],

		reject: [
			{
				code: childCssCode,
				message:
					"Descendant combinator not allowed: 'a.bad-component .xyz' (rscss/no-descendant-combinator)",
			},
		],
	});
});

describe("no descendant combinator - scss", () => {
	testRule({
		ruleName: "rscss/no-descendant-combinator",
		customSyntax: "postcss-scss",
		config: [true],

		reject: [
			{
				code: childScssCode,
				message:
					"Descendant combinator not allowed: '.component-name .badelement' (rscss/no-descendant-combinator)",
			},
		],
	});
});
