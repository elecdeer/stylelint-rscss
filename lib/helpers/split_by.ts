import type parser from "postcss-selector-parser";

/*
 * @internal
 * split by a function
 */
const splitBy = (
	list: parser.Node[],
	fn: (item: parser.Node, idx: number) => boolean,
): parser.Node[][] => {
	const result = [];
	let section: parser.Node[] = [];

	list.forEach((item, idx) => {
		if (fn(item, idx)) {
			result.push(section);
			result.push(item);
			section = [];
		} else {
			section.push(item);
		}
	});

	result.push(section);
	return result;
};

export default splitBy;
