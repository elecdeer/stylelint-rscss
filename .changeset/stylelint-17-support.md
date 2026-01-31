---
"@elecdeer/stylelint-rscss": major
---

Support Stylelint v17 and add CSS nesting support

**Breaking Changes:**
- Minimum required Node.js version is now 20.19.0
- Peer dependency now accepts both Stylelint v16.8.2+ and v17.0.0+
- Updated `postcss-selector-parser` to v7.1.1
- Updated `stylelint-scss` to v7.0.0

**New Features:**
- Added support for CSS native nesting syntax
- Enhanced test coverage for nested selectors with proper component/element/variant validation

**Dependency Updates:**
- `postcss`: ^8.4.45 → ^8.5.6
- `postcss-selector-parser`: ^6.1.2 → ^7.1.1
- `stylelint-scss`: ^6.5.1 → ^7.0.0
- `@types/node`: ^25.1.0 → ~20.19.30 (dev)
- `stylelint`: ^16.26.1 → ^17.1.0 (dev)
