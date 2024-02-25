/**
 * Rabbit Ear (c) Kraft
 */
import {
	makeEdgesFacesUnsorted,
	makeFacesFaces,
} from "../make.js";
import {
	splitCircularArray,
	splitArrayWithLeaf,
	makeVerticesToEdgeLookup,
	makeVerticesToFacesLookup,
	makeEdgesToFacesLookup,
} from "./general.js";
import remove from "../remove.js";

/**
 * @description Update vertices_vertices for two vertices, following
 * a new edge having just been made to connect the pair of vertices.
 * These vertices are both members of the same face, whose faces_vertices
 * was just updated.
 * @param {FOLD} graph a FOLD object
 * @param {number} face the index of the face containing these two vertices
 * @param {number[]} vertices the two vertices newly connected by an edge
*/
const updateVerticesVertices = (
	{ vertices_vertices, faces_vertices },
	face,
	vertices,
) => {
	if (!vertices_vertices) { return; }

	//    (4)     ___---O.  (3)
	//        O---         \.
	//       /   .            O  (2)
	//      /       .        /
	//  (0) O____      .   /
	//           ----____O  (1)
	const face_vertices = faces_vertices[face];

	// for each vertex, the index of this vertex inside face_vertices
	const verticesFaceIndex = vertices
		.map(vertex => face_vertices.indexOf(vertex));

	// for each vertex, the index of the previous and next vertex inside
	// face_vertices, where "next/prev" refers to the counter-clockwise order.
	const verticesPrevFaceIndex = verticesFaceIndex
		.map(i => (i + face_vertices.length - 1) % face_vertices.length);
	const verticesNextFaceIndex = verticesFaceIndex
		.map(i => (i + 1) % face_vertices.length);

	// for each vertex, for each previous and next location inside
	// face_vertices, get the vertex at that location.
	const verticesPrevFaceVertex = verticesPrevFaceIndex
		.map(i => face_vertices[i]);
	const verticesNextFaceVertex = verticesNextFaceIndex
		.map(i => face_vertices[i]);

	// for each vertex, for each previous and next vertex inside faces_vertices,
	// get the index of that vertex in this vertex's vertices_vertices
	const verticesVerticesPrevIndex = vertices
		.map((v, i) => vertices_vertices[v].indexOf(verticesPrevFaceVertex[i]));
	const verticesVerticesNextIndex = vertices
		.map((v, i) => vertices_vertices[v].indexOf(verticesNextFaceVertex[i]));

	// all windings are counter clockwise. the "next" vertex in a face winding,
	// when rotating around in the vertices_vertices array, becomes the "previous"
	// index to the splice point. (feels a bit backwards).
	const verticesVerticesSpliceIndex = vertices
		.map((v, i) => (verticesVerticesNextIndex[i] + 1) % vertices_vertices[v].length);

	// We can do a sanity check. the splice point in vertices_vertices should be
	// exactly between "next" and "previous" in that order (the splice index
	// should be the "prev" index).
	const isValid = vertices
		.map((_, i) => (verticesVerticesSpliceIndex[i] !== -1
			&& verticesVerticesSpliceIndex[i] === verticesVerticesPrevIndex[i]))
		.reduce((a, b) => a && b, true);

	if (!isValid) {
		throw new Error(`splitFace() vertices_vertices ${vertices.join(", ")} bad face ${face}`);
	}

	// gather the splice index and the value to be spliced in an object, sort the
	// objects in reverse order of the splice index so that when we splice,
	// we aren't affecting the latter portion of the array in a detrimental way.
	verticesVerticesSpliceIndex.forEach((index, i) => {
		const otherVertex = vertices[(i + 1) % vertices.length];
		vertices_vertices[vertices[i]].splice(index, 0, otherVertex);
	});
};

