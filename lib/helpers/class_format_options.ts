export type ClassificationStyle =
	| "component"
	| "element"
	| "variant"
	| "helper"
	| "pascal-case"
	| "camel-case";

type RegExpStr = string;
export type SecondaryOptions = {
	component: ClassificationStyle | RegExpStr;
	element: ClassificationStyle | RegExpStr;
	variant: ClassificationStyle | RegExpStr;
	helper: ClassificationStyle | RegExpStr;
	maxDepth: number;
	componentWhitelist: string[];
};

/**
 * @internal
 * default secondary options
 */
const DEFAULTS = {
	component: "component",
	element: "element",
	variant: "variant",
	helper: "helper",
	maxDepth: 3,
	componentWhitelist: [],
} as const satisfies SecondaryOptions;

export type ResolvedSecondaryOptions = {
	component: RegExp;
	element: RegExp;
	variant: RegExp;
	helper: RegExp;
	maxDepth: number;
	componentWhitelist: string[];
};

export const resolveSecondaryConfig = (
	_options: Partial<SecondaryOptions>,
): ResolvedSecondaryOptions => {
	return {
		component: resolveStyleExpr(_options.component ?? DEFAULTS.component),
		element: resolveStyleExpr(_options.element ?? DEFAULTS.element),
		variant: resolveStyleExpr(_options.variant ?? DEFAULTS.variant),
		helper: resolveStyleExpr(_options.helper ?? DEFAULTS.helper),
		maxDepth: _options.maxDepth ?? DEFAULTS.maxDepth,
		componentWhitelist:
			_options.componentWhitelist ?? DEFAULTS.componentWhitelist,
	};
};

/**
 * @internal
 * default regular expressions
 */
const EXPR = {
	component: /^([a-z][a-z0-9]*)(-([a-z][a-z0-9]*))+$/,
	"pascal-case": /^([A-Z][a-z0-9]*)+$/,
	"camel-case": /^([a-z][a-z0-9]*)([A-Z][a-z0-9]*)+$/,
	element: /^([a-z][a-z0-9]*)$/,
	variant: /^(-[a-z0-9]+)(-[a-z0-9]+)*$/,
	helper: /^_([a-z][a-z0-9\-]*)$/,
} as const satisfies Record<ClassificationStyle, RegExp>;

/**
 * @internal
 * @example
 * // Using predefined classification style
 * resolveStyleExpr('component'); // returns EXPR.component
 *
 * // Using custom regular expression
 * resolveStyleExpr(/.../); // returns /.../
 */
const resolveStyleExpr = (name: ClassificationStyle | string): RegExp => {
	if (!name || typeof name !== "string") throw new Error("Invalid name option");

	switch (name) {
		case "component":
		case "element":
		case "variant":
		case "helper":
		case "pascal-case":
		case "camel-case":
			return EXPR[name as ClassificationStyle];
		default: {
			const regExp = new RegExp(name);
			if (regExp.global) {
				throw new Error("Cannot use global flag in regular expression here");
			}
			return new RegExp(name);
		}
	}
};
