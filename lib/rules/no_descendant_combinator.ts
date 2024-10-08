import stylelint from "stylelint";
import { walkSelectors } from "../helpers/walk_selectors";

const { utils, createPlugin } = stylelint;

const ruleName = "rscss/no-descendant-combinator";

const messages = utils.ruleMessages(ruleName, {
	expected(selector: string) {
		return `Descendant combinator not allowed: '${selector.toString().trim()}'`;
	},
});

const plugin: stylelint.Rule<boolean | "never", unknown> =
	(primaryOption) => async (root, result) => {
		if (!primaryOption || primaryOption === "never") return;

		await walkSelectors(root, (rule, selector) => {
			selector.nodes.forEach((part) => {
				if (part.type === "combinator" && part.value === " ") {
					utils.report({
						message: messages.expected(`${selector}`),
						node: rule,
						result,
						ruleName,
					});

					throw { skip: true };
				}
			});
		});
	};

plugin.ruleName = ruleName;
plugin.messages = messages;

export default createPlugin(ruleName, plugin);