/**
 * @description Update vertices_vertices for two vertices, following
 * a new edge having just been made to connect the pair of vertices.
 * These vertices are both members of the same face, whose faces_vertices
 * was just updated.
 * @param {FOLD} graph a FOLD object
 * @param {number} face the index of the face containing these two vertices
 * @param {number[]} faces the index of the new faces
 * @param {number[]} vertices the two vertices newly connected by an edge
*/
// const updateVerticesVerticesNonSimple = (
// 	{ vertices_vertices, faces_vertices },
// 	face,
// 	faces,
// 	vertices,
// ) => {
// 	if (!vertices_vertices) { return; }
// 	//
// 	//    (4)     ___---O.  (3)                (3)     ___---O.  (2)
// 	//        O---         \.                      O---         \.
// 	//       /   .            O  (2)              /   .   (6) O    O  (1)
// 	//      /       .        /                   /       .    |   /
// 	//  (0) O____      .   /                 (4) O____      . | /
// 	//           ----____O  (1)                       ----____O  (5)(0)
// 	// old face. dots are the new edge.
// 	//
// 	// to prevent the situation on the right, where it's unclear which face
// 	// the leaf edge is associated with, technically it doesn't matter, but
// 	// consistency matters, whichever face in faces_vertices took the leaf edge,
// 	// we need vertices_vertices to match in order, on which side of the new edge
// 	// such a leaf edge will lie.
// 	//
// 	// the best solution, I think, is to use the newly created faces_vertices.
// 	// we only need to consider one face.

// 	// const face_vertices = faces_vertices[face];
// 	const face_vertices = faces_vertices[faces[0]];

// 	// for each vertex, the index of this vertex inside face_vertices
// 	const verticesFaceIndex = vertices
// 		.map(vertex => face_vertices.indexOf(vertex));
// };

/**
 * @description We are building a new edge between these two vertices.
 * Update vertices_edges, having just updated vertices_vertices.
 * @param {FOLD} graph a FOLD object
 * @param {number[]} vertices two vertex indices
 * @param {number} edge an edge index
 */
const updateVerticesEdges = (
	{ vertices_edges, vertices_vertices },
	vertices,
	edge,
) => {
	if (!vertices_edges) { return; }

	// vertices_vertices does not exist, create an unsorted solution.
	if (!vertices_vertices) {
		vertices.forEach((v) => vertices_edges[v].push(edge));
		return;
	}

	// for each of the two vertices, check its vertices_vertices for the
	// index of the opposite vertex. this is the edge. return its position
	// in the vertices_vertices to be used to insert into vertices_edges.
	const spliceIndices = vertices
		.map((v, i, arr) => vertices_vertices[v].indexOf(arr[(i + 1) % arr.length]));

	if (spliceIndices.some(i => i === -1)) {
		throw new Error(`splitFace() vertices_edges ${vertices.join(", ")}`);
	}

	// vvIndex is an index inside vertices_edges (or vertices_vertices)
	// splice the new edge so that it gets inserted before the
	// edge at the current index
	spliceIndices.forEach((index, i) => {
		vertices_edges[vertices[i]].splice(index, 0, edge);
	});
};

/**
 * @description In the case where we are building two new faces in place of
 * an old face, construct new faces_edges for the new faces by consulting
 * the newly created faces_vertices for each face. Do this by gathering all
 * edges involved (from the old face's faces_edges, and the new edge), create
 * a vertex-pair to edge lookup, then convert faces_vertices to faces_edges.
 * @param {FOLD} graph a FOLD object
 * @param {number} face the index of the face being replaced
 * @param {number[]} faces a list of faces which will replace the old face
 * @param {number} edge the new edge index
 */
const updateFacesEdges = (
	{ edges_vertices, faces_vertices, faces_edges },
	face,
	faces,
	edge,
) => {
	if (!faces_edges) { return; }

	// create a reverse lookup, pairs of vertices to an edge.
	const verticesToEdge = makeVerticesToEdgeLookup(
		{ edges_vertices },
		[...faces_edges[face], edge],
	);

	// simply rebuild the faces_edges in question using the vertices-edge lookup
	const newFacesEdges = faces.map((f) =>
		faces_vertices[f]
			.map((fv, i, arr) => `${fv} ${arr[(i + 1) % arr.length]}`)
			.map((key) => verticesToEdge[key]),
	);

	if (newFacesEdges.flat().some(e => e === undefined)) {
		throw new Error(`splitFace() faces_edges ${face}`);
	}

	faces.forEach((f, i) => { faces_edges[f] = newFacesEdges[i]; });
};

/**
 * @description search inside vertices_faces for an occurence
 * of the removed face, determine which of our two new faces
 * needs to be put in its place by checking faces_vertices
 * by way of this map we build at the beginning.
 * @param {FOLD} graph a FOLD object
 * @param {number} face the index of the face being replaced
 * @param {number[]} faces a list of faces which will replace the old face
 */
