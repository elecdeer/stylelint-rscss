// lib/class_format.ts
import stylelint from "stylelint";

// lib/helpers/split_by.ts
var splitBy = (list, fn) => {
  const result = [];
  let section = [];
  list.forEach((item, idx) => {
    if (fn(item, idx)) {
      result.push(section);
      result.push(item);
      section = [];
    } else {
      section.push(item);
    }
  });
  result.push(section);
  return result;
};

// lib/helpers/flatten_rule.ts
import resolveNestedSelector from "postcss-resolve-nested-selector";
import selectorParser from "postcss-selector-parser";
var flattenRule = (rule, fn) => {
  const sel = resolveNestedSelector(rule.selector, rule);
  let result;
  selectorParser((selectors) => {
    result = fn(selectors);
  }).process(sel[0]);
  return result;
};

// lib/helpers/walk_selectors.ts
var walkSelectors = (root, fn) => {
  visit(root, fn);
};
var visit = (node, fn) => {
  if (node.type === "rule") {
    const result = visitRule(node, fn);
    if (result?.skip) return;
  }
  if ("nodes" in node && node.nodes) {
    node.nodes.forEach((subnode) => {
      visit(subnode, fn);
    });
  }
};
var visitRule = (rule, fn) => {
  try {
    flattenRule(rule, (selectors) => {
      selectors.nodes.forEach((selector) => fn(rule, selector));
    });
  } catch (err) {
    if (typeof err === "object" && err && "skip" in err) {
      return err;
    }
    throw err;
  }
};

