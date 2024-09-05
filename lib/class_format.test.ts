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

describe("basic class format", () => {
	testRule({
		ruleName: "rscss/class-format",
		config: [true],

		accept: [
			{ code: ".good-component { }" },
			{ code: ".good-component.-xyz { }" },
			{ code: ".good-component.-no-xyz { }" },
			{ code: "p { }" },
			{ code: `[aria-hidden="true"] { }` },
			{ code: "._helper { }" },
			{ code: "._helper._helper { }" },
			{ code: ".my-component > .element { }" },
			{ code: ".my-component > .element > .element2 { }" },
			{ code: ".my-component > .ok { }" },
			{ code: ".my-component + .my-component { }" },
			{ code: ".my-component > a.-home { }" },
		],
		reject: [
			{
				code: ".badcomponent { }",
				message: "Invalid component name: '.badcomponent' (rscss/class-format)",
			},
			{
				code: ".badcomponent.-xyz { }",
				message:
					"Invalid component name: '.badcomponent.-xyz' (rscss/class-format)",
			},
			{
				code: ".badcomponent.-abc > .xyz { }",
				message:
					"Invalid component name: '.badcomponent.-abc' (rscss/class-format)",
			},
			{
				code: ".too-many.component-names { }",
				message:
					"Only one component name is allowed: '.too-many.component-names' (rscss/class-format)",
			},
			{
				code: "._badhelper.-variant { }",
				message:
					"Invalid helper name: '._badhelper.-variant' (rscss/class-format)",
			},
			{
				code: "._badhelper.element { }",
				message:
					"Invalid helper name: '._badhelper.element' (rscss/class-format)",
			},
			{
				code: ".my-component > .bad_element { }",
				message: "Invalid element name: '.bad_element' (rscss/class-format)",
			},
			{
				code: ".my-component > .element.badvariant { }",
				message: "Invalid variant name: '.badvariant' (rscss/class-format)",
			},
			{
				code: ".my-component > .bad_nesting { }",
				message: "Invalid element name: '.bad_nesting' (rscss/class-format)",
			},
			{
				code: ".my-component > .-badvariant { }",
				message: "Variant has no element: '.-badvariant' (rscss/class-format)",
			},
		],
	});
});

describe("pascal case", () => {
	testRule({
		ruleName: "rscss/class-format",
		config: [true, { component: "pascal-case" }],

		accept: [
			{ code: ".GoodComponent { }" },
			{ code: ".GoodComponent.-xyz { }" },
			{ code: ".GoodComponent.-no-xyz { }" },
		],
		reject: [
			{
				code: ".badComponent { }",
				message: "Invalid component name: '.badComponent' (rscss/class-format)",
			},
			{
				code: ".badComponent.-xyz { }",
				message:
					"Invalid component name: '.badComponent.-xyz' (rscss/class-format)",
			},
			{
				code: ".badComponent.-abc > .xyz { }",
				message:
					"Invalid component name: '.badComponent.-abc' (rscss/class-format)",
			},
		],
	});
});

describe("custom format", () => {
	testRule({
		ruleName: "rscss/class-format",
		config: [true, { component: "^([A-Z][a-z0-9]*)+$" }],

		accept: [
			{ code: ".GoodComponent { }" },
			{ code: ".GoodComponent.-xyz { }" },
			{ code: ".GoodComponent.-no-xyz { }" },
		],
		reject: [
			{
				code: ".badComponent { }",
				message: "Invalid component name: '.badComponent' (rscss/class-format)",
			},
			{
				code: ".badComponent.-xyz { }",
				message:
					"Invalid component name: '.badComponent.-xyz' (rscss/class-format)",
			},
			{
				code: ".badComponent.-abc > .xyz { }",
				message:
					"Invalid component name: '.badComponent.-abc' (rscss/class-format)",
			},
		],
	});
});

describe("depth", () => {
	testRule({
		ruleName: "rscss/class-format",
		config: [true],

		accept: [
			{ code: ".my-component > .ok { }" },
			{ code: ".my-component > .ok > .ok { }" },
			{ code: ".my-component > .ok > .ok > .ok { }" },
		],
		reject: [
			{
				code: ".my-component > .ok > .ok > .ok > .bad { }",
				message:
					"Component too deep: '.my-component > .ok > .ok > .ok > .bad' (rscss/class-format)",
			},
		],
	});
});

describe("whitelist", () => {
	testRule({
		ruleName: "rscss/class-format",
		config: [true, { componentWhitelist: ["btn"] }],

		accept: [{ code: ".btn > .lol { }" }, { code: ".btn.-variant { }" }],
		reject: [
			{
				code: ".btn.bad { }",
				message: "Invalid variant name: '.bad' (rscss/class-format)",
			},
		],
	});
});