const updateVerticesFaces = (
	{ vertices_vertices, vertices_faces, faces_vertices },
	face,
	faces,
) => {
	if (!vertices_faces || !faces_vertices) { return; }

	// a lookup that pairs every vertex (involved in these faces) to all of its
	// adjacent faces, where only the subset of "faces" is considered.
	// we will use this lookup to replace the old face index with new face(s).
	const vertexReplacementFaces = makeVerticesToFacesLookup(
		{ faces_vertices },
		faces,
	);

	// todo:
	// if vertices_vertices exists, for those vertice which contain two faces,
	// we need to sort them according to the vertices_vertices order.


	// a list of all vertices that are involved in these faces, each of these
	// will need new face(s) to replace the old face index.
	const vertices = Array.from(new Set(
		faces.flatMap((face) => faces_vertices[face]),
	));

	// initially, get the index of our old face in the current vertices_faces.
	// if an indexOf is -1, it's not necessarily a failure, a new vertex will not
	// yet have an entry and can be built from scratch.
	const verticesOldFaceIndex = vertices
		.map((v) => vertices_faces[v].indexOf(face));

	// otherwise
	verticesOldFaceIndex.forEach((index, i) => {
		const vertex = vertices[i];
		// if no instance of oldFace ever existed in this vertex's vertices_faces
		// then it's likely a new vertex, and we can simply add the faces.
		if (index === -1) {
			vertices_faces[vertex].push(...vertexReplacementFaces[vertex]);
			return;
		}

		// if the old face exists, start a while loop where we replace every
		// instance of the old face with whichever face(s) is to take its place.
		// it's not impossible for the old face to appear twice, this ensure that
		// every instance of it will be removed.
		let match = index;
		while(match !== -1) {
			vertices_faces[vertex]
				.splice(match, 1, ...vertexReplacementFaces[vertex]);
			match = vertices_faces[vertex].indexOf(face);
		}
	});
};

/**
 * @description called near the end of the split_convex_face method.
 * update the "edges_faces" array for every edge involved.
 * figure out where the old_face's index is in each edges_faces array,
 * figure out which of the new faces (or both) need to be added and
 * substitute the old index with the new face's index/indices.
 * @param {FOLD} graph a FOLD object
 * @param {number} face the index of the face being replaced
 * @param {number[]} faces a list of faces which will replace the old face
 * @param {number} edge the new edge index
 */
const updateEdgesFaces = (
	{ edges_vertices, faces_vertices, edges_faces, faces_edges },
	face,
	faces,
	edge,
) => {
	if (!edges_faces) { return; }

	// this is a unique situation, we require an array to be built but we are
	// missing the source data. the number of times this branch is reached will
	// be so few, it's possible to simply call the entire rebuild method.
	if (!faces_edges) {
		edges_faces.forEach((_, i) => delete edges_faces[i]);
		Object.assign(
			edges_faces,
			makeEdgesFacesUnsorted({ edges_vertices, faces_vertices, faces_edges }),
		);
		return;
	}

	const facesHash = {};
	[...faces, face].forEach(f => { facesHash[f] = true; });

	const edges = Array.from(new Set(faces.flatMap(f => faces_edges[f])));

	const edgesOtherFaces = [];
	edges.forEach(e => {
		edgesOtherFaces[e] = edges_faces[e].filter(f => !facesHash[f]);
	});

	const edgesTheseFaces = [];
	edges.forEach(e => { edgesTheseFaces[e] = []; });
	faces.forEach(f => faces_edges[f]
		.forEach(e => edgesTheseFaces[e].push(f)));

	edges.forEach(e => {
		edges_faces[e] = Array.from(new Set(
			[...edgesTheseFaces[e], ...edgesOtherFaces[e]],
		));
	});

	edges_faces[edge] = [...faces];

	// // for every edge involved, get a list of their edges_faces that are not
	// // one of the new faces, or old face.
	// // we will build the list of new face(s) for these edges and add them to
	// const edgesNewFace = {};
	// newFaces.forEach(f => faces_edges[f]
	// 	.forEach(edge => { edgesNewFace[edge] = f; }));
	// Object.keys(edgesNewFace).forEach(edge => {
	// 	const index = edges_faces[edge].indexOf(face);
	// 	if (index === -1) { return; }
	// 	edges_faces[edge].splice(index, 1, faces[edge]);
	// });
	// edges_faces[newEdge] = [...faces];
};

/**
 * @description one face was removed and one or two faces put in its place.
 * regarding the faces_faces array, updates need to be made to the two
 * new faces, as well as all the previously neighboring faces of
 * the removed face.
 * @param {FOLD} graph a FOLD object
 * @param {number[]} faces a list of faces which will replace the old face
 */
