/*
 * @internal
 * split by a function
 */
export const splitBy = <T>(
	list: T[],
	fn: (item: T, idx: number) => boolean,
): T[][] => {
	const result = [];
	let section: T[] = [];

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
