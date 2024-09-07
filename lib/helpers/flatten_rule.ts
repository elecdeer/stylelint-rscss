import resolveNestedSelector from "postcss-resolve-nested-selector";
import selectorParser from "postcss-selector-parser";

import type * as postcss from "postcss";

/**
 * Flattens a nested `rule`. Invokes `fn` with the flattened selectors.
 */

const flattenRule = <T>(
	rule: postcss.Rule,
	fn: (selectors: selectorParser.Root) => T,
) => {
	const sel = resolveNestedSelector(rule.selector, rule);
	let result: T | undefined;

	selectorParser((selectors) => {
		result = fn(selectors);
	}).process(sel[0]);

	return result;
};

export default flattenRule;
