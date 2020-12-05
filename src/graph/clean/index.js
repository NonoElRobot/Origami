/**
 * Rabbit Ear (c) Robby Kraft
 */
import math from "../../math";
import {
  VERTICES,
  VERTICES_COORDS,
  EDGES
} from "../fold_keys";
import {
  get_graph_keys_with_suffix,
  get_graph_keys_with_prefix,
} from "../fold_spec";
import remove from "../remove";
import { get_isolated_vertices } from "./vertices_isolated";
import get_circular_edges from "./edges_circular";
import get_duplicate_edges from "./edges_duplicate";
import get_duplicate_vertices from "./vertices_duplicate";

// these are simple, removed component have no relationship to persisting components
// if components are removed, these return arrays with holes
export const remove_circular_edges = g => remove(g, EDGES, get_circular_edges(g));
export const remove_isolated_vertices = g => remove(g, VERTICES, get_isolated_vertices(g));

// every index is related to a component that persists in the graph.
// if components are removed, these return arrays WITHOUT holes.
export const remove_duplicate_edges = (graph) => {
  const duplicates = get_duplicate_edges(graph);
  const map = graph.edges_vertices.map((_, i) => i);
  duplicates.forEach((v, i) => { map[v] = i; });
  const remove_indices = Object.keys(duplicates);
  remove(graph, EDGES, remove_indices);
  return {
    map,
    remove: remove_indices,
  };
};

// this is inside of fragment() right now.
// tbd if this is needed as a stand alone
// export const remove_collinear_vertices = (graph, epsilon = math.core.EPSILON) => {
// };

// const map_to_change_map = indices => indices.map((n, i) => n - i);
/**
 * @description this has the potential to create circular and duplicate edges
 *
 */
export const remove_duplicate_vertices = (graph, epsilon = math.core.EPSILON) => {
  const clusters = get_duplicate_vertices(graph, epsilon);
  // map answers: what is the index of the old vertex in the new graph?
  // [0, 1, 2, 3, 1, 4, 5]  vertex 4 got merged, vertices after it shifted up
  const map = [];
  clusters.forEach((verts, i) => verts.forEach(v => { map[v] = i; }));
  // average all points together for each new vertex
  graph.vertices_coords = clusters
    .map(arr => arr.map(i => graph.vertices_coords[i]))
    .map(arr => math.core.average(...arr));
  // update all "..._vertices" arrays with each vertex's new index.
  // TODO: this was copied from remove.js
  get_graph_keys_with_suffix(graph, VERTICES)
    .forEach(sKey => graph[sKey]
      .forEach((_, i) => graph[sKey][i]
        .forEach((v, j) => { graph[sKey][i][j] = map[v]; })));
  // for keys like "vertices_edges" or "vertices_vertices", we simply
  // cannot carry them over, for example vertices_vertices are intended
  // to be sorted clockwise. it's possible to write this out one day
  // for all the special cases, but for now playing it safe.
  get_graph_keys_with_prefix(graph, VERTICES)
    .filter(a => a !== VERTICES_COORDS)
    .forEach(key => delete graph[key]);
  // for a shared vertex: [3, 7, 9] we say 7 and 9 are removed.
  // the map reflects this change too, where indices 7 and 9 contain "3"
  const remove_indices = clusters
    .map(cluster => cluster.length > 1 ? cluster.slice(1, cluster.length) : undefined)
    .filter(a => a !== undefined)
    .reduce((a, b) => a.concat(b), []);
  return {
    vertices: {
      remove: remove_indices,
      map,
      // change: map_to_change_map(map),
    }
  };
};
