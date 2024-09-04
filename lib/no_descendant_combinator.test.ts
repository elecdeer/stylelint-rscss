import { join } from "path";

import stylelint from "stylelint";

describe("no descendant combinator", () => {
  test("css", async () => {
    const result = await stylelint.lint({
      files: [fixture("child.css")],
    });
    const warnings = result.results[0].warnings;

    expect(warnings.length).toBe(1);
    expect(warnings[0].rule).toBe("rscss/no-descendant-combinator");
    expect(warnings[0].text).toBe(
      "Descendant combinator not allowed: 'a.bad-component .xyz' (rscss/no-descendant-combinator)"
    );
  });

  test("scss", async () => {
    const result = await stylelint.lint({
      files: [fixture("child.scss")],
      customSyntax: "postcss-scss",
    });
    const warnings = result.results[0].warnings;

    expect(warnings.length).toBe(1);
    expect(warnings[0].rule).toBe("rscss/no-descendant-combinator");
    expect(warnings[0].text).toBe(
      "Descendant combinator not allowed: '.component-name .badelement' (rscss/no-descendant-combinator)"
    );
  });
});

const fixture = (path: string) => join(__dirname, "../fixtures", path);
