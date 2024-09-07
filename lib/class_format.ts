import type postcss from "postcss";
import type parser from "postcss-selector-parser";
import stylelint from "stylelint";
import {
	type ResolvedSecondaryOptions,
	type SecondaryOptions,
	resolveSecondaryConfig,
} from "./helpers/class_format_options";
import { splitBy } from "./helpers/split_by";
import { walkSelectors } from "./helpers/walk_selectors";

const { utils, createPlugin } = stylelint;

const ruleName = "rscss/class-format";

const messages = utils.ruleMessages(ruleName, {
	invalidComponentName(selector: string) {
		return `Invalid component name: '${selector.toString().trim()}'`;
	},
	invalidHelperName(selector: string) {
		return `Invalid helper name: '${selector.toString().trim()}'`;
	},
	invalidElementName(selector: string) {
		return `Invalid element name: '${selector.toString().trim()}'`;
	},
	variantWithoutElement(selector: string) {
		return `Variant has no element: '${selector.toString().trim()}'`;
	},
	invalidVariantName(selector: string) {
		return `Invalid variant name: '${selector.toString().trim()}'`;
	},
	invalidVariantNames(selectors: string) {
		const isMultiple = selectors.split(",").length > 1;
		return `Invalid variant ${isMultiple ? "names" : "name"}: '${selectors}'`;
	},
	tooManyComponents(selector: string) {
		return `Only one component name is allowed: '${selector
			.toString()
			.trim()}'`;
	},
	tooDeep(selector: string) {
		return `Component too deep: '${selector.toString().trim()}'`;
	},
});

const plugin: stylelint.Rule<boolean | "never", SecondaryOptions> = (
	primaryOption,
	_options: Partial<SecondaryOptions> = {},
) => {
	const options = resolveSecondaryConfig(_options);

	return async (root, result) => {
		if (!primaryOption || primaryOption === "never") return;
		await walkSelectors(root, (node, selector) => {
			const parts = getParts(selector);

			// Only operate on rules with classes.
			const topClasses = (parts[0] || []).filter(isClass);
			if (topClasses.length === 0) throw { skip: true };

			// Validate the top-level classes.
			validateComponent(topClasses, node, result, options);

			// Validate non-top-level classes.
			parts.slice(1).forEach((part) => {
				validateElement(part, node, result, options);
			});

			// Validate depth.
			validateDepth(parts, node, result, selector, options);
		});
	};
};
plugin.ruleName = ruleName;
plugin.messages = messages;

const validateDepth = (
	parts: parser.Node[][],
	node: postcss.Rule,
	result: stylelint.PostcssResult,
	selector: parser.Selector,
	options: ResolvedSecondaryOptions,
) => {
	if (typeof options.maxDepth !== "number") return;
	if (parts.length - 1 > options.maxDepth) {
		utils.report({
			message: messages.tooDeep(`${selector}`),
			node,
			result,
			ruleName,
		});
		throw { skip: true };
	}
};

/**
 * @internal
 * validate a top-level class
 */
const validateComponent = (
	parts: parser.Node[],
	node: postcss.Rule,
	result: stylelint.PostcssResult,
	options: ResolvedSecondaryOptions,
) => {
	const classes = parts.filter(isClass);
	const selector = classes.map((c) => `${c}`).join("");

	if (options.helper) {
		// Helpers are fine, but they must not be mixed with others.
		const helpers = classes.filter((c) => options.helper.test(c.value));
		if (helpers.length === classes.length) {
			throw { skip: true };
		}

		// If helpers are mixed with non-helper classes (eg, `._foo.bar`), that's
		// not valid.
		if (helpers.length > 0) {
			utils.report({
				message: messages.invalidHelperName(selector),
				node,
				result,
				ruleName,
			});
			throw { skip: true };
		}
	}

	if (options.component) {
		// Ensure that there's one component name in it.
		const valids = classes.filter(
			(c) =>
				options.component.test(c.value) ||
				options.componentWhitelist.includes(c.value),
		);

		if (valids.length === 0) {
			utils.report({
				message: messages.invalidComponentName(selector),
				node,
				result,
				ruleName,
			});
			throw { skip: true };
		}

		// You can only have one component name.
		if (valids.length > 1) {
			utils.report({
				message: messages.tooManyComponents(selector),
				node,
				result,
				ruleName,
			});
			throw { skip: true };
		}
	}

	if (options.variant) {
		// Ensure that there's one component name in it.
		const invalids = classes.filter(
			(c) =>
				!(
					options.component.test(c.value) ||
					options.componentWhitelist.includes(c.value) ||
					options.variant.test(c.value)
				),
		);

		if (invalids.length !== 0) {
			utils.report({
				message: messages.invalidVariantNames(
					invalids.map((c) => `${c.toString().trim()}`).join(", "),
				),
				node,
				result,
				ruleName,
			});
			throw { skip: true };
		}
	}
};

/**
 * @internal
 * get the classes of each part.
 *
 * @example
 * get_parts('.foo-bar .a'); // returns [['.foo-bar'], ['.a']]
 * get_parts('.foo-bar.baz > .a'); // returns [['.foo-bar', '.baz'], ['.a']]
 */
const getParts = (selector: parser.Selector) => {
	const parts = splitBy(selector.nodes, isSeparator);
	return parts.map(getLastPart); // `.a ~ .b ~ .c` => `.c`
};

const isSeparator = (node: parser.Node): node is parser.Combinator => {
	return (
		node.type === "combinator" && (node.value === " " || node.value === ">")
	);
};

const isClass = (node: parser.Node): node is parser.ClassName => {
	return node.type === "class";
};

/**
 * @internal
 * validate a non-top-level class
 */
const validateElement = (
	parts: parser.Node[],
	node: postcss.Rule,
	result: stylelint.PostcssResult,
	options: ResolvedSecondaryOptions,
) => {
	// Only work if there are classes.
	const classes = parts.filter(isClass);
	if (classes.length === 0) return;

	const selector = parts.map((p) => `${p}`).join("");
	const isAllClasses = classes.length === parts.length;

	if (options.variant && isAllClasses) {
		// All variants (no elements)? That's bad
		const validVariants = classes.filter((c) => options.variant.test(c.value));
		if (validVariants.length === classes.length) {
			utils.report({
				message: messages.variantWithoutElement(selector),
				node,
				result,
				ruleName,
			});
			throw { skip: true };
		}
	}

	classes.forEach((c, idx) => {
		if (idx === 0) {
			if (options.element) {
				// The first class is always the element.
				const isValid = options.element.test(c.value);

				// It's valid if it's an element, or it's a variant of a tag
				if (!isValid && !(options.variant.test(c.value) && !isAllClasses)) {
					utils.report({
						message: messages.invalidElementName(c.toString()),
						node,
						result,
						ruleName,
					});
					throw { skip: true };
				}
			}
		} else {
			if (options.variant) {
				// The other classes are variants.
				const isValid = options.variant.test(c.value);

				if (!isValid) {
					utils.report({
						message: messages.invalidVariantName(c.toString()),
						node,
						result,
						ruleName,
					});
					throw { skip: true };
				}
			}
		}
	});
};

/**
 * @internal
 * discard everything before the last combinator.
 *
 * @example
 * get_last_part('.a'); // returns '.a'
 * get_last_part('.a ~ .b ~ .c'); // returns '.c'
 */
const getLastPart = (parts: parser.Node[]) => {
	const subparts = splitBy(parts, (s) => s.type === "combinator");
	return subparts[subparts.length - 1];
};

export default createPlugin(ruleName, plugin);
