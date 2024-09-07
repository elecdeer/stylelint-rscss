import { defineConfig } from "tsup";

export default defineConfig({
	entryPoints: ["lib/index.ts"],
	format: ["esm"],
	dts: true,
	clean: true,
});
