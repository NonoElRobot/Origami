import { make_edges_coords_min_max_inclusive } from "./make";
/**
 * contains methods for fast-approximating if geometry overlaps.
 * for example testing if edge's rectangular bounding boxes overlap.
 *
 * @returns {number[][]} array matching edges_ length where each value is
 * an array matching vertices_ length, containing true/false, answering
 * the question "does this vertex sit inside the edge's bounding rectangle?"
 */
export const get_edges_vertices_span = (graph, epsilon = math.core.EPSILON) =>
  make_edges_coords_min_max_inclusive(graph)
    .map((min_max, e) => graph.vertices_coords
      .map((vert, v) => (
        vert[0] > min_max[0][0] - epsilon &&
        vert[1] > min_max[0][1] - epsilon &&
        vert[0] < min_max[1][0] + epsilon &&
        vert[1] < min_max[1][1] + epsilon)));
/**
 * part of an algorithm for segment-segment intersection
 * this answers if it's possible that lines *might* overlap
 * by testing if their rectangular bounding boxes overlap.
 *
 * @returns NxN 2d array filled with true/false answering "do edges overlap
 * in their rectangular bounding boxes?" 
 * The main diagonal contains true. both triangles of the matrix are filled.
 *     0  1  2  3
 * 0 [ t,  ,  ,  ]
 * 1 [  , t,  ,  ]
 * 2 [  ,  , t,  ]
 * 3 [  ,  ,  , t]
 */
export const get_edges_edges_span = ({ vertices_coords, edges_vertices, edges_coords }, epsilon = math.core.EPSILON) => {
  const min_max = make_edges_coords_min_max_inclusive({ vertices_coords, edges_vertices, edges_coords }, epsilon);
  const span_overlaps = edges_vertices.map(() => []);
  // span_overlaps will be false if no overlap possible, true if overlap is possible.
  for (let e0 = 0; e0 < edges_vertices.length - 1; e0 += 1) {
    for (let e1 = e0 + 1; e1 < edges_vertices.length; e1 += 1) {
      // if first max is less than second min, or second max is less than first min,
      // for both X and Y
      const outside_of = 
        (min_max[e0][1][0] < min_max[e1][0][0] || min_max[e1][1][0] < min_max[e0][0][0])
      &&(min_max[e0][1][1] < min_max[e1][0][1] || min_max[e1][1][1] < min_max[e0][0][1]);
      // true if the spans are not touching. flip for overlap
      span_overlaps[e0][e1] = !outside_of;
      span_overlaps[e1][e0] = !outside_of;
    }
  }
  for (let i = 0; i < edges_vertices.length; i += 1) {
    span_overlaps[i][i] = true;
  }
  return span_overlaps;
};
