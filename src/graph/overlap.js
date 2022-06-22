/**
 * Rabbit Ear (c) Kraft
 */
import math from "../math";
import {
	makeEdgesVector,
	makeEdgesCoords,
	makeFacesPolygon,
} from "./make";
import { makeFacesWinding } from "./facesWinding";

export const makeEdgesFacesOverlap = ({ vertices_coords, edges_vertices, edges_vector, edges_faces, faces_edges, faces_vertices }, epsilon) => {
	if (!edges_vector) {
		edges_vector = makeEdgesVector({ vertices_coords, edges_vertices });
	}
	const faces_winding = makeFacesWinding({ vertices_coords, faces_vertices });
	// use graph vertices_coords for edges vertices
	const edges_origin = edges_vertices.map(verts => vertices_coords[verts[0]]);
	// convert parallel into NOT parallel.
	const matrix = edges_vertices
		.map(() => Array.from(Array(faces_vertices.length)));

	edges_faces.forEach((faces, e) => faces
		.forEach(f => { matrix[e][f] = false; }));

	const edges_vertices_coords = edges_vertices
		.map(verts => verts.map(v => vertices_coords[v]));
	const faces_vertices_coords = faces_vertices
		.map(verts => verts.map(v => vertices_coords[v]));
		// .map((polygon, f) => faces_winding[f] ? polygon : polygon.reverse());
	for (let f = 0; f < faces_winding.length; f++) {
		if (!faces_winding[f]) { faces_vertices_coords[f].reverse(); }
	}
	matrix.forEach((row, e) => row.forEach((val, f) => {
		if (val === false) { return; }
		// both segment endpoints, true if either one of them is inside the face.
		const point_in_poly = edges_vertices_coords[e]
			.map(point => math.core.overlapConvexPolygonPoint(
				faces_vertices_coords[f],
				point,
				math.core.exclude,
				epsilon
			)).reduce((a, b) => a || b, false);
		if (point_in_poly) { matrix[e][f] = true; return; }
		const edge_intersect = math.core.intersectConvexPolygonLine(
			faces_vertices_coords[f],
			edges_vector[e],
			edges_origin[e],
			math.core.excludeS,
			math.core.excludeS,
			epsilon
		);
		if (edge_intersect) { matrix[e][f] = true; return; }
		matrix[e][f] = false;
	}));
	return matrix;
};

// const makeFacesFacesOverlap = ({ vertices_coords, faces_vertices }, epsilon = math.core.EPSILON) => {
//   const matrix = Array.from(Array(faces_vertices.length))
//     .map(() => Array.from(Array(faces_vertices.length)));
//   const faces_polygon = makeFacesPolygon({ vertices_coords, faces_vertices }, epsilon);
//   for (let i = 0; i < faces_vertices.length - 1; i++) {
//     for (let j = i + 1; j < faces_vertices.length; j++) {
//       const intersection = math.core.intersect_polygon_polygon(
//         faces_polygon[i],
//         faces_polygon[j],
//         // math.core.exclude,
//         epsilon);
//       console.log("testing", faces_polygon[i], faces_polygon[j], intersection, epsilon);
//       const overlap = intersection.length !== 0;
//       matrix[i][j] = overlap;
//       matrix[j][i] = overlap;
//     }
//   }
//   return matrix;
// };
/**
 * @description compare every face to every face, do they overlap?
 * return the result in the form of a matrix, an array of arrays
 * of booleans, where both halves of the matrix are filled,
 * matrix[i][j] === matrix[j][i].
 */
export const makeFacesFacesOverlap = ({ vertices_coords, faces_vertices }, epsilon = math.core.EPSILON) => {
	const matrix = Array.from(Array(faces_vertices.length))
		.map(() => Array.from(Array(faces_vertices.length)));
	const faces_polygon = makeFacesPolygon({ vertices_coords, faces_vertices }, epsilon);
	for (let i = 0; i < faces_vertices.length - 1; i++) {
		for (let j = i + 1; j < faces_vertices.length; j++) {
			const overlap = math.core.overlapConvexPolygons(
				faces_polygon[i], faces_polygon[j], epsilon);
			matrix[i][j] = overlap;
			matrix[j][i] = overlap;
		}
	}
	return matrix;
};
