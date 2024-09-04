import _plugins from "../index.mjs";

export const plugins = _plugins;

export const rules = {
  "rscss/no-descendant-combinator": "always",
  "rscss/class-format": [
    true,
    {
      componentWhitelist: [
        // These are Bootstrap classes that are typically extended as RSCSS components.
        // These exceptions would be useful in projects that use RSCSS in Bootstrap sites.
        "btn",
        "container",
        "checkbox",
        "radio",
      ],
    },
  ],
};
