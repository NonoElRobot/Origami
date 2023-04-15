/**
 * Rabbit Ear (c) Kraft
 */
// [1, 2, 3], ["a", "b", "c"], ["$", "%", "&"]
// 1a$, 1a%, 1a&
// 1b$, 1b%, 1b&
// 1c$, 1c%, 1c&
// 2a$, 2a%, 2a&
// ... (27 total)
/**
 * @param {any[][]} arrayOfArrays two-level nested array containing any type
 */
const matchHolistic = (arrayOfArrays) => {
	const lengths = arrayOfArrays.map(part => part.length);
	const compounding = lengths.slice();
	for (let i = compounding.length - 2; i >= 0; i -= 1) {
		compounding[i] *= compounding[i + 1];
	}
	if (compounding[0] > (2 ** 28)) {
		console.warn("allSolutions() might fail: too many");
	}
	const scales = compounding.slice();
	scales.push(1);
	scales.shift();
	return Array.from(Array(compounding[0]))
		.map((_, i) => i)
		.map(i => scales
			.map((d, j) => Math.floor(i / d) % lengths[j]));
};
/**
 *
 */
const allSolutions = (n, ...orders) => {
	const ordersSoFar = n.orders ? [...orders, n.orders] : [...orders];
	// partition node
	if (n.partitions) {
		const parts = n.partitions.map(el => allSolutions(el));
		const combinations = matchHolistic(parts);
		return combinations
			.map(indices => indices.flatMap((i, j) => parts[j][i]))
			.map(solution => [...ordersSoFar, ...solution]);
	}
	// not a partition node
	// get all solutions from all combined recursive branching
	const solutions = [];
	if (n.leaves) {
		n.leaves.forEach(order => solutions.push([...ordersSoFar, order]));
	}
	if (n.node) {
		const branches = n.node
			.flatMap(el => allSolutions(el, ...ordersSoFar));
		solutions.push(...branches);
	}
	if (!n.leaves && !n.node) { solutions.push([...ordersSoFar]); }
	return solutions;
};
/**
 *
 */
const anySolution = (n) => {
	return n.orders ? n.orders : [];
	const nodeOrders = n.orders ? n.orders : [];
	// partition node
	if (n.partitions) {
		return [...nodeOrders, ...n.partitions.flatMap(el => anySolution(el))];
	}
	// not a partition node
	// get all solutions from all combined recursive branching
	if (n.leaves) { return [...nodeOrders, ...n.leaves[0]]; }
	if (n.node) { return [...nodeOrders, ...anySolution(n.node[0])]; }
	// no leaves or node (the root node / one solution only)
	return nodeOrders;
};
// const anySolution = (n) => {
// 	const nodeOrders = n.orders ? n.orders : [];
// 	// partition node
// 	if (n.partitions) {
// 		return [...nodeOrders, ...n.partitions.map(el => anySolution(el))];
// 	}
// 	// not a partition node
// 	// get all solutions from all combined recursive branching
// 	if (n.leaves) { return [...nodeOrders, ...n.leaves[n.leaves.length - 1]]; }
// 	if (n.node) { return [...nodeOrders, ...anySolution(n.node[n.node.length - 1])]; }
// 	// no leaves or node (the root node / one solution only)
// 	return nodeOrders;
// };
/**
 *
 */
const LayerPrototype = {
	// anySolution: function () {
	// 	return this.groups.flatMap(group => anySolution(group));
	// },
	anySolution: function () { return anySolution(this); },
	// allSolutions: function () {
	// 	if (!this.allSolutionsMemo) {
	// 		this.allSolutionsMemo = this.groups
	// 			.map(group => allSolutions(group));
	// 	}
	// 	return this.allSolutionsMemo;
	// },
	allSolutions: function () {
		if (!this.allSolutionsMemo) {
			this.allSolutionsMemo = allSolutions(this);
		}
		return this.allSolutionsMemo;
	},
	/**
	 * @description For every branch, get the total number of states.
	 * @returns {number[]} the total number of states in each branch.
	 * @linkcode Origami ./src/layer/solver3d/prototype.js 101
	 */
	// count: function () {
	// 	return this.allSolutions().map(solution => solution.length);
	// },
	count: function () { return this.allSolutions().length; },
	/**
	 * @description Get one complete layer solution by merging the
	 * root solution with one state from each branch.
	 * @param {number[]} ...indices optionally specify which state from
	 * each branch, otherwise this will return index 0 from each branch.
	 * @returns {object} an object with space-separated face pair keys, with
	 * a value of +1 or -1, indicating the stacking order between the pair.
	 * @linkcode Origami ./src/layer/solver3d/prototype.js 114
	 */
	// solution: function (groupIndices = []) {
	// 	const solutions = this.allSolutions();
	// 	const indices = Array(solutions.length)
	// 		.fill(0)
	// 		.map((n, i) => (groupIndices[i] != null ? groupIndices[i] : n));
	// 	return solutions
	// 		.flatMap((solution, i) => solution[indices[i]].flat());
	// },
};

export default LayerPrototype;
