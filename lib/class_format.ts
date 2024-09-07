import stylelint from "stylelint";
import splitBy from "./helpers/split_by.js";
import walkSelectors from "./helpers/walk_selectors.js";
import type parser from "postcss-selector-parser";
import type postcss from "postcss";

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
		return `Invalid variant ${isMultiple ? "name" : "names"}: ${selectors}`;
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

/**
 * Internal: default regular expressions
 */

const EXPR = {
	component: /^([a-z][a-z0-9]*)(-([a-z][a-z0-9]*))+$/,
	"pascal-case": /^([A-Z][a-z0-9]*)+$/,
	"camel-case": /^([a-z][a-z0-9]*)([A-Z][a-z0-9]*)+$/,
	element: /^([a-z][a-z0-9]*)$/,
	variant: /^(-[a-z0-9]+)(-[a-z0-9]+)*$/,
	helper: /^_([a-z][a-z0-9\-]*)$/,
} as const satisfies Record<ClassificationStyle, RegExp>;

export type ClassificationStyle =
	| "component"
	| "element"
	| "variant"
	| "helper"
	| "pascal-case"
	| "camel-case";

export type SecondaryOptions = {
	component: ClassificationStyle | string;
	element: ClassificationStyle | string;
	variant: ClassificationStyle | string;
	helper: ClassificationStyle | string;
	maxDepth: number;
	componentWhitelist: string[];
};

/**
 * Internal: default secondary options
 */

const DEFAULTS = {
	component: "component",
	element: "element",
	variant: "variant",
	helper: "helper",
	maxDepth: 3,
	componentWhitelist: [],
} as const satisfies SecondaryOptions;

/**
 * Internal: the plugin
 */
const plugin: stylelint.Rule<boolean | "never", SecondaryOptions> = (
	primaryOption,
	_options: Partial<SecondaryOptions> = {},
) => {
	const options = Object.assign({}, DEFAULTS, _options);

	return (root, result) => {
		if (!primaryOption || primaryOption === "never") return;
		walkSelectors(root, (node, selector) => {
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
	options: SecondaryOptions,
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
 * Internal: validate a top-level class
 */

const validateComponent = (
	parts: parser.Node[],
	node: postcss.Rule,
	result: stylelint.PostcssResult,
	options: SecondaryOptions,
) => {
	const classes = parts.filter(isClass);
	const selector = classes.map((c) => `${c}`).join("");

	if (options.helper) {
		// Helpers are fine, but they must not be mixed with others.
		const helpers = classes.filter((c) => expr(options.helper).test(c.value));
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
				expr(options.component).test(c.value) ||
				options.componentWhitelist.indexOf(c.value) !== -1,
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
					expr(options.component).test(c.value) ||
					options.componentWhitelist.indexOf(c.value) !== -1 ||
					expr(options.variant).test(c.value)
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
 * Internal: get the classes of each part.
 *
 *     '.foo-bar .a' => [['.foo-bar'], ['.a']]
 *     '.foo-bar.baz > .a' => [['.foo-bar', '.baz'], ['.a']]
 */

const getParts = (selector: parser.Selector) => {
	const parts = splitBy(selector.nodes, isSeparator);
	return parts
		.filter((_, idx) => idx % 2 === 0) // Remove combinators
		.map(getLastPart); // `.a ~ .b ~ .c` => `.c`
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
 * Internal: validate a non-top-level class
 */

const validateElement = (
	parts: parser.Node[],
	node: postcss.Rule,
	result: stylelint.PostcssResult,
	options: SecondaryOptions,
) => {
	// Only work if there are classes.
	const classes = parts.filter(isClass);
	if (classes.length === 0) return;

	const selector = parts.map((p) => `${p}`).join("");
	const isAllClasses = classes.length === parts.length;

	if (options.variant && isAllClasses) {
		// All variants (no elements)? That's bad
		const validVariants = classes.filter((c) =>
			expr(options.variant).test(c.value),
		);
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
				const isValid = expr(options.element).test(c.value);

				// It's valid if it's an element, or it's a variant of a tag
				if (
					!isValid &&
					!(expr(options.variant).test(c.value) && !isAllClasses)
				) {
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
				const isValid = expr(options.variant).test(c.value);

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
 * Internal: discard everything before the last combinator.
 *
 *    '.a' => '.a'
 *    '.a ~ .b ~ .c' => '.c'
 */

const getLastPart = (parts: parser.Node[]) => {
	const subparts = splitBy(parts, (s) => s.type === "combinator");
	return subparts[subparts.length - 1];
};

/**
 * Internal: returns a regular expression.
 *
 *     expr('component') => EXPR.component
 *     expr(/.../) => /.../
 */

const expr = (name: ClassificationStyle | string): RegExp => {
	if (!name) throw new Error("No name provided");
	if (
		[
			"component",
			"element",
			"variant",
			"helper",
			"pascal-case",
			"camel-case",
		].includes(name)
	) {
		return EXPR[name as ClassificationStyle];
	}
	if (typeof name === "string") return new RegExp(name);
	throw new Error(`Invalid expression: ${name}`);
};

/*
 * Export
 */

export default createPlugin(ruleName, plugin);