// lib/class_format.ts
var { utils, createPlugin } = stylelint;
var ruleName = "rscss/class-format";
var messages = utils.ruleMessages(ruleName, {
  invalidComponentName(selector) {
    return `Invalid component name: '${selector.toString().trim()}'`;
  },
  invalidHelperName(selector) {
    return `Invalid helper name: '${selector.toString().trim()}'`;
  },
  invalidElementName(selector) {
    return `Invalid element name: '${selector.toString().trim()}'`;
  },
  variantWithoutElement(selector) {
    return `Variant has no element: '${selector.toString().trim()}'`;
  },
  invalidVariantName(selector) {
    return `Invalid variant name: '${selector.toString().trim()}'`;
  },
  invalidVariantNames(selectors) {
    const isMultiple = selectors.split(",").length > 1;
    return `Invalid variant ${isMultiple ? "name" : "names"}: ${selectors}`;
  },
  tooManyComponents(selector) {
    return `Only one component name is allowed: '${selector.toString().trim()}'`;
  },
  tooDeep(selector) {
    return `Component too deep: '${selector.toString().trim()}'`;
  }
});
var EXPR = {
  component: /^([a-z][a-z0-9]*)(-([a-z][a-z0-9]*))+$/,
  "pascal-case": /^([A-Z][a-z0-9]*)+$/,
  "camel-case": /^([a-z][a-z0-9]*)([A-Z][a-z0-9]*)+$/,
  element: /^([a-z][a-z0-9]*)$/,
  variant: /^(-[a-z0-9]+)(-[a-z0-9]+)*$/,
  helper: /^_([a-z][a-z0-9\-]*)$/
};
var DEFAULTS = {
  component: "component",
  element: "element",
  variant: "variant",
  helper: "helper",
  maxDepth: 3,
  componentWhitelist: []
};
var plugin = (primaryOption, _options = {}) => {
  const options = Object.assign({}, DEFAULTS, _options);
  return (root, result) => {
    if (!primaryOption || primaryOption === "never") return;
    walkSelectors(root, (node, selector) => {
      const parts = getParts(selector);
      const topClasses = (parts[0] || []).filter(isClass);
      if (topClasses.length === 0) throw { skip: true };
      validateComponent(topClasses, node, result, options);
      parts.slice(1).forEach((part) => {
        validateElement(part, node, result, options);
      });
      validateDepth(parts, node, result, selector, options);
    });
  };
};
plugin.ruleName = ruleName;
plugin.messages = messages;
var validateDepth = (parts, node, result, selector, options) => {
  if (typeof options.maxDepth !== "number") return;
  if (parts.length - 1 > options.maxDepth) {
    utils.report({
      message: messages.tooDeep(`${selector}`),
      node,
      result,
      ruleName
    });
    throw { skip: true };
  }
};
var validateComponent = (parts, node, result, options) => {
  const classes = parts.filter(isClass);
  const selector = classes.map((c) => `${c}`).join("");
  if (options.helper) {
    const helpers = classes.filter((c) => expr(options.helper).test(c.value));
    if (helpers.length === classes.length) {
      throw { skip: true };
    }
    if (helpers.length > 0) {
      utils.report({
        message: messages.invalidHelperName(selector),
        node,
        result,
        ruleName
      });
      throw { skip: true };
    }
  }
  if (options.component) {
    const valids = classes.filter(
      (c) => expr(options.component).test(c.value) || options.componentWhitelist.indexOf(c.value) !== -1
    );
    if (valids.length === 0) {
      utils.report({
        message: messages.invalidComponentName(selector),
        node,
        result,
        ruleName
      });
      throw { skip: true };
    }
    if (valids.length > 1) {
      utils.report({
        message: messages.tooManyComponents(selector),
        node,
        result,
        ruleName
      });
      throw { skip: true };
    }
  }
  if (options.variant) {
    const invalids = classes.filter(
      (c) => !(expr(options.component).test(c.value) || options.componentWhitelist.indexOf(c.value) !== -1 || expr(options.variant).test(c.value))
    );
    if (invalids.length !== 0) {
      utils.report({
        message: messages.invalidVariantNames(
          invalids.map((c) => `${c.toString().trim()}`).join(", ")
        ),
        node,
        result,
        ruleName
      });
      throw { skip: true };
    }
  }
};
var getParts = (selector) => {
  const parts = splitBy(selector.nodes, isSeparator);
  return parts.filter((_, idx) => idx % 2 === 0).map(getLastPart);
};
var isSeparator = (node) => {
  return node.type === "combinator" && (node.value === " " || node.value === ">");
};
var isClass = (node) => {
  return node.type === "class";
};
var validateElement = (parts, node, result, options) => {
  const classes = parts.filter(isClass);
  if (classes.length === 0) return;
  const selector = parts.map((p) => `${p}`).join("");
  const isAllClasses = classes.length === parts.length;
  if (options.variant && isAllClasses) {
    const validVariants = classes.filter(
      (c) => expr(options.variant).test(c.value)
    );
    if (validVariants.length === classes.length) {
      utils.report({
        message: messages.variantWithoutElement(selector),
        node,
        result,
        ruleName
      });
      throw { skip: true };
    }
  }
  classes.forEach((c, idx) => {
    if (idx === 0) {
      if (options.element) {
        const isValid = expr(options.element).test(c.value);
        if (!isValid && !(expr(options.variant).test(c.value) && !isAllClasses)) {
          utils.report({
            message: messages.invalidElementName(c.toString()),
            node,
            result,
            ruleName
          });
          throw { skip: true };
        }
      }
    } else {
      if (options.variant) {
        const isValid = expr(options.variant).test(c.value);
        if (!isValid) {
          utils.report({
            message: messages.invalidVariantName(c.toString()),
            node,
            result,
            ruleName
          });
          throw { skip: true };
        }
      }
    }
  });
};
var getLastPart = (parts) => {
  const subparts = splitBy(parts, (s) => s.type === "combinator");
  return subparts[subparts.length - 1];
};
var expr = (name) => {
  if (!name) throw new Error("No name provided");
  if ([
    "component",
    "element",
    "variant",
    "helper",
    "pascal-case",
    "camel-case"
  ].includes(name)) {
    return EXPR[name];
  }
  if (typeof name === "string") return new RegExp(name);
  throw new Error(`Invalid expression: ${name}`);
};
var class_format_default = createPlugin(ruleName, plugin);

// lib/no_descendant_combinator.ts
import stylelint2 from "stylelint";
var { utils: utils2, createPlugin: createPlugin2 } = stylelint2;
var ruleName2 = "rscss/no-descendant-combinator";
var messages2 = utils2.ruleMessages(ruleName2, {
  expected(selector) {
    return `Descendant combinator not allowed: '${selector.toString().trim()}'`;
  }
});
var plugin2 = (primaryOption) => (root, result) => {
  if (!primaryOption || primaryOption === "never") return;
  walkSelectors(root, (rule, selector) => {
    for (let i = 0, len = selector.nodes.length; i < len; i++) {
      const part = selector.nodes[i];
      if (part.type === "combinator" && part.value === " ") {
        utils2.report({
          message: messages2.expected(`${selector}`),
          node: rule,
          result,
          ruleName: ruleName2
        });
        throw { skip: true };
      }
    }
  });
};
plugin2.ruleName = ruleName2;
plugin2.messages = messages2;
var no_descendant_combinator_default = createPlugin2(ruleName2, plugin2);

// lib/index.ts
var plugins = [no_descendant_combinator_default, class_format_default];
var lib_default = plugins;
export {
  lib_default as default
};
