import type stylelint from "stylelint";
import classFormat from "./rules/class_format";
import noDescendantCombinator from "./rules/no_descendant_combinator";

export default {
	plugins: [classFormat, noDescendantCombinator],
	rules: {
		"rscss/no-descendant-combinator": "always",
		"rscss/class-format": [
			true,
			{
				componentWhitelist: [
					// These are Bootstrap classes that are typically extended as RSCSS components.
					// These exceptions would be useful in projects that use RSCSS in Bootstrap sites.
					"btn",
					"container",
					"checkbox",
					"radio",
				],
			},
		],
	},
} satisfies stylelint.Config;
