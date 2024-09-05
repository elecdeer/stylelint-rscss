import { describe, expect, it } from "vitest";
import { getTestRule } from "vitest-stylelint-utils";

// TODO: Fix this
// @ts-ignore
import plugins from "../index.js";

const testRule = getTestRule({
	plugins: [plugins],
	describe,
	expect,
	it,
});

const childCssCode = `
@charset 'utf-8';

.foo-bar > .el {
  display: flex;
  flex: auto;
}

a.bad-component .xyz {
  color: blue;
  display: block;
}
`;

describe("no descendant combinator - css", () => {
	testRule({
		ruleName: "rscss/no-descendant-combinator",
		config: [true],

		reject: [
			{
				code: childCssCode,
				message:
					"Descendant combinator not allowed: 'a.bad-component .xyz' (rscss/no-descendant-combinator)",
			},
		],
	});
});

const childScssCode = `
.component-name {
  > .goodelement {
    color: blue;
  }

  .badelement {
    color: blue;

    .alsobad {
      color: red;
    }
  }
}
`;

describe("no descendant combinator - scss", () => {
	testRule({
		ruleName: "rscss/no-descendant-combinator",
		customSyntax: "postcss-scss",
		config: [true],

		reject: [
			{
				code: childScssCode,
				message:
					"Descendant combinator not allowed: '.component-name .badelement' (rscss/no-descendant-combinator)",
			},
		],
	});
});
