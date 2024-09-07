/*
 * @internal
 * split by a function
 */
export const splitBy = <T>(
	list: readonly T[],
	isSeparator: (item: T, idx: number) => boolean,
): T[][] => {
	const result: T[][] = [];
	let section: T[] = [];

	list.forEach((item, idx) => {
		if (isSeparator(item, idx)) {
			result.push(section);
			section = [];
		} else {
			section.push(item);
		}
	});

	if (section.length > 0) {
		result.push(section);
	}
	return result;
};
