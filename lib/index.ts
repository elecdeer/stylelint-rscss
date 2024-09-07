import type { Plugin } from "stylelint";
import classFormat from "./class_format";
import noDescendantCombinator from "./no_descendant_combinator";

const plugins: Plugin[] = [noDescendantCombinator, classFormat];

export default plugins;
