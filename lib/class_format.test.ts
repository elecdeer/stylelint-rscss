import { join } from "path";

import stylelint from "stylelint";

describe("class format", () => {
  test("basic", async () => {
    const result = await stylelint.lint({
      files: [fixture("class_format.css")],
    });
    const warnings = result.results[0].warnings;

    expect(warnings.length).toBe(10);
    expect(warnings[0].text).toBe(
      "Invalid component name: '.badcomponent' (rscss/class-format)"
    );
    expect(warnings[1].text).toBe(
      "Invalid component name: '.badcomponent.-xyz' (rscss/class-format)"
    );
    expect(warnings[2].text).toBe(
      "Invalid component name: '.badcomponent.-abc' (rscss/class-format)"
    );
    expect(warnings[3].text).toBe(
      "Only one component name is allowed: '.too-many.component-names' (rscss/class-format)"
    );
    expect(warnings[4].text).toBe(
      "Invalid helper name: '._badhelper.-variant' (rscss/class-format)"
    );
    expect(warnings[5].text).toBe(
      "Invalid helper name: '._badhelper.element' (rscss/class-format)"
    );
    expect(warnings[6].text).toBe(
      "Invalid element name: '.bad_element' (rscss/class-format)"
    );
    expect(warnings[7].text).toBe(
      "Invalid variant name: '.badvariant' (rscss/class-format)"
    );
    expect(warnings[8].text).toBe(
      "Invalid element name: '.bad_nesting' (rscss/class-format)"
    );
    expect(warnings[9].text).toBe(
      "Variant has no element: '.-badvariant' (rscss/class-format)"
    );
  });

  test("pascal case", async () => {
    const result = await stylelint.lint({
      files: [fixture("class_format-react.css")],
      config: {
        extends: "./config",
        rules: {
          "rscss/class-format": [true, { component: "pascal-case" }],
        },
      },
    });
    const warnings = result.results[0].warnings;

    expect(warnings.length).toBe(3);
    expect(warnings[0].text).toBe(
      "Invalid component name: '.bad-component' (rscss/class-format)"
    );
    expect(warnings[1].text).toBe(
      "Invalid component name: '.bad-component.-xyz' (rscss/class-format)"
    );
    expect(warnings[2].text).toBe(
      "Invalid component name: '.bad-component.-abc' (rscss/class-format)"
    );
  });

  test("custom case", async () => {
    const result = await stylelint.lint({
      files: [fixture("class_format-react.css")],
      config: {
        extends: "./config",
        rules: {
          "rscss/class-format": [true, { component: "^([A-Z][a-z0-9]*)+$" }],
        },
      },
    });
    const warnings = result.results[0].warnings;

    expect(warnings.length).toBe(3);
    expect(warnings[0].text).toBe(
      "Invalid component name: '.bad-component' (rscss/class-format)"
    );
    expect(warnings[1].text).toBe(
      "Invalid component name: '.bad-component.-xyz' (rscss/class-format)"
    );
    expect(warnings[2].text).toBe(
      "Invalid component name: '.bad-component.-abc' (rscss/class-format)"
    );
  });

  test("depth", async () => {
    const result = await stylelint.lint({
      files: [fixture("class_format-depth.css")],
    });
    const warnings = result.results[0].warnings;

    expect(warnings.length).toBe(1);
    expect(warnings[0].text).toBe(
      "Component too deep: '.my-component > .ok > .ok > .ok > .bad' (rscss/class-format)"
    );
  });

  test("whitelist", async () => {
    const result = await stylelint.lint({
      files: [fixture("class_format-whitelist.css")],
    });
    const warnings = result.results[0].warnings;

    expect(warnings.length).toBe(1);
    expect(warnings[0].text).toBe(
      "Invalid variant name: '.bad' (rscss/class-format)"
    );
  });
});

const fixture = (path: string) => join(__dirname, "../fixtures", path);
