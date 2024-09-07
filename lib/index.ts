import type { Plugin } from "stylelint";
import classFormat from "./class_format.js";
import noDescendantCombinator from "./no_descendant_combinator.js";

const plugins: Plugin[] = [noDescendantCombinator, classFormat];

export default plugins;
