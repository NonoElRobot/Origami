/**
 * Rabbit Ear (c) Kraft
 */
import * as foldColors from "../fold/colors.js";
import * as foldFileFrames from "../fold/frames.js";
import * as foldSpecMethods from "../fold/spec.js";
import * as addVertices from "./add/vertex.js";
import * as addEdges from "./add/edge.js";
import * as edgesCircular from "./edges/circular.js";
import * as edgesDuplicate from "./edges/duplicate.js";
import * as edgesLines from "./edges/lines.js";
import * as facesPlanes from "./faces/planes.js";
import * as facesMatrix from "./faces/matrix.js";
import * as facesWinding from "./faces/winding.js";
import * as foldCreasePattern from "./fold/foldCreasePattern.js";
import * as flatFold from "./fold/flatFold.js";
import * as foldLine from "./fold/foldLine.js";
import * as foldFoldedForm from "./fold/foldFoldedForm.js";
import * as splitEdge from "./split/splitEdge.js";
import * as splitFace from "./split/splitFace.js";
import * as splitLine from "./split/splitLine.js";
import * as splitGraph from "./split/splitGraph.js";
import * as verticesClusters from "./vertices/clusters.js";
import * as verticesCollinear from "./vertices/collinear.js";
import * as verticesDuplicate from "./vertices/duplicate.js";
import * as verticesFolded from "./vertices/folded.js";
import * as verticesIsolated from "./vertices/isolated.js";
import * as verticesSort from "./vertices/sort.js";
import * as boundary from "./boundary.js";
import * as connectedComponents from "./connectedComponents.js";
import * as directedGraph from "./directedGraph.js";
import * as disjoint from "./disjoint.js";
import * as explodeMethods from "./explode.js";
// import * as flaps from "./flaps.js";
import * as intersect from "./intersect.js";
import * as join from "./join.js";
import * as maps from "./maps.js";
import * as nearestMethods from "./nearest.js";
import * as normals from "./normals.js";
import * as orders from "./orders.js";
import * as overlap from "./overlap.js";
import * as pleat from "./pleat.js";
import * as subgraphMethods from "./subgraph.js";
import * as sweep from "./sweep.js";
import * as transfer from "./transfer.js";
import * as transform from "./transform.js";
import * as trees from "./trees.js";
import * as triangulateMethods from "./triangulate.js";
import * as walk from "./walk.js";
import * as validate from "./validate.js";
import make from "./make/index.js";
import clean from "./clean.js";
import count from "./count.js";
import countImplied from "./countImplied.js";
import normalize from "./normalize.js";
import planarize from "./planarize.js";
import populate from "./populate.js";
import remove from "./remove.js";
import replace from "./replace.js";

// these are included via. a backdoor system, in src/index.js, all of these
// methods are bound to the the prototype, constructor graph(), which already
// contains references to the methods in these files:
// import * as foldBases from "../fold/bases.js";

export default {
	...foldColors,
	...foldFileFrames,
	...foldSpecMethods,
	...addVertices,
	...addEdges,
	...edgesCircular,
	...edgesDuplicate,
	...edgesLines,
	...facesPlanes,
	...facesMatrix,
	...facesWinding,
	...foldCreasePattern,
	...flatFold,
	...foldLine,
	...foldFoldedForm,
	...verticesClusters,
	...verticesCollinear,
	...verticesDuplicate,
	...verticesFolded,
	...verticesIsolated,
	...verticesSort,
	...boundary,
	...connectedComponents,
	...directedGraph,
	...disjoint,
	...explodeMethods,
	// ...flaps,
	...intersect,
	...join,
	...make,
	...maps,
	...nearestMethods,
	...normals,
	...orders,
	...overlap,
	...pleat,
	...splitEdge,
	...splitFace,
	...splitLine,
	...splitGraph,
	...subgraphMethods,
	...sweep,
	...transfer,
	...transform,
	...trees,
	...triangulateMethods,
	...walk,
	...validate,
	count,
	countImplied,
	clean,
	populate,
	remove,
	replace,
	normalize,
	planarize,
};