const updateFacesFaces = ({ faces_vertices, faces_faces }, faces) => {
	if (!faces_faces) { return; }
	const newFacesFaces = makeFacesFaces({ faces_vertices });
	faces.forEach(f => { faces_faces[f] = newFacesFaces[f]; });
};

// const updateFacesFaces = (
// 	{ edges_vertices, faces_vertices, faces_edges, faces_faces },
// 	oldFace,
// 	faces,
// ) => {
// 	if (!faces_faces) { return; }

// 	// initialize the new faces' faces_faces to a copy of the old face's array
// 	faces
// 		.filter(f => !faces_faces[f])
// 		.forEach(f => { faces_faces[f] = [...faces_faces[oldFace]]; });

// 	const allFaces = uniqueElements([...faces_faces[oldFace], ...faces]);

// 	// in the case that faces_edges is built and built for the new faces,
// 	// loop through all faces' faces_faces, searching for an occurrence of
// 	// the old face's index, and replace that index with the face that
// 	if (faces_edges) {
// 		const edgesToFaces = makeEdgesToFacesLookup({ faces_edges }, faces);
// 		allFaces.forEach(face => {
// 			faces_faces[face]
// 		});
// 		return;
// 	}

// 	const allVertices = uniqueElements(allFaces
// 		.flatMap(face => faces_vertices[face]));

// 	const verticesToFaces = makeVerticesToFacesLookup(
// 		{ faces_vertices },
// 		faces,
// 	);

// 	for every adjacent face to one of the new or old faces
// 	const facesNewFace = {};
// 	faces_faces[oldFace].forEach(j => { facesNewFace[j] = oldFace; });
// 	newFaces.forEach(i => faces_faces[i].forEach(j => { facesNewFace[j] = i; }));

// 	Object.keys(facesNewFace).forEach(face => {
// 		const index = faces_faces[face].indexOf(oldFace);
// 		if (index === -1) { return; }
// 		faces_faces[face].splice(index, 1, newFaces[face]);
// 	});
// 	newFaces.forEach((face, i, arr) => {
// 		const otherFace = arr[(i + 1) % arr.length];
// 		faces_faces[face] = [...faces_faces[oldFace], otherFace];
// 	});
// };

/**
 * @description This is the subroutine of splitFace where an edge has been
 * added between two vertices of a face.
 * @param {FOLD} graph a FOLD object
 * @param {number} face the index of the face we are replacing
 * @param {number} edge the index of the new edge
 * @param {number[]} vertices the new edge's two vertices
 */
const splitFaceWithEdge = (graph, face, edge, vertices) => {
	// create two new faces's faces_vertices and add them to the end of the graph.
	// the current face will be deleted at the end of this method and all indices
	// will be shifted up to take its place.
	// this variable will hold the new faces' indices.
	const faces = splitCircularArray(
		graph.faces_vertices[face],
		vertices.map(vertex => graph.faces_vertices[face].indexOf(vertex)),
	).map((face_vertices) => {
		graph.faces_vertices.push(face_vertices);
		return graph.faces_vertices.length - 1;
	});

	// update all changes to vertices and edges (anything other than faces).
	updateVerticesVertices(graph, face, vertices);
	updateVerticesEdges(graph, vertices, edge);
	updateFacesEdges(graph, face, faces, edge);
	updateVerticesFaces(graph, face, faces);
	updateEdgesFaces(graph, face, faces, edge);
	updateFacesFaces(graph, face, faces);

	// remove old data
	const faceMap = remove(graph, "faces", [face]);

	// the graph is now complete, however our return object needs updating.
	// shift our new face indices since these relate to the graph before remove().
	faces.forEach((_, i) => {
		faces[i] = faceMap[faces[i]];
	});

	// we had to run "remove" with the new faces added. to return the change info,
	// we need to adjust the map to exclude these faces.
	faceMap.splice(-2);

	// replace the "undefined" in the map with the new faces
	faceMap[face] = faces;

	return {
		edge,
		faces: {
			map: faceMap,
			new: faces,
			remove: face,
		},
	};
};

/**
 * @description
 * @param {FOLD} graph a FOLD object
 * @param {number} face the index of the face to be modified
 * @param {number} edge the index of the new edge
 * @param {number[]} vertices the new edge's two vertices
 */
// const cutFaceWithLeafEdge = (graph, face, edge, vertices) => {
// 	// search the existing face's faces_vertices for each of the vertices
// 	const verticesAndIndices = vertices
// 		.map(vertex => ({ vertex, index: faces_vertices[face].indexOf(vertex) }));

