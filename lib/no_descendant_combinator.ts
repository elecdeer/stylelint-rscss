import stylelint from "stylelint";
import walkSelectors from "./helpers/walk_selectors.js";

const { utils, createPlugin } = stylelint;

const ruleName = "rscss/no-descendant-combinator";

const messages = utils.ruleMessages(ruleName, {
	expected(selector: string) {
		return `Descendant combinator not allowed: '${selector.toString().trim()}'`;
	},
});

const plugin: stylelint.Rule<boolean | "never", unknown> =
	(primaryOption) => (root, result) => {
		if (!primaryOption || primaryOption === "never") return;

		walkSelectors(root, (rule, selector) => {
			for (let i = 0, len = selector.nodes.length; i < len; i++) {
				const part = selector.nodes[i];

				if (part.type === "combinator" && part.value === " ") {
					utils.report({
						message: messages.expected(`${selector}`),
						node: rule,
						result,
						ruleName,
					});

					throw { skip: true };
				}
			}
		});
	};

plugin.ruleName = ruleName;
plugin.messages = messages;

export default createPlugin(ruleName, plugin);
