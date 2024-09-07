import type { Plugin } from "stylelint";
import classFormat from "./rules/class_format";
import noDescendantCombinator from "./rules/no_descendant_combinator";

const plugins: Plugin[] = [noDescendantCombinator, classFormat];

export default plugins;
