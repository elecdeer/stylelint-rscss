import type postcss from "postcss";
import type parser from "postcss-selector-parser";
import { flattenRule } from "./flatten_rule";

/**
 * Walks all selectors in a tree.
 *
 * @example
 * walkSelectors(root, (rule, selector) => {
 *   // ...
 * });
 */
export const walkSelectors = async (
	root: postcss.Root,
	fn: (rule: postcss.Rule, selector: parser.Selector) => void,
) => {
	await visit(root, fn);
};

/**
 * @internal
 * recursively visit a node.
 */
const visit = async (
	node: postcss.ChildNode | postcss.Root,
	fn: (rule: postcss.Rule, selector: parser.Selector) => void,
) => {
	if (node.type === "rule") {
		const result = await visitRule(node, fn);
		if (result?.skip) return;
	}

	if ("nodes" in node && node.nodes) {
		node.nodes.forEach((subnode) => {
			visit(subnode, fn);
		});
	}
};

/**
 * @internal
 * visits a `Rule` node.
 */
const visitRule = async (
	rule: postcss.Rule,
	fn: (rule: postcss.Rule, selector: parser.Selector) => void,
) => {
	try {
		await flattenRule(rule, (selectors) => {
			selectors.nodes.forEach((selector) => fn(rule, selector));
		});
	} catch (err: unknown) {
		// Use `throw {skip: true}` to stop processing that nested tree.
		if (typeof err === "object" && err && "skip" in err) {
			return err;
		}
		throw err;
	}
};
