import { defineConfig } from "tsdown";

export default defineConfig({
	entry: ["lib/index.ts", "lib/config.ts"],
	format: ["esm"],
	dts: true,
	clean: true,
	target: false,
});
