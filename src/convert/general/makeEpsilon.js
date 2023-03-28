/**
 * Rabbit Ear (c) Kraft
 */
import { boundingBox } from "../../graph/boundary.js";
import { distance } from "../../math/algebra/vector.js";

const shortestEdgeLength = (graph) => {
	const lengths = graph.edges_vertices
		.map(ev => ev.map(v => graph.vertices_coords[v]))
		.map(segment => distance(...segment));
	const minLen = lengths
		.reduce((a, b) => Math.min(a, b), Infinity);
	return minLen === Infinity ? undefined : minLen;
};

const makeEpsilon = (graph) => {
	const shortest = shortestEdgeLength(graph);
	if (shortest) { return shortest / 4; }
	const bounds = boundingBox(graph);
	return bounds && bounds.span
		? 1e-3 * Math.max(...bounds.span)
		: 1e-3;
};

export default makeEpsilon;