// 	graph.faces_vertices[face] = splitArrayWithLeaf(
// 		graph.faces_vertices[face],
// 		verticesAndIndices.filter(({ index }) => index !== -1).map((el) => el.index).shift(),
// 		verticesAndIndices.filter(({ index }) => index === -1).map((el) => el.vertex).shift(),
// 	);

// 	// update all changes to vertices and edges (anything other than faces).
// 	updateVerticesVerticesLeaf(graph, vertices);
// 	updateVerticesEdges(graph, vertices, edge);
// 	updateFacesEdges(graph, face, faces, edge);
// 	updateVerticesFaces(graph, face, faces);
// 	updateEdgesFaces(graph, face, faces, edge);
// 	updateFacesFaces(graph, face, faces);

// 	return { edge, faces: {} };
// };

/**
 * @description Split a face in a graph with a new edge between two vertices,
 * where one or two of these vertices is already a part of the face's
 * faces_vertices. This method will have a different result depending on the
 * number of vertices of the new edge which are a part of the face:
 * - 0: this method will create an edge, unassociated with any faces,
 *      no faces will be modified and the method will return early.
 * - 1: this method will create a face with an edge that doubles back on itself.
 * - 2: this method will create two new faces, split by an edge, as long as
 *      these two new edge vertices are not already an edge on the face's boundary
 * This method will create no new vertices, one new edge, and will replace
 * the face with either one or two new face(s).
 * New edges will be added to the end of the arrays, so all old edge
 * indices will still relate. Face indices will be more heavily modified.
 * @param {FOLD} graph a FOLD object, modified in place
 * @param {number} face index of face to split
 * @param {number[]} vertices the vertices which will create a new edge
 * @param {string} [assignment="U"] the assignment of the new edge
 * @param {number} [foldAngle=0] the fold angle of the new edge
 * @returns {object} a summary of changes to the FOLD object
 * @linkcode
 */
export const splitFaceWithVertices = (
	graph,
	face,
	vertices,
	assignment = "U",
	foldAngle = 0,
) => {
	if (!graph.vertices_coords || !graph.edges_vertices) { return {}; }
	if (vertices.length !== 2) { return {}; }
	if (!graph.faces_vertices) { return {}; }

	// this method will work fine with non-convex polygons, but if a face
	// contains a leaf edge, where the sequence of vertices visits the same
	// vertex more than once, this method will fail. don't proceed.
	const isSimple = (Array.from(new Set(graph.faces_vertices[face])).length
		=== graph.faces_vertices[face].length);
	if (!isSimple) { return {}; }

	// ensure that the two vertices are not next to each other in
	// the current face's faces_vertices vertices list.
	const edgeAlreadyExists = graph.faces_vertices[face]
		.map((v, i, arr) => [v, arr[(i + 1) % arr.length]])
		.map(([v0, v1]) => (v0 === vertices[0] && v1 === vertices[1])
			|| (v0 === vertices[1] && v1 === vertices[0]))
		.reduce((a, b) => a || b, false);
	if (edgeAlreadyExists) { return {}; }

	// the index of our new edge
	const edge = graph.edges_vertices.length;

	// construct data for our new edge (vertices, assignent, foldAngle...)
	// and the entry for edges_faces will be [x, x] where x is the index of
	// the old face, twice, and will be replaced later in this function.
	const edgeAttributes = {
		edges_vertices: vertices,
		edges_assignment: assignment,
		edges_foldAngle: foldAngle,
		edges_faces: [face, face],
	};

	// ignoring any keys that aren't a part of our graph, add the new edge
	Object.keys(edgeAttributes)
		.filter((key) => graph[key])
		.forEach((key) => {
			graph[key][edge] = edgeAttributes[key];
		});

	// search the existing face's faces_vertices for each of the vertices
	const matchCount = vertices
		.map(v => graph.faces_vertices[face].indexOf(v))
		.filter(a => a !== -1)
		.length;

	// create 0, 1, or 2 new faces_vertices entries. This also determines
	// how many faces we will be dealing with for the remainder of this method.
	// The difference in the number of faces (0, 1, or 2) is determined by
	// the arrangement of the vertices, whether or not the vertices are already
	// included in the existing face's faces_vertices array, or are one or more
	// of the vertices isolated?
	switch (matchCount) {
		case 1: return cutFaceWithLeafEdge(graph, face, edge, vertices);
		case 2: return splitFaceWithEdge(graph, face, edge, vertices);
		default: return { edge, faces: {} };
	}
};
