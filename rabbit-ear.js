/* Rabbit Ear 0.9.33 alpha 2023-02-02 (c) Kraft, MIT License */

(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.ear = factory());
})(this, (function () { 'use strict';

	const _undefined = "undefined";
	const _number = "number";
	const _object = "object";
	const _index = "index";
	const _vertices = "vertices";
	const _edges = "edges";
	const _faces = "faces";
	const _boundaries = "boundaries";
	const _vertices_coords = "vertices_coords";
	const _edges_vertices = "edges_vertices";
	const _faces_vertices = "faces_vertices";
	const _faces_edges = "faces_edges";
	const _edges_assignment = "edges_assignment";
	const _edges_foldAngle = "edges_foldAngle";
	const _frame_parent = "frame_parent";
	const _frame_inherit = "frame_inherit";
	const _faces_layer = "faces_layer";
	const _boundary = "boundary";
	const _front = "front";
	const _back = "back";
	const _foldedForm = "foldedForm";
	const _black = "black";
	const _white = "white";
	const _none = "none";

	const isBrowser$1 = typeof window !== _undefined
		&& typeof window.document !== _undefined;
	typeof process !== _undefined
		&& process.versions != null
		&& process.versions.node != null;
	const isWebWorker = typeof self === _object
		&& self.constructor
		&& self.constructor.name === "DedicatedWorkerGlobalScope";

	var fragment$1 = "graph could not planarize";
	var manifold = "manifold required";
	var graphCycle = "cycle not allowed";
	var planarBoundary$1 = "planar boundary detection error, bad graph";
	var circularEdge = "circular edges not allowed";
	var replaceModifyParam = "replace() index < value. indices parameter modified";
	var replaceUndefined = "replace() generated undefined";
	var flatFoldAngles = "foldAngles cannot be determined from flat-folded faces without an assignment";
	var noWebGL = "WebGl not Supported";
	var convexFace = "only convex faces are supported";
	var window$1 = "window not set; if using node/deno include package @xmldom/xmldom and set ear.window = xmldom";
	var nonConvexTriangulation = "non-convex triangulation requires vertices_coords";
	var Messages = {
		fragment: fragment$1,
		manifold: manifold,
		graphCycle: graphCycle,
		planarBoundary: planarBoundary$1,
		circularEdge: circularEdge,
		replaceModifyParam: replaceModifyParam,
		replaceUndefined: replaceUndefined,
		flatFoldAngles: flatFoldAngles,
		noWebGL: noWebGL,
		convexFace: convexFace,
		window: window$1,
		nonConvexTriangulation: nonConvexTriangulation
	};

	const windowContainer = { window: undefined };
	const buildDocument = (newWindow) => new newWindow.DOMParser()
		.parseFromString("<!DOCTYPE html><title>.</title>", "text/html");
	const setWindow$1 = (newWindow) => {
		if (!newWindow.document) { newWindow.document = buildDocument(newWindow); }
		windowContainer.window = newWindow;
		return windowContainer.window;
	};
	if (isBrowser$1) { windowContainer.window = window; }
	const RabbitEarWindow = () => {
		if (windowContainer.window === undefined) {
			throw new Error(Messages.window);
		}
		return windowContainer.window;
	};

	var root = Object.create(null);

	const typeOf = function (obj) {
		switch (obj.constructor.name) {
		case "vector":
		case "matrix":
		case "segment":
		case "ray":
		case "line":
		case "circle":
		case "ellipse":
		case "rect":
		case "polygon": return obj.constructor.name;
		}
		if (typeof obj === "object") {
			if (obj.radius != null) { return "circle"; }
			if (obj.width != null) { return "rect"; }
			if (obj.x != null || typeof obj[0] === "number") { return "vector"; }
			if (obj[0] != null && obj[0].length && (typeof obj[0].x === "number" || typeof obj[0][0] === "number")) { return "segment"; }
			if (obj.vector != null && obj.origin != null) { return "line"; }
		}
		return undefined;
	};
	const resize = (d, v) => (v.length === d
		? v
		: Array(d).fill(0).map((z, i) => (v[i] ? v[i] : z)));
	const resizeUp = (a, b) => [a, b]
		.map(v => resize(Math.max(a.length, b.length), v));
	const countPlaces = function (num) {
		const m = (`${num}`).match(/(?:\.(\d+))?(?:[eE]([+-]?\d+))?$/);
		if (!m) { return 0; }
		return Math.max(0, (m[1] ? m[1].length : 0) - (m[2] ? +m[2] : 0));
	};
	const cleanNumber = function (num, places = 15) {
		if (typeof num !== "number") { return num; }
		const crop = parseFloat(num.toFixed(places));
		if (countPlaces(crop) === Math.min(places, countPlaces(num))) {
			return num;
		}
		return crop;
	};
	const isIterable = (obj) => obj != null
		&& typeof obj[Symbol.iterator] === "function";
	const semiFlattenArrays = function () {
		switch (arguments.length) {
		case undefined:
		case 0: return Array.from(arguments);
		case 1: return isIterable(arguments[0]) && typeof arguments[0] !== "string"
			? semiFlattenArrays(...arguments[0])
			: [arguments[0]];
		default:
			return Array.from(arguments).map(a => (isIterable(a)
				? [...semiFlattenArrays(a)]
				: a));
		}
	};
	const flattenArrays = function () {
		switch (arguments.length) {
		case undefined:
		case 0: return Array.from(arguments);
		case 1: return isIterable(arguments[0]) && typeof arguments[0] !== "string"
			? flattenArrays(...arguments[0])
			: [arguments[0]];
		default:
			return Array.from(arguments).map(a => (isIterable(a)
				? [...flattenArrays(a)]
				: a)).reduce((a, b) => a.concat(b), []);
		}
	};
	var resizers = Object.freeze({
		__proto__: null,
		resize: resize,
		resizeUp: resizeUp,
		cleanNumber: cleanNumber,
		semiFlattenArrays: semiFlattenArrays,
		flattenArrays: flattenArrays
	});
	const EPSILON = 1e-6;
	const R2D = 180 / Math.PI;
	const D2R = Math.PI / 180;
	const TWO_PI = Math.PI * 2;
	var constants = Object.freeze({
		__proto__: null,
		EPSILON: EPSILON,
		R2D: R2D,
		D2R: D2R,
		TWO_PI: TWO_PI
	});
	const fnTrue = () => true;
	const fnSquare = n => n * n;
	const fnAdd = (a, b) => a + (b || 0);
	const fnNotUndefined = a => a !== undefined;
	const fnAnd = (a, b) => a && b;
	const fnCat = (a, b) => a.concat(b);
	const fnVec2Angle = v => Math.atan2(v[1], v[0]);
	const fnToVec2 = a => [Math.cos(a), Math.sin(a)];
	const fnEqual = (a, b) => a === b;
	const fnEpsilonEqual = (a, b, epsilon = EPSILON) => Math.abs(a - b) < epsilon;
	const fnEpsilonSort = (a, b, epsilon = EPSILON) => (
		fnEpsilonEqual(a, b, epsilon) ? 0 : Math.sign(b - a)
	);
	const fnEpsilonEqualVectors = (a, b, epsilon = EPSILON) => {
		for (let i = 0; i < Math.max(a.length, b.length); i += 1) {
			if (!fnEpsilonEqual(a[i] || 0, b[i] || 0, epsilon)) { return false; }
		}
		return true;
	};
	const include = (n, epsilon = EPSILON) => n > -epsilon;
	const exclude = (n, epsilon = EPSILON) => n > epsilon;
	const includeL = fnTrue;
	const excludeL = fnTrue;
	const includeR = include;
	const excludeR = exclude;
	const includeS = (t, e = EPSILON) => t > -e && t < 1 + e;
	const excludeS = (t, e = EPSILON) => t > e && t < 1 - e;
	const clampLine = dist => dist;
	const clampRay = dist => (dist < -EPSILON ? 0 : dist);
	const clampSegment = (dist) => {
		if (dist < -EPSILON) { return 0; }
		if (dist > 1 + EPSILON) { return 1; }
		return dist;
	};
	var functions = Object.freeze({
		__proto__: null,
		fnTrue: fnTrue,
		fnSquare: fnSquare,
		fnAdd: fnAdd,
		fnNotUndefined: fnNotUndefined,
		fnAnd: fnAnd,
		fnCat: fnCat,
		fnVec2Angle: fnVec2Angle,
		fnToVec2: fnToVec2,
		fnEqual: fnEqual,
		fnEpsilonEqual: fnEpsilonEqual,
		fnEpsilonSort: fnEpsilonSort,
		fnEpsilonEqualVectors: fnEpsilonEqualVectors,
		include: include,
		exclude: exclude,
		includeL: includeL,
		excludeL: excludeL,
		includeR: includeR,
		excludeR: excludeR,
		includeS: includeS,
		excludeS: excludeS,
		clampLine: clampLine,
		clampRay: clampRay,
		clampSegment: clampSegment
	});
	const magnitude = v => Math.sqrt(v
		.map(fnSquare)
		.reduce(fnAdd, 0));
	const magnitude2 = v => Math.sqrt(v[0] * v[0] + v[1] * v[1]);
	const magnitude3 = v => Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
	const magSquared = v => v
		.map(fnSquare)
		.reduce(fnAdd, 0);
	const normalize = (v) => {
		const m = magnitude(v);
		return m === 0 ? v : v.map(c => c / m);
	};
	const normalize2 = (v) => {
		const m = magnitude2(v);
		return m === 0 ? v : [v[0] / m, v[1] / m];
	};
	const normalize3 = (v) => {
		const m = magnitude3(v);
		return m === 0 ? v : [v[0] / m, v[1] / m, v[2] / m];
	};
	const scale = (v, s) => v.map(n => n * s);
	const scale2 = (v, s) => [v[0] * s, v[1] * s];
	const scale3 = (v, s) => [v[0] * s, v[1] * s, v[2] * s];
	const add = (v, u) => v.map((n, i) => n + (u[i] || 0));
	const add2 = (v, u) => [v[0] + u[0], v[1] + u[1]];
	const add3 = (v, u) => [v[0] + u[0], v[1] + u[1], v[2] + u[2]];
	const subtract = (v, u) => v.map((n, i) => n - (u[i] || 0));
	const subtract2 = (v, u) => [v[0] - u[0], v[1] - u[1]];
	const subtract3 = (v, u) => [v[0] - u[0], v[1] - u[1], v[2] - u[2]];
	const dot = (v, u) => v
		.map((_, i) => v[i] * u[i])
		.reduce(fnAdd, 0);
	const dot2 = (v, u) => v[0] * u[0] + v[1] * u[1];
	const dot3 = (v, u) => v[0] * u[0] + v[1] * u[1] + v[2] * u[2];
	const midpoint = (v, u) => v.map((n, i) => (n + u[i]) / 2);
	const midpoint2 = (v, u) => scale2(add2(v, u), 0.5);
	const midpoint3 = (v, u) => scale3(add3(v, u), 0.5);
	const average = function () {
		if (arguments.length === 0) { return []; }
		const dimension = (arguments[0].length > 0) ? arguments[0].length : 0;
		const sum = Array(dimension).fill(0);
		Array.from(arguments)
			.forEach(vec => sum.forEach((_, i) => { sum[i] += vec[i] || 0; }));
		return sum.map(n => n / arguments.length);
	};
	const lerp = (v, u, t) => {
		const inv = 1.0 - t;
		return v.map((n, i) => n * inv + (u[i] || 0) * t);
	};
	const cross2 = (v, u) => v[0] * u[1] - v[1] * u[0];
	const cross3 = (v, u) => [
		v[1] * u[2] - v[2] * u[1],
		v[2] * u[0] - v[0] * u[2],
		v[0] * u[1] - v[1] * u[0],
	];
	const distance = (v, u) => Math.sqrt(v
		.map((_, i) => (v[i] - u[i]) ** 2)
		.reduce(fnAdd, 0));
	const distance2 = (v, u) => {
		const p = v[0] - u[0];
		const q = v[1] - u[1];
		return Math.sqrt((p * p) + (q * q));
	};
	const distance3 = (v, u) => {
		const a = v[0] - u[0];
		const b = v[1] - u[1];
		const c = v[2] - u[2];
		return Math.sqrt((a * a) + (b * b) + (c * c));
	};
	const flip = v => v.map(n => -n);
	const rotate90 = v => [-v[1], v[0]];
	const rotate270 = v => [v[1], -v[0]];
	const degenerate = (v, epsilon = EPSILON) => v
		.map(n => Math.abs(n))
		.reduce(fnAdd, 0) < epsilon;
	const parallelNormalized = (v, u, epsilon = EPSILON) => 1 - Math
		.abs(dot(v, u)) < epsilon;
	const parallel = (v, u, epsilon = EPSILON) => parallelNormalized(
		normalize(v),
		normalize(u),
		epsilon,
	);
	const parallel2 = (v, u, epsilon = EPSILON) => Math
		.abs(cross2(v, u)) < epsilon;
	var algebra = Object.freeze({
		__proto__: null,
		magnitude: magnitude,
		magnitude2: magnitude2,
		magnitude3: magnitude3,
		magSquared: magSquared,
		normalize: normalize,
		normalize2: normalize2,
		normalize3: normalize3,
		scale: scale,
		scale2: scale2,
		scale3: scale3,
		add: add,
		add2: add2,
		add3: add3,
		subtract: subtract,
		subtract2: subtract2,
		subtract3: subtract3,
		dot: dot,
		dot2: dot2,
		dot3: dot3,
		midpoint: midpoint,
		midpoint2: midpoint2,
		midpoint3: midpoint3,
		average: average,
		lerp: lerp,
		cross2: cross2,
		cross3: cross3,
		distance: distance,
		distance2: distance2,
		distance3: distance3,
		flip: flip,
		rotate90: rotate90,
		rotate270: rotate270,
		degenerate: degenerate,
		parallelNormalized: parallelNormalized,
		parallel: parallel,
		parallel2: parallel2
	});
	const rayLineToUniqueLine = ({ vector, origin }) => {
		const mag = magnitude(vector);
		const normal = rotate90(vector);
		const distance = dot(origin, normal) / mag;
		return { normal: scale(normal, 1 / mag), distance };
	};
	const uniqueLineToRayLine = ({ normal, distance }) => ({
		vector: rotate270(normal),
		origin: scale(normal, distance),
	});
	var parameterize = Object.freeze({
		__proto__: null,
		rayLineToUniqueLine: rayLineToUniqueLine,
		uniqueLineToRayLine: uniqueLineToRayLine
	});
	const smallestComparisonSearch = (obj, array, compare_func) => {
		const objs = array.map((o, i) => ({ o, i, d: compare_func(obj, o) }));
		let index;
		let smallest_value = Infinity;
		for (let i = 0; i < objs.length; i += 1) {
			if (objs[i].d < smallest_value) {
				index = i;
				smallest_value = objs[i].d;
			}
		}
		return index;
	};
	const minimumXIndices = (vectors, compFn = fnEpsilonSort, epsilon = EPSILON) => {
		let smallSet = [0];
		for (let i = 1; i < vectors.length; i += 1) {
			switch (compFn(vectors[i][0], vectors[smallSet[0]][0], epsilon)) {
			case 0: smallSet.push(i); break;
			case 1: smallSet = [i]; break;
			}
		}
		return smallSet;
	};
	const minimum2DPointIndex = (points, epsilon = EPSILON) => {
		const smallSet = minimumXIndices(points, fnEpsilonSort, epsilon);
		let sm = 0;
		for (let i = 1; i < smallSet.length; i += 1) {
			if (points[smallSet[i]][1] < points[smallSet[sm]][1]) { sm = i; }
		}
		return smallSet[sm];
	};
	const nearestPoint2 = (point, array_of_points) => {
		const index = smallestComparisonSearch(point, array_of_points, distance2);
		return index === undefined ? undefined : array_of_points[index];
	};
	const nearestPoint = (point, array_of_points) => {
		const index = smallestComparisonSearch(point, array_of_points, distance);
		return index === undefined ? undefined : array_of_points[index];
	};
	const nearestPointOnLine = (vector, origin, point, limiterFunc, epsilon = EPSILON) => {
		origin = resize(vector.length, origin);
		point = resize(vector.length, point);
		const magSq = magSquared(vector);
		const vectorToPoint = subtract(point, origin);
		const dotProd = dot(vector, vectorToPoint);
		const dist = dotProd / magSq;
		const d = limiterFunc(dist, epsilon);
		return add(origin, scale(vector, d));
	};
	const nearestPointOnPolygon = (polygon, point) => {
		const v = polygon
			.map((p, i, arr) => subtract(arr[(i + 1) % arr.length], p));
		return polygon
			.map((p, i) => nearestPointOnLine(v[i], p, point, clampSegment))
			.map((p, i) => ({ point: p, i, distance: distance(p, point) }))
			.sort((a, b) => a.distance - b.distance)
			.shift();
	};
	const nearestPointOnCircle = (radius, origin, point) => (
		add(origin, scale(normalize(subtract(point, origin)), radius)));
	var nearest$1 = Object.freeze({
		__proto__: null,
		smallestComparisonSearch: smallestComparisonSearch,
		minimum2DPointIndex: minimum2DPointIndex,
		nearestPoint2: nearestPoint2,
		nearestPoint: nearestPoint,
		nearestPointOnLine: nearestPointOnLine,
		nearestPointOnPolygon: nearestPointOnPolygon,
		nearestPointOnCircle: nearestPointOnCircle
	});
	const sortPointsAlongVector2 = (points, vector) => points
		.map(point => ({ point, d: point[0] * vector[0] + point[1] * vector[1] }))
		.sort((a, b) => a.d - b.d)
		.map(a => a.point);
	const clusterIndicesOfSortedNumbers = (numbers, epsilon = EPSILON) => {
		const clusters = [[0]];
		let clusterIndex = 0;
		for (let i = 1; i < numbers.length; i += 1) {
			if (fnEpsilonEqual(numbers[i], numbers[i - 1], epsilon)) {
				clusters[clusterIndex].push(i);
			} else {
				clusterIndex = clusters.length;
				clusters.push([i]);
			}
		}
		return clusters;
	};
	const radialSortPointIndices = (points = [], epsilon = EPSILON) => {
		const first = minimum2DPointIndex(points, epsilon);
		const angles = points
			.map(p => subtract2(p, points[first]))
			.map(v => normalize2(v))
			.map(vec => dot2([0, 1], vec));
		const rawOrder = angles
			.map((a, i) => ({ a, i }))
			.sort((a, b) => a.a - b.a)
			.map(el => el.i)
			.filter(i => i !== first);
		return [[first]]
			.concat(clusterIndicesOfSortedNumbers(rawOrder.map(i => angles[i]), epsilon)
				.map(arr => arr.map(i => rawOrder[i]))
				.map(cluster => (cluster.length === 1 ? cluster : cluster
					.map(i => ({ i, len: distance2(points[i], points[first]) }))
					.sort((a, b) => a.len - b.len)
					.map(el => el.i))));
	};
	var sortMethods$1 = Object.freeze({
		__proto__: null,
		sortPointsAlongVector2: sortPointsAlongVector2,
		clusterIndicesOfSortedNumbers: clusterIndicesOfSortedNumbers,
		radialSortPointIndices: radialSortPointIndices
	});
	const identity2x2 = [1, 0, 0, 1];
	const identity2x3 = identity2x2.concat(0, 0);
	const multiplyMatrix2Vector2 = (matrix, vector) => [
		matrix[0] * vector[0] + matrix[2] * vector[1] + matrix[4],
		matrix[1] * vector[0] + matrix[3] * vector[1] + matrix[5],
	];
	const multiplyMatrix2Line2 = (matrix, vector, origin) => ({
		vector: [
			matrix[0] * vector[0] + matrix[2] * vector[1],
			matrix[1] * vector[0] + matrix[3] * vector[1],
		],
		origin: [
			matrix[0] * origin[0] + matrix[2] * origin[1] + matrix[4],
			matrix[1] * origin[0] + matrix[3] * origin[1] + matrix[5],
		],
	});
	const multiplyMatrices2 = (m1, m2) => [
		m1[0] * m2[0] + m1[2] * m2[1],
		m1[1] * m2[0] + m1[3] * m2[1],
		m1[0] * m2[2] + m1[2] * m2[3],
		m1[1] * m2[2] + m1[3] * m2[3],
		m1[0] * m2[4] + m1[2] * m2[5] + m1[4],
		m1[1] * m2[4] + m1[3] * m2[5] + m1[5],
	];
	const determinant2 = m => m[0] * m[3] - m[1] * m[2];
	const invertMatrix2 = (m) => {
		const det = determinant2(m);
		if (Math.abs(det) < 1e-6
			|| Number.isNaN(det)
			|| !Number.isFinite(m[4])
			|| !Number.isFinite(m[5])) {
			return undefined;
		}
		return [
			m[3] / det,
			-m[1] / det,
			-m[2] / det,
			m[0] / det,
			(m[2] * m[5] - m[3] * m[4]) / det,
			(m[1] * m[4] - m[0] * m[5]) / det,
		];
	};
	const makeMatrix2Translate = (x = 0, y = 0) => identity2x2.concat(x, y);
	const makeMatrix2Scale = (scale = [1, 1], origin = [0, 0]) => [
		scale[0],
		0,
		0,
		scale[1],
		scale[0] * -origin[0] + origin[0],
		scale[1] * -origin[1] + origin[1],
	];
	const makeMatrix2Rotate = (angle, origin = [0, 0]) => {
		const cos = Math.cos(angle);
		const sin = Math.sin(angle);
		return [
			cos,
			sin,
			-sin,
			cos,
			origin[0],
			origin[1],
		];
	};
	const makeMatrix2Reflect = (vector, origin = [0, 0]) => {
		const angle = Math.atan2(vector[1], vector[0]);
		const cosAngle = Math.cos(angle);
		const sinAngle = Math.sin(angle);
		const cos_Angle = Math.cos(-angle);
		const sin_Angle = Math.sin(-angle);
		const a = cosAngle * cos_Angle + sinAngle * sin_Angle;
		const b = cosAngle * -sin_Angle + sinAngle * cos_Angle;
		const c = sinAngle * cos_Angle + -cosAngle * sin_Angle;
		const d = sinAngle * -sin_Angle + -cosAngle * cos_Angle;
		const tx = origin[0] + a * -origin[0] + -origin[1] * c;
		const ty = origin[1] + b * -origin[0] + -origin[1] * d;
		return [a, b, c, d, tx, ty];
	};
	var matrix2 = Object.freeze({
		__proto__: null,
		identity2x2: identity2x2,
		identity2x3: identity2x3,
		multiplyMatrix2Vector2: multiplyMatrix2Vector2,
		multiplyMatrix2Line2: multiplyMatrix2Line2,
		multiplyMatrices2: multiplyMatrices2,
		determinant2: determinant2,
		invertMatrix2: invertMatrix2,
		makeMatrix2Translate: makeMatrix2Translate,
		makeMatrix2Scale: makeMatrix2Scale,
		makeMatrix2Rotate: makeMatrix2Rotate,
		makeMatrix2Reflect: makeMatrix2Reflect
	});
	const identity3x3 = Object.freeze([1, 0, 0, 0, 1, 0, 0, 0, 1]);
	const identity3x4 = Object.freeze(identity3x3.concat(0, 0, 0));
	const isIdentity3x4 = m => identity3x4
		.map((n, i) => Math.abs(n - m[i]) < EPSILON)
		.reduce((a, b) => a && b, true);
	const multiplyMatrix3Vector3 = (m, vector) => [
		m[0] * vector[0] + m[3] * vector[1] + m[6] * vector[2] + m[9],
		m[1] * vector[0] + m[4] * vector[1] + m[7] * vector[2] + m[10],
		m[2] * vector[0] + m[5] * vector[1] + m[8] * vector[2] + m[11],
	];
	const multiplyMatrix3Line3 = (m, vector, origin) => ({
		vector: [
			m[0] * vector[0] + m[3] * vector[1] + m[6] * vector[2],
			m[1] * vector[0] + m[4] * vector[1] + m[7] * vector[2],
			m[2] * vector[0] + m[5] * vector[1] + m[8] * vector[2],
		],
		origin: [
			m[0] * origin[0] + m[3] * origin[1] + m[6] * origin[2] + m[9],
			m[1] * origin[0] + m[4] * origin[1] + m[7] * origin[2] + m[10],
			m[2] * origin[0] + m[5] * origin[1] + m[8] * origin[2] + m[11],
		],
	});
	const multiplyMatrices3 = (m1, m2) => [
		m1[0] * m2[0] + m1[3] * m2[1] + m1[6] * m2[2],
		m1[1] * m2[0] + m1[4] * m2[1] + m1[7] * m2[2],
		m1[2] * m2[0] + m1[5] * m2[1] + m1[8] * m2[2],
		m1[0] * m2[3] + m1[3] * m2[4] + m1[6] * m2[5],
		m1[1] * m2[3] + m1[4] * m2[4] + m1[7] * m2[5],
		m1[2] * m2[3] + m1[5] * m2[4] + m1[8] * m2[5],
		m1[0] * m2[6] + m1[3] * m2[7] + m1[6] * m2[8],
		m1[1] * m2[6] + m1[4] * m2[7] + m1[7] * m2[8],
		m1[2] * m2[6] + m1[5] * m2[7] + m1[8] * m2[8],
		m1[0] * m2[9] + m1[3] * m2[10] + m1[6] * m2[11] + m1[9],
		m1[1] * m2[9] + m1[4] * m2[10] + m1[7] * m2[11] + m1[10],
		m1[2] * m2[9] + m1[5] * m2[10] + m1[8] * m2[11] + m1[11],
	];
	const determinant3 = m => (
		m[0] * m[4] * m[8]
		- m[0] * m[7] * m[5]
		- m[3] * m[1] * m[8]
		+ m[3] * m[7] * m[2]
		+ m[6] * m[1] * m[5]
		- m[6] * m[4] * m[2]
	);
	const invertMatrix3 = (m) => {
		const det = determinant3(m);
		if (Math.abs(det) < 1e-6 || Number.isNaN(det)
			|| !Number.isFinite(m[9]) || !Number.isFinite(m[10]) || !Number.isFinite(m[11])) {
			return undefined;
		}
		const inv = [
			m[4] * m[8] - m[7] * m[5],
			-m[1] * m[8] + m[7] * m[2],
			m[1] * m[5] - m[4] * m[2],
			-m[3] * m[8] + m[6] * m[5],
			m[0] * m[8] - m[6] * m[2],
			-m[0] * m[5] + m[3] * m[2],
			m[3] * m[7] - m[6] * m[4],
			-m[0] * m[7] + m[6] * m[1],
			m[0] * m[4] - m[3] * m[1],
			-m[3] * m[7] * m[11] + m[3] * m[8] * m[10] + m[6] * m[4] * m[11]
				- m[6] * m[5] * m[10] - m[9] * m[4] * m[8] + m[9] * m[5] * m[7],
			m[0] * m[7] * m[11] - m[0] * m[8] * m[10] - m[6] * m[1] * m[11]
				+ m[6] * m[2] * m[10] + m[9] * m[1] * m[8] - m[9] * m[2] * m[7],
			-m[0] * m[4] * m[11] + m[0] * m[5] * m[10] + m[3] * m[1] * m[11]
				- m[3] * m[2] * m[10] - m[9] * m[1] * m[5] + m[9] * m[2] * m[4],
		];
		const invDet = 1.0 / det;
		return inv.map(n => n * invDet);
	};
	const makeMatrix3Translate = (x = 0, y = 0, z = 0) => identity3x3.concat(x, y, z);
	const singleAxisRotate = (angle, origin, i0, i1, sgn) => {
		const mat = identity3x3.concat([0, 1, 2].map(i => origin[i] || 0));
		const cos = Math.cos(angle);
		const sin = Math.sin(angle);
		mat[i0 * 3 + i0] = cos;
		mat[i0 * 3 + i1] = (sgn ? +1 : -1) * sin;
		mat[i1 * 3 + i0] = (sgn ? -1 : +1) * sin;
		mat[i1 * 3 + i1] = cos;
		return mat;
	};
	const makeMatrix3RotateX = (angle, origin = [0, 0, 0]) => (
		singleAxisRotate(angle, origin, 1, 2, true));
	const makeMatrix3RotateY = (angle, origin = [0, 0, 0]) => (
		singleAxisRotate(angle, origin, 0, 2, false));
	const makeMatrix3RotateZ = (angle, origin = [0, 0, 0]) => (
		singleAxisRotate(angle, origin, 0, 1, true));
	const makeMatrix3Rotate = (angle, vector = [0, 0, 1], origin = [0, 0, 0]) => {
		const pos = [0, 1, 2].map(i => origin[i] || 0);
		const [x, y, z] = resize(3, normalize(vector));
		const c = Math.cos(angle);
		const s = Math.sin(angle);
		const t = 1 - c;
		const trans = identity3x3.concat(-pos[0], -pos[1], -pos[2]);
		const trans_inv = identity3x3.concat(pos[0], pos[1], pos[2]);
		return multiplyMatrices3(trans_inv, multiplyMatrices3([
			t * x * x + c,     t * y * x + z * s, t * z * x - y * s,
			t * x * y - z * s, t * y * y + c,     t * z * y + x * s,
			t * x * z + y * s, t * y * z - x * s, t * z * z + c,
			0, 0, 0], trans));
	};
	const makeMatrix3Scale = (scale = [1, 1, 1], origin = [0, 0, 0]) => [
		scale[0], 0, 0,
		0, scale[1], 0,
		0, 0, scale[2],
		scale[0] * -origin[0] + origin[0],
		scale[1] * -origin[1] + origin[1],
		scale[2] * -origin[2] + origin[2],
	];
	const makeMatrix3ReflectZ = (vector, origin = [0, 0]) => {
		const m = makeMatrix2Reflect(vector, origin);
		return [m[0], m[1], 0, m[2], m[3], 0, 0, 0, 1, m[4], m[5], 0];
	};
	var matrix3 = Object.freeze({
		__proto__: null,
		identity3x3: identity3x3,
		identity3x4: identity3x4,
		isIdentity3x4: isIdentity3x4,
		multiplyMatrix3Vector3: multiplyMatrix3Vector3,
		multiplyMatrix3Line3: multiplyMatrix3Line3,
		multiplyMatrices3: multiplyMatrices3,
		determinant3: determinant3,
		invertMatrix3: invertMatrix3,
		makeMatrix3Translate: makeMatrix3Translate,
		makeMatrix3RotateX: makeMatrix3RotateX,
		makeMatrix3RotateY: makeMatrix3RotateY,
		makeMatrix3RotateZ: makeMatrix3RotateZ,
		makeMatrix3Rotate: makeMatrix3Rotate,
		makeMatrix3Scale: makeMatrix3Scale,
		makeMatrix3ReflectZ: makeMatrix3ReflectZ
	});
	const identity4x4 = Object.freeze([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
	const isIdentity4x4 = m => identity4x4
		.map((n, i) => Math.abs(n - m[i]) < EPSILON)
		.reduce((a, b) => a && b, true);
	const multiplyMatrix4Vector3 = (m, vector) => [
		m[0] * vector[0] + m[4] * vector[1] + m[8] * vector[2] + m[12],
		m[1] * vector[0] + m[5] * vector[1] + m[9] * vector[2] + m[13],
		m[2] * vector[0] + m[6] * vector[1] + m[10] * vector[2] + m[14],
	];
	const multiplyMatrix4Line3 = (m, vector, origin) => ({
		vector: [
			m[0] * vector[0] + m[4] * vector[1] + m[8] * vector[2],
			m[1] * vector[0] + m[5] * vector[1] + m[9] * vector[2],
			m[2] * vector[0] + m[6] * vector[1] + m[10] * vector[2],
		],
		origin: [
			m[0] * origin[0] + m[4] * origin[1] + m[8] * origin[2] + m[12],
			m[1] * origin[0] + m[5] * origin[1] + m[9] * origin[2] + m[13],
			m[2] * origin[0] + m[6] * origin[1] + m[10] * origin[2] + m[14],
		],
	});
	const multiplyMatrices4 = (m1, m2) => [
		m1[0] * m2[0] + m1[4] * m2[1] + m1[8] * m2[2] + m1[12] * m2[3],
		m1[1] * m2[0] + m1[5] * m2[1] + m1[9] * m2[2] + m1[13] * m2[3],
		m1[2] * m2[0] + m1[6] * m2[1] + m1[10] * m2[2] + m1[14] * m2[3],
		m1[3] * m2[0] + m1[7] * m2[1] + m1[11] * m2[2] + m1[15] * m2[3],
		m1[0] * m2[4] + m1[4] * m2[5] + m1[8] * m2[6] + m1[12] * m2[7],
		m1[1] * m2[4] + m1[5] * m2[5] + m1[9] * m2[6] + m1[13] * m2[7],
		m1[2] * m2[4] + m1[6] * m2[5] + m1[10] * m2[6] + m1[14] * m2[7],
		m1[3] * m2[4] + m1[7] * m2[5] + m1[11] * m2[6] + m1[15] * m2[7],
		m1[0] * m2[8] + m1[4] * m2[9] + m1[8] * m2[10] + m1[12] * m2[11],
		m1[1] * m2[8] + m1[5] * m2[9] + m1[9] * m2[10] + m1[13] * m2[11],
		m1[2] * m2[8] + m1[6] * m2[9] + m1[10] * m2[10] + m1[14] * m2[11],
		m1[3] * m2[8] + m1[7] * m2[9] + m1[11] * m2[10] + m1[15] * m2[11],
		m1[0] * m2[12] + m1[4] * m2[13] + m1[8] * m2[14] + m1[12] * m2[15],
		m1[1] * m2[12] + m1[5] * m2[13] + m1[9] * m2[14] + m1[13] * m2[15],
		m1[2] * m2[12] + m1[6] * m2[13] + m1[10] * m2[14] + m1[14] * m2[15],
		m1[3] * m2[12] + m1[7] * m2[13] + m1[11] * m2[14] + m1[15] * m2[15],
	];
	const determinant4 = m => {
		const A2323 = m[10] * m[15] - m[11] * m[14];
		const A1323 = m[9] * m[15] - m[11] * m[13];
		const A1223 = m[9] * m[14] - m[10] * m[13];
		const A0323 = m[8] * m[15] - m[11] * m[12];
		const A0223 = m[8] * m[14] - m[10] * m[12];
		const A0123 = m[8] * m[13] - m[9] * m[12];
		return (
				m[0] * (m[5] * A2323 - m[6] * A1323 + m[7] * A1223)
			- m[1] * (m[4] * A2323 - m[6] * A0323 + m[7] * A0223)
			+ m[2] * (m[4] * A1323 - m[5] * A0323 + m[7] * A0123)
			- m[3] * (m[4] * A1223 - m[5] * A0223 + m[6] * A0123)
		);
	};
	const invertMatrix4 = (m) => {
		const det = determinant4(m);
		if (Math.abs(det) < 1e-6 || Number.isNaN(det)
			|| !Number.isFinite(m[12]) || !Number.isFinite(m[13]) || !Number.isFinite(m[14])) {
			return undefined;
		}
		const A2323 = m[10] * m[15] - m[11] * m[14];
		const A1323 = m[9] * m[15] - m[11] * m[13];
		const A1223 = m[9] * m[14] - m[10] * m[13];
		const A0323 = m[8] * m[15] - m[11] * m[12];
		const A0223 = m[8] * m[14] - m[10] * m[12];
		const A0123 = m[8] * m[13] - m[9] * m[12];
		const A2313 = m[6] * m[15] - m[7] * m[14];
		const A1313 = m[5] * m[15] - m[7] * m[13];
		const A1213 = m[5] * m[14] - m[6] * m[13];
		const A2312 = m[6] * m[11] - m[7] * m[10];
		const A1312 = m[5] * m[11] - m[7] * m[9];
		const A1212 = m[5] * m[10] - m[6] * m[9];
		const A0313 = m[4] * m[15] - m[7] * m[12];
		const A0213 = m[4] * m[14] - m[6] * m[12];
		const A0312 = m[4] * m[11] - m[7] * m[8];
		const A0212 = m[4] * m[10] - m[6] * m[8];
		const A0113 = m[4] * m[13] - m[5] * m[12];
		const A0112 = m[4] * m[9] - m[5] * m[8];
		const inv = [
			+(m[5] * A2323 - m[6] * A1323 + m[7] * A1223),
			-(m[1] * A2323 - m[2] * A1323 + m[3] * A1223),
			+(m[1] * A2313 - m[2] * A1313 + m[3] * A1213),
			-(m[1] * A2312 - m[2] * A1312 + m[3] * A1212),
			-(m[4] * A2323 - m[6] * A0323 + m[7] * A0223),
			+(m[0] * A2323 - m[2] * A0323 + m[3] * A0223),
			-(m[0] * A2313 - m[2] * A0313 + m[3] * A0213),
			+(m[0] * A2312 - m[2] * A0312 + m[3] * A0212),
			+(m[4] * A1323 - m[5] * A0323 + m[7] * A0123),
			-(m[0] * A1323 - m[1] * A0323 + m[3] * A0123),
			+(m[0] * A1313 - m[1] * A0313 + m[3] * A0113),
			-(m[0] * A1312 - m[1] * A0312 + m[3] * A0112),
			-(m[4] * A1223 - m[5] * A0223 + m[6] * A0123),
			+(m[0] * A1223 - m[1] * A0223 + m[2] * A0123),
			-(m[0] * A1213 - m[1] * A0213 + m[2] * A0113),
			+(m[0] * A1212 - m[1] * A0212 + m[2] * A0112),
		];
		const invDet = 1.0 / det;
		return inv.map(n => n * invDet);
	};
	const identity4x3 = Object.freeze([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0]);
	const makeMatrix4Translate = (x = 0, y = 0, z = 0) => [...identity4x3, x, y, z, 1];
	const singleAxisRotate4 = (angle, origin, i0, i1, sgn) => {
		const mat = makeMatrix4Translate(...origin);
		const cos = Math.cos(angle);
		const sin = Math.sin(angle);
		mat[i0 * 4 + i0] = cos;
		mat[i0 * 4 + i1] = (sgn ? +1 : -1) * sin;
		mat[i1 * 4 + i0] = (sgn ? -1 : +1) * sin;
		mat[i1 * 4 + i1] = cos;
		return mat;
	};
	const makeMatrix4RotateX = (angle, origin = [0, 0, 0]) => (
		singleAxisRotate4(angle, origin, 1, 2, true));
	const makeMatrix4RotateY = (angle, origin = [0, 0, 0]) => (
		singleAxisRotate4(angle, origin, 0, 2, false));
	const makeMatrix4RotateZ = (angle, origin = [0, 0, 0]) => (
		singleAxisRotate4(angle, origin, 0, 1, true));
	const makeMatrix4Rotate = (angle, vector = [0, 0, 1], origin = [0, 0, 0]) => {
		const pos = [0, 1, 2].map(i => origin[i] || 0);
		const [x, y, z] = resize(3, normalize(vector));
		const c = Math.cos(angle);
		const s = Math.sin(angle);
		const t = 1 - c;
		const trans = makeMatrix4Translate(-pos[0], -pos[1], -pos[2]);
		const trans_inv = makeMatrix4Translate(pos[0], pos[1], pos[2]);
		return multiplyMatrices4(trans_inv, multiplyMatrices4([
			t * x * x + c,     t * y * x + z * s, t * z * x - y * s, 0,
			t * x * y - z * s, t * y * y + c,     t * z * y + x * s, 0,
			t * x * z + y * s, t * y * z - x * s, t * z * z + c, 0,
			0, 0, 0, 1], trans));
	};
	const makeMatrix4Scale = (scale = [1, 1, 1], origin = [0, 0, 0]) => [
		scale[0], 0, 0, 0,
		0, scale[1], 0, 0,
		0, 0, scale[2], 0,
		scale[0] * -origin[0] + origin[0],
		scale[1] * -origin[1] + origin[1],
		scale[2] * -origin[2] + origin[2],
		1,
	];
	const makeMatrix4ReflectZ = (vector, origin = [0, 0]) => {
		const m = makeMatrix2Reflect(vector, origin);
		return [m[0], m[1], 0, 0, m[2], m[3], 0, 0, 0, 0, 1, 0, m[4], m[5], 0, 1];
	};
	const makePerspectiveMatrix4 = (FOV, aspect, near, far) => {
		const f = Math.tan(Math.PI * 0.5 - 0.5 * FOV);
		const rangeInv = 1.0 / (near - far);
		return [
			f / aspect, 0, 0, 0,
			0, f, 0, 0,
			0, 0, (near + far) * rangeInv, -1,
			0, 0, near * far * rangeInv * 2, 0,
		];
	};
	const makeOrthographicMatrix4 = (top, right, bottom, left, near, far) => [
		2 / (right - left), 0, 0, 0,
		0, 2 / (top - bottom), 0, 0,
		0, 0, 2 / (near - far), 0,
		(left + right) / (left - right),
		(bottom + top) / (bottom - top),
		(near + far) / (near - far),
		1,
	];
	const makeLookAtMatrix4 = (position, target, up) => {
		const zAxis = normalize3(subtract3(position, target));
		const xAxis = normalize3(cross3(up, zAxis));
		const yAxis = normalize3(cross3(zAxis, xAxis));
		return [
			xAxis[0], xAxis[1], xAxis[2], 0,
			yAxis[0], yAxis[1], yAxis[2], 0,
			zAxis[0], zAxis[1], zAxis[2], 0,
			position[0], position[1], position[2], 1,
		];
	};
	var matrix4 = Object.freeze({
		__proto__: null,
		identity4x4: identity4x4,
		isIdentity4x4: isIdentity4x4,
		multiplyMatrix4Vector3: multiplyMatrix4Vector3,
		multiplyMatrix4Line3: multiplyMatrix4Line3,
		multiplyMatrices4: multiplyMatrices4,
		determinant4: determinant4,
		invertMatrix4: invertMatrix4,
		makeMatrix4Translate: makeMatrix4Translate,
		makeMatrix4RotateX: makeMatrix4RotateX,
		makeMatrix4RotateY: makeMatrix4RotateY,
		makeMatrix4RotateZ: makeMatrix4RotateZ,
		makeMatrix4Rotate: makeMatrix4Rotate,
		makeMatrix4Scale: makeMatrix4Scale,
		makeMatrix4ReflectZ: makeMatrix4ReflectZ,
		makePerspectiveMatrix4: makePerspectiveMatrix4,
		makeOrthographicMatrix4: makeOrthographicMatrix4,
		makeLookAtMatrix4: makeLookAtMatrix4
	});
	const quaternionFromTwoVectors = (u, v) => {
		const w = cross3(u, v);
		const q = [w[0], w[1], w[2], dot(u, v)];
		q[3] += magnitude(q);
		return normalize(q);
	};
	const matrix4FromQuaternion = (quaternion) => multiplyMatrices4([
		quaternion[3], quaternion[2], -quaternion[1], quaternion[0],
		-quaternion[2], quaternion[3], quaternion[0], quaternion[1],
		quaternion[1], -quaternion[0], quaternion[3], quaternion[2],
		-quaternion[0], -quaternion[1], -quaternion[2], quaternion[3],
	], [
		quaternion[3], quaternion[2], -quaternion[1], -quaternion[0],
		-quaternion[2], quaternion[3], quaternion[0], -quaternion[1],
		quaternion[1], -quaternion[0], quaternion[3], -quaternion[2],
		quaternion[0], quaternion[1], quaternion[2], quaternion[3],
	]);
	var quaternion = Object.freeze({
		__proto__: null,
		quaternionFromTwoVectors: quaternionFromTwoVectors,
		matrix4FromQuaternion: matrix4FromQuaternion
	});
	const overlapConvexPolygonPoint = (poly, point, func = exclude, epsilon = EPSILON) => poly
		.map((p, i, arr) => [p, arr[(i + 1) % arr.length]])
		.map(s => cross2(normalize(subtract(s[1], s[0])), subtract(point, s[0])))
		.map(side => func(side, epsilon))
		.map((s, _, arr) => s === arr[0])
		.reduce((prev, curr) => prev && curr, true);
	const lineLineParameter = (
		lineVector,
		lineOrigin,
		polyVector,
		polyOrigin,
		polyLineFunc = includeS,
		epsilon = EPSILON,
	) => {
		const det_norm = cross2(normalize(lineVector), normalize(polyVector));
		if (Math.abs(det_norm) < epsilon) { return undefined; }
		const determinant0 = cross2(lineVector, polyVector);
		const determinant1 = -determinant0;
		const a2b = subtract(polyOrigin, lineOrigin);
		const b2a = flip(a2b);
		const t0 = cross2(a2b, polyVector) / determinant0;
		const t1 = cross2(b2a, lineVector) / determinant1;
		if (polyLineFunc(t1, epsilon / magnitude(polyVector))) {
			return t0;
		}
		return undefined;
	};
	const linePointFromParameter = (vector, origin, t) => add(origin, scale(vector, t));
	const getIntersectParameters = (poly, vector, origin, polyLineFunc, epsilon) => poly
		.map((p, i, arr) => [subtract(arr[(i + 1) % arr.length], p), p])
		.map(side => lineLineParameter(
			vector,
			origin,
			side[0],
			side[1],
			polyLineFunc,
			epsilon,
		))
		.filter(fnNotUndefined)
		.sort((a, b) => a - b);
	const getMinMax = (numbers, func, scaled_epsilon) => {
		let a = 0;
		let b = numbers.length - 1;
		while (a < b) {
			if (func(numbers[a + 1] - numbers[a], scaled_epsilon)) { break; }
			a += 1;
		}
		while (b > a) {
			if (func(numbers[b] - numbers[b - 1], scaled_epsilon)) { break; }
			b -= 1;
		}
		if (a >= b) { return undefined; }
		return [numbers[a], numbers[b]];
	};
	const clipLineConvexPolygon = (
		poly,
		vector,
		origin,
		fnPoly = include,
		fnLine = includeL,
		epsilon = EPSILON,
	) => {
		const numbers = getIntersectParameters(poly, vector, origin, includeS, epsilon);
		if (numbers.length < 2) { return undefined; }
		const scaled_epsilon = (epsilon * 2) / magnitude(vector);
		const ends = getMinMax(numbers, fnPoly, scaled_epsilon);
		if (ends === undefined) { return undefined; }
		const clip_fn = (t) => {
			if (fnLine(t)) { return t; }
			return t < 0.5 ? 0 : 1;
		};
		const ends_clip = ends.map(clip_fn);
		if (Math.abs(ends_clip[0] - ends_clip[1]) < (epsilon * 2) / magnitude(vector)) {
			return undefined;
		}
		const mid = linePointFromParameter(vector, origin, (ends_clip[0] + ends_clip[1]) / 2);
		return overlapConvexPolygonPoint(poly, mid, fnPoly, epsilon)
			? ends_clip.map(t => linePointFromParameter(vector, origin, t))
			: undefined;
	};
	const clipPolygonPolygon = (polygon1, polygon2, epsilon = EPSILON) => {
		let cp1;
		let cp2;
		let s;
		let e;
		const inside = (p) => (
			(cp2[0] - cp1[0]) * (p[1] - cp1[1])) > ((cp2[1] - cp1[1]) * (p[0] - cp1[0]) + epsilon
		);
		const intersection = () => {
			const dc = [cp1[0] - cp2[0], cp1[1] - cp2[1]];
			const dp = [s[0] - e[0], s[1] - e[1]];
			const n1 = cp1[0] * cp2[1] - cp1[1] * cp2[0];
			const n2 = s[0] * e[1] - s[1] * e[0];
			const n3 = 1.0 / (dc[0] * dp[1] - dc[1] * dp[0]);
			return [(n1 * dp[0] - n2 * dc[0]) * n3, (n1 * dp[1] - n2 * dc[1]) * n3];
		};
		let outputList = polygon1;
		cp1 = polygon2[polygon2.length - 1];
		for (let j in polygon2) {
			cp2 = polygon2[j];
			const inputList = outputList;
			outputList = [];
			s = inputList[inputList.length - 1];
			for (let i in inputList) {
				e = inputList[i];
				if (inside(e)) {
					if (!inside(s)) {
						outputList.push(intersection());
					}
					outputList.push(e);
				} else if (inside(s)) {
					outputList.push(intersection());
				}
				s = e;
			}
			cp1 = cp2;
		}
		return outputList.length === 0 ? undefined : outputList;
	};
	const isCounterClockwiseBetween = (angle, floor, ceiling) => {
		while (ceiling < floor) { ceiling += TWO_PI; }
		while (angle > floor) { angle -= TWO_PI; }
		while (angle < floor) { angle += TWO_PI; }
		return angle < ceiling;
	};
	const clockwiseAngleRadians = (a, b) => {
		while (a < 0) { a += TWO_PI; }
		while (b < 0) { b += TWO_PI; }
		while (a > TWO_PI) { a -= TWO_PI; }
		while (b > TWO_PI) { b -= TWO_PI; }
		const a_b = a - b;
		return (a_b >= 0)
			? a_b
			: TWO_PI - (b - a);
	};
	const counterClockwiseAngleRadians = (a, b) => {
		while (a < 0) { a += TWO_PI; }
		while (b < 0) { b += TWO_PI; }
		while (a > TWO_PI) { a -= TWO_PI; }
		while (b > TWO_PI) { b -= TWO_PI; }
		const b_a = b - a;
		return (b_a >= 0)
			? b_a
			: TWO_PI - (a - b);
	};
	const clockwiseAngle2 = (a, b) => {
		const dotProduct = b[0] * a[0] + b[1] * a[1];
		const determinant = b[0] * a[1] - b[1] * a[0];
		let angle = Math.atan2(determinant, dotProduct);
		if (angle < 0) { angle += TWO_PI; }
		return angle;
	};
	const counterClockwiseAngle2 = (a, b) => {
		const dotProduct = a[0] * b[0] + a[1] * b[1];
		const determinant = a[0] * b[1] - a[1] * b[0];
		let angle = Math.atan2(determinant, dotProduct);
		if (angle < 0) { angle += TWO_PI; }
		return angle;
	};
	const clockwiseBisect2 = (a, b) => fnToVec2(fnVec2Angle(a) - clockwiseAngle2(a, b) / 2);
	const counterClockwiseBisect2 = (a, b) => (
		fnToVec2(fnVec2Angle(a) + counterClockwiseAngle2(a, b) / 2)
	);
	const clockwiseSubsectRadians = (divisions, angleA, angleB) => {
		const angle = clockwiseAngleRadians(angleA, angleB) / divisions;
		return Array.from(Array(divisions - 1))
			.map((_, i) => angleA + angle * (i + 1));
	};
	const counterClockwiseSubsectRadians = (divisions, angleA, angleB) => {
		const angle = counterClockwiseAngleRadians(angleA, angleB) / divisions;
		return Array.from(Array(divisions - 1))
			.map((_, i) => angleA + angle * (i + 1));
	};
	const clockwiseSubsect2 = (divisions, vectorA, vectorB) => {
		const angleA = Math.atan2(vectorA[1], vectorA[0]);
		const angleB = Math.atan2(vectorB[1], vectorB[0]);
		return clockwiseSubsectRadians(divisions, angleA, angleB)
			.map(fnToVec2);
	};
	const counterClockwiseSubsect2 = (divisions, vectorA, vectorB) => {
		const angleA = Math.atan2(vectorA[1], vectorA[0]);
		const angleB = Math.atan2(vectorB[1], vectorB[0]);
		return counterClockwiseSubsectRadians(divisions, angleA, angleB)
			.map(fnToVec2);
	};
	const bisectLines2 = (vectorA, originA, vectorB, originB, epsilon = EPSILON) => {
		const determinant = cross2(vectorA, vectorB);
		const dotProd = dot(vectorA, vectorB);
		const bisects = determinant > -epsilon
			? [counterClockwiseBisect2(vectorA, vectorB)]
			: [clockwiseBisect2(vectorA, vectorB)];
		bisects[1] = determinant > -epsilon
			? rotate90(bisects[0])
			: rotate270(bisects[0]);
		const numerator = (originB[0] - originA[0]) * vectorB[1] - vectorB[0] * (originB[1] - originA[1]);
		const t = numerator / determinant;
		const normalized = [vectorA, vectorB].map(vec => normalize(vec));
		const isParallel = Math.abs(cross2(...normalized)) < epsilon;
		const origin = isParallel
			? midpoint(originA, originB)
			: [originA[0] + vectorA[0] * t, originA[1] + vectorA[1] * t];
		const solution = bisects.map(vector => ({ vector, origin }));
		if (isParallel) { delete solution[(dotProd > -epsilon ? 1 : 0)]; }
		return solution;
	};
	const counterClockwiseOrderRadians = function () {
		const radians = Array.from(arguments).flat();
		const counter_clockwise = radians
			.map((_, i) => i)
			.sort((a, b) => radians[a] - radians[b]);
		return counter_clockwise
			.slice(counter_clockwise.indexOf(0), counter_clockwise.length)
			.concat(counter_clockwise.slice(0, counter_clockwise.indexOf(0)));
	};
	const counterClockwiseOrder2 = function () {
		return counterClockwiseOrderRadians(
			semiFlattenArrays(arguments).map(fnVec2Angle),
		);
	};
	const counterClockwiseSectorsRadians = function () {
		const radians = Array.from(arguments).flat();
		const ordered = counterClockwiseOrderRadians(radians)
			.map(i => radians[i]);
		return ordered.map((rad, i, arr) => [rad, arr[(i + 1) % arr.length]])
			.map(pair => counterClockwiseAngleRadians(pair[0], pair[1]));
	};
	const counterClockwiseSectors2 = function () {
		return counterClockwiseSectorsRadians(
			semiFlattenArrays(arguments).map(fnVec2Angle),
		);
	};
	const threePointTurnDirection = (p0, p1, p2, epsilon = EPSILON) => {
		const v = normalize2(subtract2(p1, p0));
		const u = normalize2(subtract2(p2, p0));
		const cross = cross2(v, u);
		if (!fnEpsilonEqual(cross, 0, epsilon)) {
			return Math.sign(cross);
		}
		return fnEpsilonEqual(distance2(p0, p1) + distance2(p1, p2), distance2(p0, p2))
			? 0
			: undefined;
	};
	var radial = Object.freeze({
		__proto__: null,
		isCounterClockwiseBetween: isCounterClockwiseBetween,
		clockwiseAngleRadians: clockwiseAngleRadians,
		counterClockwiseAngleRadians: counterClockwiseAngleRadians,
		clockwiseAngle2: clockwiseAngle2,
		counterClockwiseAngle2: counterClockwiseAngle2,
		clockwiseBisect2: clockwiseBisect2,
		counterClockwiseBisect2: counterClockwiseBisect2,
		clockwiseSubsectRadians: clockwiseSubsectRadians,
		counterClockwiseSubsectRadians: counterClockwiseSubsectRadians,
		clockwiseSubsect2: clockwiseSubsect2,
		counterClockwiseSubsect2: counterClockwiseSubsect2,
		bisectLines2: bisectLines2,
		counterClockwiseOrderRadians: counterClockwiseOrderRadians,
		counterClockwiseOrder2: counterClockwiseOrder2,
		counterClockwiseSectorsRadians: counterClockwiseSectorsRadians,
		counterClockwiseSectors2: counterClockwiseSectors2,
		threePointTurnDirection: threePointTurnDirection
	});
	const mirror = (arr) => arr.concat(arr.slice(0, -1).reverse());
	const convexHullIndices = (points = [], includeCollinear = false, epsilon = EPSILON) => {
		if (points.length < 2) { return []; }
		const order = radialSortPointIndices(points, epsilon)
			.map(arr => (arr.length === 1 ? arr : mirror(arr)))
			.flat();
		order.push(order[0]);
		const stack = [order[0]];
		let i = 1;
		const funcs = {
			"-1": () => stack.pop(),
			1: (next) => { stack.push(next); i += 1; },
			undefined: () => { i += 1; },
		};
		funcs[0] = includeCollinear ? funcs["1"] : funcs["-1"];
		while (i < order.length) {
			if (stack.length < 2) {
				stack.push(order[i]);
				i += 1;
				continue;
			}
			const prev = stack[stack.length - 2];
			const curr = stack[stack.length - 1];
			const next = order[i];
			const turn = threePointTurnDirection(...[prev, curr, next].map(j => points[j]), epsilon);
			funcs[turn](next);
		}
		stack.pop();
		return stack;
	};
	const convexHull = (points = [], includeCollinear = false, epsilon = EPSILON) => (
		convexHullIndices(points, includeCollinear, epsilon)
			.map(i => points[i]));
	var convexHullMethods = Object.freeze({
		__proto__: null,
		convexHullIndices: convexHullIndices,
		convexHull: convexHull
	});
	var Constructors = Object.create(null);
	const vectorOriginForm = (vector, origin) => ({
		vector: vector || [],
		origin: origin || [],
	});
	const getVector = function () {
		if (arguments[0] instanceof Constructors.vector) { return arguments[0]; }
		let list = flattenArrays(arguments);
		if (list.length > 0
			&& typeof list[0] === "object"
			&& list[0] !== null
			&& !Number.isNaN(list[0].x)) {
			list = ["x", "y", "z"]
				.map(c => list[0][c])
				.filter(fnNotUndefined);
		}
		return list.filter(n => typeof n === "number");
	};
	const getVectorOfVectors = function () {
		return semiFlattenArrays(arguments)
			.map(el => getVector(el));
	};
	const getSegment = function () {
		if (arguments[0] instanceof Constructors.segment) {
			return arguments[0];
		}
		const args = semiFlattenArrays(arguments);
		if (args.length === 4) {
			return [
				[args[0], args[1]],
				[args[2], args[3]],
			];
		}
		return args.map(el => getVector(el));
	};
	const getLine$1 = function () {
		const args = semiFlattenArrays(arguments);
		if (args.length === 0) { return vectorOriginForm([], []); }
		if (args[0] instanceof Constructors.line
			|| args[0] instanceof Constructors.ray
			|| args[0] instanceof Constructors.segment) { return args[0]; }
		if (args[0].constructor === Object && args[0].vector !== undefined) {
			return vectorOriginForm(args[0].vector || [], args[0].origin || []);
		}
		return typeof args[0] === "number"
			? vectorOriginForm(getVector(args))
			: vectorOriginForm(...args.map(a => getVector(a)));
	};
	const getRectParams = (x = 0, y = 0, width = 0, height = 0) => ({
		x, y, width, height,
	});
	const getRect = function () {
		if (arguments[0] instanceof Constructors.rect) { return arguments[0]; }
		const list = flattenArrays(arguments);
		if (list.length > 0
			&& typeof list[0] === "object"
			&& list[0] !== null
			&& !Number.isNaN(list[0].width)) {
			return getRectParams(...["x", "y", "width", "height"]
				.map(c => list[0][c])
				.filter(fnNotUndefined));
		}
		const numbers = list.filter(n => typeof n === "number");
		const rectParams = numbers.length < 4
			? [, , ...numbers]
			: numbers;
		return getRectParams(...rectParams);
	};
	const getCircleParams = (radius = 1, ...args) => ({
		radius,
		origin: [...args],
	});
	const getCircle = function () {
		if (arguments[0] instanceof Constructors.circle) { return arguments[0]; }
		const vectors = getVectorOfVectors(arguments);
		const numbers = flattenArrays(arguments).filter(a => typeof a === "number");
		if (arguments.length === 2) {
			if (vectors[1].length === 1) {
				return getCircleParams(vectors[1][0], ...vectors[0]);
			}
			if (vectors[0].length === 1) {
				return getCircleParams(vectors[0][0], ...vectors[1]);
			}
			if (vectors[0].length > 1 && vectors[1].length > 1) {
				return getCircleParams(distance2(...vectors), ...vectors[0]);
			}
		} else {
			switch (numbers.length) {
			case 0: return getCircleParams(1, 0, 0, 0);
			case 1: return getCircleParams(numbers[0], 0, 0, 0);
			default: return getCircleParams(numbers.pop(), ...numbers);
			}
		}
		return getCircleParams(1, 0, 0, 0);
	};
	const maps3x4 = [
		[0, 1, 3, 4, 9, 10],
		[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
		[0, 1, 2, undefined, 3, 4, 5, undefined, 6, 7, 8, undefined, 9, 10, 11],
	];
	[11, 7, 3].forEach(i => delete maps3x4[2][i]);
	const matrixMap3x4 = len => {
		let i;
		if (len < 8) i = 0;
		else if (len < 13) i = 1;
		else i = 2;
		return maps3x4[i];
	};
	const getMatrix3x4 = function () {
		const mat = flattenArrays(arguments);
		const matrix = [...identity3x4];
		matrixMap3x4(mat.length)
			.forEach((n, i) => { if (mat[i] != null) { matrix[n] = mat[i]; } });
		return matrix;
	};
	const intersectLineLine = (
		aVector,
		aOrigin,
		bVector,
		bOrigin,
		aFunction = includeL,
		bFunction = includeL,
		epsilon = EPSILON,
	) => {
		const det_norm = cross2(normalize(aVector), normalize(bVector));
		if (Math.abs(det_norm) < epsilon) { return undefined; }
		const determinant0 = cross2(aVector, bVector);
		const determinant1 = -determinant0;
		const a2b = [bOrigin[0] - aOrigin[0], bOrigin[1] - aOrigin[1]];
		const b2a = [-a2b[0], -a2b[1]];
		const t0 = cross2(a2b, bVector) / determinant0;
		const t1 = cross2(b2a, aVector) / determinant1;
		if (aFunction(t0, epsilon / magnitude(aVector))
			&& bFunction(t1, epsilon / magnitude(bVector))) {
			return add(aOrigin, scale(aVector, t0));
		}
		return undefined;
	};
	const pleatParallel = (count, a, b) => {
		const origins = Array.from(Array(count - 1))
			.map((_, i) => (i + 1) / count)
			.map(t => lerp(a.origin, b.origin, t));
		const vector = [...a.vector];
		return origins.map(origin => ({ origin, vector }));
	};
	const pleatAngle = (count, a, b) => {
		const origin = intersectLineLine(a.vector, a.origin, b.vector, b.origin);
		const vectors = clockwiseAngle2(a.vector, b.vector) < counterClockwiseAngle2(a.vector, b.vector)
			? clockwiseSubsect2(count, a.vector, b.vector)
			: counterClockwiseSubsect2(count, a.vector, b.vector);
		return vectors.map(vector => ({ origin, vector }));
	};
	const pleat = (count, a, b) => {
		const lineA = getLine$1(a);
		const lineB = getLine$1(b);
		return parallel(lineA.vector, lineB.vector)
			? pleatParallel(count, lineA, lineB)
			: pleatAngle(count, lineA, lineB);
	};
	var pleatMethods = Object.freeze({
		__proto__: null,
		pleat: pleat
	});
	const angleArray = count => Array
		.from(Array(Math.floor(count)))
		.map((_, i) => TWO_PI * (i / count));
	const anglesToVecs = (angles, radius) => angles
		.map(a => [radius * Math.cos(a), radius * Math.sin(a)])
		.map(pt => pt.map(n => cleanNumber(n, 14)));
	const makePolygonCircumradius = (sides = 3, radius = 1) => (
		anglesToVecs(angleArray(sides), radius)
	);
	const makePolygonCircumradiusSide = (sides = 3, radius = 1) => {
		const halfwedge = Math.PI / sides;
		const angles = angleArray(sides).map(a => a + halfwedge);
		return anglesToVecs(angles, radius);
	};
	const makePolygonInradius = (sides = 3, radius = 1) => (
		makePolygonCircumradius(sides, radius / Math.cos(Math.PI / sides)));
	const makePolygonInradiusSide = (sides = 3, radius = 1) => (
		makePolygonCircumradiusSide(sides, radius / Math.cos(Math.PI / sides)));
	const makePolygonSideLength = (sides = 3, length = 1) => (
		makePolygonCircumradius(sides, (length / 2) / Math.sin(Math.PI / sides)));
	const makePolygonSideLengthSide = (sides = 3, length = 1) => (
		makePolygonCircumradiusSide(sides, (length / 2) / Math.sin(Math.PI / sides)));
	const makePolygonNonCollinear = (polygon, epsilon = EPSILON) => {
		const edges_vector = polygon
			.map((v, i, arr) => [v, arr[(i + 1) % arr.length]])
			.map(pair => subtract(pair[1], pair[0]));
		const vertex_collinear = edges_vector
			.map((vector, i, arr) => [vector, arr[(i + arr.length - 1) % arr.length]])
			.map(pair => !parallel(pair[1], pair[0], epsilon));
		return polygon
			.filter((vertex, v) => vertex_collinear[v]);
	};
	const circumcircle = function (a, b, c) {
		const A = b[0] - a[0];
		const B = b[1] - a[1];
		const C = c[0] - a[0];
		const D = c[1] - a[1];
		const E = A * (a[0] + b[0]) + B * (a[1] + b[1]);
		const F = C * (a[0] + c[0]) + D * (a[1] + c[1]);
		const G = 2 * (A * (c[1] - b[1]) - B * (c[0] - b[0]));
		if (Math.abs(G) < EPSILON) {
			const minx = Math.min(a[0], b[0], c[0]);
			const miny = Math.min(a[1], b[1], c[1]);
			const dx = (Math.max(a[0], b[0], c[0]) - minx) * 0.5;
			const dy = (Math.max(a[1], b[1], c[1]) - miny) * 0.5;
			return {
				origin: [minx + dx, miny + dy],
				radius: Math.sqrt(dx * dx + dy * dy),
			};
		}
		const origin = [(D * E - B * F) / G, (A * F - C * E) / G];
		const dx = origin[0] - a[0];
		const dy = origin[1] - a[1];
		return {
			origin,
			radius: Math.sqrt(dx * dx + dy * dy),
		};
	};
	const signedArea = points => 0.5 * points
		.map((el, i, arr) => {
			const next = arr[(i + 1) % arr.length];
			return el[0] * next[1] - next[0] * el[1];
		}).reduce(fnAdd, 0);
	const centroid = (points) => {
		const sixthArea = 1 / (6 * signedArea(points));
		return points.map((el, i, arr) => {
			const next = arr[(i + 1) % arr.length];
			const mag = el[0] * next[1] - next[0] * el[1];
			return [(el[0] + next[0]) * mag, (el[1] + next[1]) * mag];
		}).reduce((a, b) => [a[0] + b[0], a[1] + b[1]], [0, 0])
			.map(c => c * sixthArea);
	};
	const boundingBox$1 = (points, padding = 0) => {
		if (!points || !points.length) { return undefined; }
		const min = Array(points[0].length).fill(Infinity);
		const max = Array(points[0].length).fill(-Infinity);
		points.forEach(point => point
			.forEach((c, i) => {
				if (c < min[i]) { min[i] = c - padding; }
				if (c > max[i]) { max[i] = c + padding; }
			}));
		const span = max.map((m, i) => m - min[i]);
		return { min, max, span };
	};
	var polygonMethods = Object.freeze({
		__proto__: null,
		makePolygonCircumradius: makePolygonCircumradius,
		makePolygonCircumradiusSide: makePolygonCircumradiusSide,
		makePolygonInradius: makePolygonInradius,
		makePolygonInradiusSide: makePolygonInradiusSide,
		makePolygonSideLength: makePolygonSideLength,
		makePolygonSideLengthSide: makePolygonSideLengthSide,
		makePolygonNonCollinear: makePolygonNonCollinear,
		circumcircle: circumcircle,
		signedArea: signedArea,
		centroid: centroid,
		boundingBox: boundingBox$1
	});
	const overlapLinePoint = (vector, origin, point, func = excludeL, epsilon = EPSILON) => {
		const p2p = subtract(point, origin);
		const lineMagSq = magSquared(vector);
		const lineMag = Math.sqrt(lineMagSq);
		if (lineMag < epsilon) { return false; }
		const cross = cross2(p2p, vector.map(n => n / lineMag));
		const proj = dot(p2p, vector) / lineMagSq;
		return Math.abs(cross) < epsilon && func(proj, epsilon / lineMag);
	};
	const splitConvexPolygon = (poly, lineVector, linePoint) => {
		const vertices_intersections = poly.map((v, i) => {
			const intersection = overlapLinePoint(lineVector, linePoint, v, includeL);
			return { point: intersection ? v : null, at_index: i };
		}).filter(el => el.point != null);
		const edges_intersections = poly.map((v, i, arr) => ({
			point: intersectLineLine(
				lineVector,
				linePoint,
				subtract(v, arr[(i + 1) % arr.length]),
				arr[(i + 1) % arr.length],
				excludeL,
				excludeS,
			),
			at_index: i,
		}))
			.filter(el => el.point != null);
		if (edges_intersections.length === 2) {
			const sorted_edges = edges_intersections.slice()
				.sort((a, b) => a.at_index - b.at_index);
			const face_a = poly
				.slice(sorted_edges[1].at_index + 1)
				.concat(poly.slice(0, sorted_edges[0].at_index + 1));
			face_a.push(sorted_edges[0].point);
			face_a.push(sorted_edges[1].point);
			const face_b = poly
				.slice(sorted_edges[0].at_index + 1, sorted_edges[1].at_index + 1);
			face_b.push(sorted_edges[1].point);
			face_b.push(sorted_edges[0].point);
			return [face_a, face_b];
		}
		if (edges_intersections.length === 1 && vertices_intersections.length === 1) {
			vertices_intersections[0].type = "v";
			edges_intersections[0].type = "e";
			const sorted_geom = vertices_intersections.concat(edges_intersections)
				.sort((a, b) => a.at_index - b.at_index);
			const face_a = poly.slice(sorted_geom[1].at_index + 1)
				.concat(poly.slice(0, sorted_geom[0].at_index + 1));
			if (sorted_geom[0].type === "e") { face_a.push(sorted_geom[0].point); }
			face_a.push(sorted_geom[1].point);
			const face_b = poly
				.slice(sorted_geom[0].at_index + 1, sorted_geom[1].at_index + 1);
			if (sorted_geom[1].type === "e") { face_b.push(sorted_geom[1].point); }
			face_b.push(sorted_geom[0].point);
			return [face_a, face_b];
		}
		if (vertices_intersections.length === 2) {
			const sorted_vertices = vertices_intersections.slice()
				.sort((a, b) => a.at_index - b.at_index);
			const face_a = poly
				.slice(sorted_vertices[1].at_index)
				.concat(poly.slice(0, sorted_vertices[0].at_index + 1));
			const face_b = poly
				.slice(sorted_vertices[0].at_index, sorted_vertices[1].at_index + 1);
			return [face_a, face_b];
		}
		return [poly.slice()];
	};
	const recurseSkeleton = (points, lines, bisectors) => {
		const intersects = points
			.map((origin, i) => ({ vector: bisectors[i], origin }))
			.map((ray, i, arr) => intersectLineLine(
				ray.vector,
				ray.origin,
				arr[(i + 1) % arr.length].vector,
				arr[(i + 1) % arr.length].origin,
				excludeR,
				excludeR,
			));
		const projections = lines.map((line, i) => (
			nearestPointOnLine(line.vector, line.origin, intersects[i], a => a)
		));
		if (points.length === 3) {
			return points.map(p => ({ type: "skeleton", points: [p, intersects[0]] }))
				.concat([{ type: "perpendicular", points: [projections[0], intersects[0]] }]);
		}
		const projectionLengths = intersects
			.map((intersect, i) => distance(intersect, projections[i]));
		let shortest = 0;
		projectionLengths.forEach((len, i) => {
			if (len < projectionLengths[shortest]) { shortest = i; }
		});
		const solutions = [
			{
				type: "skeleton",
				points: [points[shortest], intersects[shortest]],
			},
			{
				type: "skeleton",
				points: [points[(shortest + 1) % points.length], intersects[shortest]],
			},
			{ type: "perpendicular", points: [projections[shortest], intersects[shortest]] },
		];
		const newVector = clockwiseBisect2(
			flip(lines[(shortest + lines.length - 1) % lines.length].vector),
			lines[(shortest + 1) % lines.length].vector,
		);
		const shortest_is_last_index = shortest === points.length - 1;
		points.splice(shortest, 2, intersects[shortest]);
		lines.splice(shortest, 1);
		bisectors.splice(shortest, 2, newVector);
		if (shortest_is_last_index) {
			points.splice(0, 1);
			bisectors.splice(0, 1);
			lines.push(lines.shift());
		}
		return solutions.concat(recurseSkeleton(points, lines, bisectors));
	};
	const straightSkeleton = (points) => {
		const lines = points
			.map((p, i, arr) => [p, arr[(i + 1) % arr.length]])
			.map(side => ({ vector: subtract(side[1], side[0]), origin: side[0] }));
		const bisectors = points
			.map((_, i, ar) => [(i - 1 + ar.length) % ar.length, i, (i + 1) % ar.length]
				.map(j => ar[j]))
			.map(p => [subtract(p[0], p[1]), subtract(p[2], p[1])])
			.map(v => clockwiseBisect2(...v));
		return recurseSkeleton([...points], lines, bisectors);
	};
	const collinearBetween = (p0, p1, p2, inclusive = false, epsilon = EPSILON) => {
		const similar = [p0, p2]
			.map(p => fnEpsilonEqualVectors(p1, p))
			.reduce((a, b) => a || b, false);
		if (similar) { return inclusive; }
		const vectors = [[p0, p1], [p1, p2]]
			.map(segment => subtract(segment[1], segment[0]))
			.map(vector => normalize(vector));
		return fnEpsilonEqual(1.0, dot(...vectors), epsilon);
	};
	var generalIntersect = Object.freeze({
		__proto__: null,
		collinearBetween: collinearBetween
	});
	const enclosingBoundingBoxes = (outer, inner) => {
		const dimensions = Math.min(outer.min.length, inner.min.length);
		for (let d = 0; d < dimensions; d += 1) {
			if (inner.min[d] < outer.min[d] || inner.max[d] > outer.max[d]) {
				return false;
			}
		}
		return true;
	};
	const enclosingPolygonPolygon = (outer, inner, fnInclusive = include) => {
		const outerGoesInside = outer
			.map(p => overlapConvexPolygonPoint(inner, p, fnInclusive))
			.reduce((a, b) => a || b, false);
		const innerGoesOutside = inner
			.map(p => overlapConvexPolygonPoint(inner, p, fnInclusive))
			.reduce((a, b) => a && b, true);
		return (!outerGoesInside && innerGoesOutside);
	};
	var encloses = Object.freeze({
		__proto__: null,
		enclosingBoundingBoxes: enclosingBoundingBoxes,
		enclosingPolygonPolygon: enclosingPolygonPolygon
	});
	const acosSafe = (x) => {
		if (x >= 1.0) return 0;
		if (x <= -1.0) return Math.PI;
		return Math.acos(x);
	};
	const rotateVector2 = (center, pt, a) => {
		const x = pt[0] - center[0];
		const y = pt[1] - center[1];
		const xRot = x * Math.cos(a) + y * Math.sin(a);
		const yRot = y * Math.cos(a) - x * Math.sin(a);
		return [center[0] + xRot, center[1] + yRot];
	};
	const intersectCircleCircle = (c1_radius, c1_origin, c2_radius, c2_origin, epsilon = EPSILON) => {
		const r = (c1_radius < c2_radius) ? c1_radius : c2_radius;
		const R = (c1_radius < c2_radius) ? c2_radius : c1_radius;
		const smCenter = (c1_radius < c2_radius) ? c1_origin : c2_origin;
		const bgCenter = (c1_radius < c2_radius) ? c2_origin : c1_origin;
		const vec = [smCenter[0] - bgCenter[0], smCenter[1] - bgCenter[1]];
		const d = Math.sqrt((vec[0] ** 2) + (vec[1] ** 2));
		if (d < epsilon) { return undefined; }
		const point = vec.map((v, i) => (v / d) * R + bgCenter[i]);
		if (Math.abs((R + r) - d) < epsilon
			|| Math.abs(R - (r + d)) < epsilon) { return [point]; }
		if ((d + r) < R || (R + r < d)) { return undefined; }
		const angle = acosSafe((r * r - d * d - R * R) / (-2.0 * d * R));
		const pt1 = rotateVector2(bgCenter, point, +angle);
		const pt2 = rotateVector2(bgCenter, point, -angle);
		return [pt1, pt2];
	};
	const intersectCircleLine = (
		circle_radius,
		circle_origin,
		line_vector,
		line_origin,
		line_func = includeL,
		epsilon = EPSILON,
	) => {
		const magSq = line_vector[0] ** 2 + line_vector[1] ** 2;
		const mag = Math.sqrt(magSq);
		const norm = mag === 0 ? line_vector : line_vector.map(c => c / mag);
		const rot90 = rotate90(norm);
		const bvec = subtract(line_origin, circle_origin);
		const det = cross2(bvec, norm);
		if (Math.abs(det) > circle_radius + epsilon) { return undefined; }
		const side = Math.sqrt((circle_radius ** 2) - (det ** 2));
		const f = (s, i) => circle_origin[i] - rot90[i] * det + norm[i] * s;
		const results = Math.abs(circle_radius - Math.abs(det)) < epsilon
			? [side].map((s) => [s, s].map(f))
			: [-side, side].map((s) => [s, s].map(f));
		const ts = results.map(res => res.map((n, i) => n - line_origin[i]))
			.map(v => v[0] * line_vector[0] + line_vector[1] * v[1])
			.map(d => d / magSq);
		return results.filter((_, i) => line_func(ts[i], epsilon));
	};
	const getUniquePair = (intersections) => {
		for (let i = 1; i < intersections.length; i += 1) {
			if (!fnEpsilonEqualVectors(intersections[0], intersections[i])) {
				return [intersections[0], intersections[i]];
			}
		}
		return undefined;
	};
	const intersectConvexPolygonLineInclusive = (
		poly,
		vector,
		origin,
		fn_poly = includeS,
		fn_line = includeL,
		epsilon = EPSILON,
	) => {
		const intersections = poly
			.map((p, i, arr) => [p, arr[(i + 1) % arr.length]])
			.map(side => intersectLineLine(
				subtract(side[1], side[0]),
				side[0],
				vector,
				origin,
				fn_poly,
				fn_line,
				epsilon,
			))
			.filter(a => a !== undefined);
		switch (intersections.length) {
		case 0: return undefined;
		case 1: return [intersections];
		default:
			return getUniquePair(intersections) || [intersections[0]];
		}
	};
	const intersectConvexPolygonLine = (
		poly,
		vector,
		origin,
		fn_poly = includeS,
		fn_line = excludeL,
		epsilon = EPSILON,
	) => {
		const sects = intersectConvexPolygonLineInclusive(
			poly,
			vector,
			origin,
			fn_poly,
			fn_line,
			epsilon,
		);
		let altFunc;
		switch (fn_line) {
		case excludeR: altFunc = includeR; break;
		case excludeS: altFunc = includeS; break;
		default: return sects;
		}
		const includes = intersectConvexPolygonLineInclusive(
			poly,
			vector,
			origin,
			includeS,
			altFunc,
			epsilon,
		);
		if (includes === undefined) { return undefined; }
		const uniqueIncludes = getUniquePair(includes);
		if (uniqueIncludes === undefined) {
			switch (fn_line) {
			case excludeR:
				return overlapConvexPolygonPoint(poly, origin, exclude, epsilon)
					? includes
					: undefined;
			case excludeS:
				return overlapConvexPolygonPoint(poly, add(origin, vector), exclude, epsilon)
					|| overlapConvexPolygonPoint(poly, origin, exclude, epsilon)
					? includes
					: undefined;
			case excludeL: return undefined;
			default: return undefined;
			}
		}
		return overlapConvexPolygonPoint(poly, midpoint(...uniqueIncludes), exclude, epsilon)
			? uniqueIncludes
			: sects;
	};
	const intersect_param_form = {
		polygon: a => [a],
		rect: a => [a],
		circle: a => [a.radius, a.origin],
		line: a => [a.vector, a.origin],
		ray: a => [a.vector, a.origin],
		segment: a => [a.vector, a.origin],
	};
	const intersect_func = {
		polygon: {
			line: (a, b, fnA, fnB, ep) => intersectConvexPolygonLine(...a, ...b, includeS, fnB, ep),
			ray: (a, b, fnA, fnB, ep) => intersectConvexPolygonLine(...a, ...b, includeS, fnB, ep),
			segment: (a, b, fnA, fnB, ep) => intersectConvexPolygonLine(...a, ...b, includeS, fnB, ep),
		},
		circle: {
			circle: (a, b, fnA, fnB, ep) => intersectCircleCircle(...a, ...b, ep),
			line: (a, b, fnA, fnB, ep) => intersectCircleLine(...a, ...b, fnB, ep),
			ray: (a, b, fnA, fnB, ep) => intersectCircleLine(...a, ...b, fnB, ep),
			segment: (a, b, fnA, fnB, ep) => intersectCircleLine(...a, ...b, fnB, ep),
		},
		line: {
			polygon: (a, b, fnA, fnB, ep) => intersectConvexPolygonLine(...b, ...a, includeS, fnA, ep),
			circle: (a, b, fnA, fnB, ep) => intersectCircleLine(...b, ...a, fnA, ep),
			line: (a, b, fnA, fnB, ep) => intersectLineLine(...a, ...b, fnA, fnB, ep),
			ray: (a, b, fnA, fnB, ep) => intersectLineLine(...a, ...b, fnA, fnB, ep),
			segment: (a, b, fnA, fnB, ep) => intersectLineLine(...a, ...b, fnA, fnB, ep),
		},
		ray: {
			polygon: (a, b, fnA, fnB, ep) => intersectConvexPolygonLine(...b, ...a, includeS, fnA, ep),
			circle: (a, b, fnA, fnB, ep) => intersectCircleLine(...b, ...a, fnA, ep),
			line: (a, b, fnA, fnB, ep) => intersectLineLine(...b, ...a, fnB, fnA, ep),
			ray: (a, b, fnA, fnB, ep) => intersectLineLine(...a, ...b, fnA, fnB, ep),
			segment: (a, b, fnA, fnB, ep) => intersectLineLine(...a, ...b, fnA, fnB, ep),
		},
		segment: {
			polygon: (a, b, fnA, fnB, ep) => intersectConvexPolygonLine(...b, ...a, includeS, fnA, ep),
			circle: (a, b, fnA, fnB, ep) => intersectCircleLine(...b, ...a, fnA, ep),
			line: (a, b, fnA, fnB, ep) => intersectLineLine(...b, ...a, fnB, fnA, ep),
			ray: (a, b, fnA, fnB, ep) => intersectLineLine(...b, ...a, fnB, fnA, ep),
			segment: (a, b, fnA, fnB, ep) => intersectLineLine(...a, ...b, fnA, fnB, ep),
		},
	};
	const similar_intersect_types = {
		polygon: "polygon",
		rect: "polygon",
		circle: "circle",
		line: "line",
		ray: "ray",
		segment: "segment",
	};
	const default_intersect_domain_function = {
		polygon: exclude,
		rect: exclude,
		circle: exclude,
		line: excludeL,
		ray: excludeR,
		segment: excludeS,
	};
	const intersect = function (a, b, epsilon) {
		const type_a = typeOf(a);
		const type_b = typeOf(b);
		const aT = similar_intersect_types[type_a];
		const bT = similar_intersect_types[type_b];
		const params_a = intersect_param_form[type_a](a);
		const params_b = intersect_param_form[type_b](b);
		const domain_a = a.domain_function || default_intersect_domain_function[type_a];
		const domain_b = b.domain_function || default_intersect_domain_function[type_b];
		return intersect_func[aT][bT](params_a, params_b, domain_a, domain_b, epsilon);
	};
	const overlapConvexPolygons = (poly1, poly2, epsilon = EPSILON) => {
		for (let p = 0; p < 2; p += 1) {
			const polyA = p === 0 ? poly1 : poly2;
			const polyB = p === 0 ? poly2 : poly1;
			for (let i = 0; i < polyA.length; i += 1) {
				const origin = polyA[i];
				const vector = rotate90(subtract(polyA[(i + 1) % polyA.length], polyA[i]));
				const projected = polyB
					.map(point => subtract(point, origin))
					.map(v => dot(vector, v));
				const other_test_point = polyA[(i + 2) % polyA.length];
				const side_a = dot(vector, subtract(other_test_point, origin));
				const side = side_a > 0;
				const one_sided = projected
					.map(dotProd => (side ? dotProd < epsilon : dotProd > -epsilon))
					.reduce((a, b) => a && b, true);
				if (one_sided) { return false; }
			}
		}
		return true;
	};
	const overlapCirclePoint = (radius, origin, point, func = exclude, epsilon = EPSILON) => (
		func(radius - distance2(origin, point), epsilon)
	);
	const overlapLineLine = (
		aVector,
		aOrigin,
		bVector,
		bOrigin,
		aFunction = excludeL,
		bFunction = excludeL,
		epsilon = EPSILON,
	) => {
		const denominator0 = cross2(aVector, bVector);
		const denominator1 = -denominator0;
		const a2b = [bOrigin[0] - aOrigin[0], bOrigin[1] - aOrigin[1]];
		if (Math.abs(denominator0) < epsilon) {
			if (Math.abs(cross2(a2b, aVector)) > epsilon) { return false; }
			const bPt1 = a2b;
			const bPt2 = add(bPt1, bVector);
			const aProjLen = dot(aVector, aVector);
			const bProj1 = dot(bPt1, aVector) / aProjLen;
			const bProj2 = dot(bPt2, aVector) / aProjLen;
			const bProjSm = bProj1 < bProj2 ? bProj1 : bProj2;
			const bProjLg = bProj1 < bProj2 ? bProj2 : bProj1;
			const bOutside1 = bProjSm > 1 - epsilon;
			const bOutside2 = bProjLg < epsilon;
			if (bOutside1 || bOutside2) { return false; }
			return true;
		}
		const b2a = [-a2b[0], -a2b[1]];
		const t0 = cross2(a2b, bVector) / denominator0;
		const t1 = cross2(b2a, aVector) / denominator1;
		return aFunction(t0, epsilon / magnitude(aVector))
			&& bFunction(t1, epsilon / magnitude(bVector));
	};
	const overlap_param_form = {
		polygon: a => [a],
		rect: a => [a],
		circle: a => [a.radius, a.origin],
		line: a => [a.vector, a.origin],
		ray: a => [a.vector, a.origin],
		segment: a => [a.vector, a.origin],
		vector: a => [a],
	};
	const overlap_func = {
		polygon: {
			polygon: (a, b, fnA, fnB, ep) => overlapConvexPolygons(...a, ...b, ep),
			vector: (a, b, fnA, fnB, ep) => overlapConvexPolygonPoint(...a, ...b, fnA, ep),
		},
		circle: {
			vector: (a, b, fnA, fnB, ep) => overlapCirclePoint(...a, ...b, exclude, ep),
		},
		line: {
			line: (a, b, fnA, fnB, ep) => overlapLineLine(...a, ...b, fnA, fnB, ep),
			ray: (a, b, fnA, fnB, ep) => overlapLineLine(...a, ...b, fnA, fnB, ep),
			segment: (a, b, fnA, fnB, ep) => overlapLineLine(...a, ...b, fnA, fnB, ep),
			vector: (a, b, fnA, fnB, ep) => overlapLinePoint(...a, ...b, fnA, ep),
		},
		ray: {
			line: (a, b, fnA, fnB, ep) => overlapLineLine(...b, ...a, fnB, fnA, ep),
			ray: (a, b, fnA, fnB, ep) => overlapLineLine(...a, ...b, fnA, fnB, ep),
			segment: (a, b, fnA, fnB, ep) => overlapLineLine(...a, ...b, fnA, fnB, ep),
			vector: (a, b, fnA, fnB, ep) => overlapLinePoint(...a, ...b, fnA, ep),
		},
		segment: {
			line: (a, b, fnA, fnB, ep) => overlapLineLine(...b, ...a, fnB, fnA, ep),
			ray: (a, b, fnA, fnB, ep) => overlapLineLine(...b, ...a, fnB, fnA, ep),
			segment: (a, b, fnA, fnB, ep) => overlapLineLine(...a, ...b, fnA, fnB, ep),
			vector: (a, b, fnA, fnB, ep) => overlapLinePoint(...a, ...b, fnA, ep),
		},
		vector: {
			polygon: (a, b, fnA, fnB, ep) => overlapConvexPolygonPoint(...b, ...a, fnB, ep),
			circle: (a, b, fnA, fnB, ep) => overlapCirclePoint(...b, ...a, exclude, ep),
			line: (a, b, fnA, fnB, ep) => overlapLinePoint(...b, ...a, fnB, ep),
			ray: (a, b, fnA, fnB, ep) => overlapLinePoint(...b, ...a, fnB, ep),
			segment: (a, b, fnA, fnB, ep) => overlapLinePoint(...b, ...a, fnB, ep),
			vector: (a, b, fnA, fnB, ep) => fnEpsilonEqualVectors(...a, ...b, ep),
		},
	};
	const similar_overlap_types = {
		polygon: "polygon",
		rect: "polygon",
		circle: "circle",
		line: "line",
		ray: "ray",
		segment: "segment",
		vector: "vector",
	};
	const default_overlap_domain_function = {
		polygon: exclude,
		rect: exclude,
		circle: exclude,
		line: excludeL,
		ray: excludeR,
		segment: excludeS,
		vector: excludeL,
	};
	const overlap = function (a, b, epsilon) {
		const type_a = typeOf(a);
		const type_b = typeOf(b);
		const aT = similar_overlap_types[type_a];
		const bT = similar_overlap_types[type_b];
		const params_a = overlap_param_form[type_a](a);
		const params_b = overlap_param_form[type_b](b);
		const domain_a = a.domain_function || default_overlap_domain_function[type_a];
		const domain_b = b.domain_function || default_overlap_domain_function[type_b];
		return overlap_func[aT][bT](params_a, params_b, domain_a, domain_b, epsilon);
	};
	const overlapBoundingBoxes = (box1, box2) => {
		const dimensions = Math.min(box1.min.length, box2.min.length);
		for (let d = 0; d < dimensions; d += 1) {
			if (box1.min[d] > box2.max[d] || box1.max[d] < box2.min[d]) {
				return false;
			}
		}
		return true;
	};
	const VectorArgs = function () {
		this.push(...getVector(arguments));
	};
	const VectorGetters = {
		x: function () { return this[0]; },
		y: function () { return this[1]; },
		z: function () { return this[2]; },
	};
	const table = {
		preserve: {
			magnitude: function () { return magnitude(this); },
			isEquivalent: function () {
				return fnEpsilonEqualVectors(this, getVector(arguments));
			},
			isParallel: function () {
				return parallel(...resizeUp(this, getVector(arguments)));
			},
			isCollinear: function (line) {
				return overlap(this, line);
			},
			dot: function () {
				return dot(...resizeUp(this, getVector(arguments)));
			},
			distanceTo: function () {
				return distance(...resizeUp(this, getVector(arguments)));
			},
			overlap: function (other) {
				return overlap(this, other);
			},
		},
		vector: {
			copy: function () { return [...this]; },
			normalize: function () { return normalize(this); },
			scale: function () { return scale(this, arguments[0]); },
			flip: function () { return flip(this); },
			rotate90: function () { return rotate90(this); },
			rotate270: function () { return rotate270(this); },
			cross: function () {
				return cross3(
					resize(3, this),
					resize(3, getVector(arguments)),
				);
			},
			transform: function () {
				return multiplyMatrix3Vector3(
					getMatrix3x4(arguments),
					resize(3, this),
				);
			},
			add: function () {
				return add(this, resize(this.length, getVector(arguments)));
			},
			subtract: function () {
				return subtract(this, resize(this.length, getVector(arguments)));
			},
			rotateZ: function (angle, origin) {
				return multiplyMatrix3Vector3(
					getMatrix3x4(makeMatrix2Rotate(angle, origin)),
					resize(3, this),
				);
			},
			lerp: function (vector, pct) {
				return lerp(this, resize(this.length, getVector(vector)), pct);
			},
			midpoint: function () {
				return midpoint(...resizeUp(this, getVector(arguments)));
			},
			bisect: function () {
				return counterClockwiseBisect2(this, getVector(arguments));
			},
		},
	};
	const VectorMethods = {};
	Object.keys(table.preserve).forEach(key => {
		VectorMethods[key] = table.preserve[key];
	});
	Object.keys(table.vector).forEach(key => {
		VectorMethods[key] = function () {
			return Constructors.vector(...table.vector[key].apply(this, arguments));
		};
	});
	const VectorStatic = {
		fromAngle: function (angle) {
			return Constructors.vector(Math.cos(angle), Math.sin(angle));
		},
		fromAngleDegrees: function (angle) {
			return Constructors.vector.fromAngle(angle * D2R);
		},
	};
	var Vector = {
		vector: {
			P: Array.prototype,
			A: VectorArgs,
			G: VectorGetters,
			M: VectorMethods,
			S: VectorStatic,
		},
	};
	var Static = {
		fromPoints: function () {
			const points = getVectorOfVectors(arguments);
			return this.constructor({
				vector: subtract(points[1], points[0]),
				origin: points[0],
			});
		},
		fromAngle: function () {
			const angle = arguments[0] || 0;
			return this.constructor({
				vector: [Math.cos(angle), Math.sin(angle)],
				origin: [0, 0],
			});
		},
		perpendicularBisector: function () {
			const points = getVectorOfVectors(arguments);
			return this.constructor({
				vector: rotate90(subtract(points[1], points[0])),
				origin: average(points[0], points[1]),
			});
		},
	};
	const LinesMethods = {
		isParallel: function () {
			const arr = resizeUp(this.vector, getLine$1(arguments).vector);
			return parallel(...arr);
		},
		isCollinear: function () {
			const line = getLine$1(arguments);
			return overlapLinePoint(this.vector, this.origin, line.origin)
				&& parallel(...resizeUp(this.vector, line.vector));
		},
		isDegenerate: function (epsilon = EPSILON) {
			return degenerate(this.vector, epsilon);
		},
		reflectionMatrix: function () {
			return Constructors.matrix(makeMatrix3ReflectZ(this.vector, this.origin));
		},
		nearestPoint: function () {
			const point = getVector(arguments);
			return Constructors.vector(
				nearestPointOnLine(this.vector, this.origin, point, this.clip_function),
			);
		},
		transform: function () {
			const dim = this.dimension;
			const r = multiplyMatrix3Line3(
				getMatrix3x4(arguments),
				resize(3, this.vector),
				resize(3, this.origin),
			);
			return this.constructor(resize(dim, r.vector), resize(dim, r.origin));
		},
		translate: function () {
			const origin = add(...resizeUp(this.origin, getVector(arguments)));
			return this.constructor(this.vector, origin);
		},
		intersect: function () {
			return intersect(this, ...arguments);
		},
		overlap: function () {
			return overlap(this, ...arguments);
		},
		bisect: function (lineType, epsilon) {
			const line = getLine$1(lineType);
			return bisectLines2(this.vector, this.origin, line.vector, line.origin, epsilon)
				.map(l => this.constructor(l));
		},
	};
	var Line = {
		line: {
			P: Object.prototype,
			A: function () {
				const l = getLine$1(...arguments);
				this.vector = Constructors.vector(l.vector);
				this.origin = Constructors.vector(resize(this.vector.length, l.origin));
				const alt = rayLineToUniqueLine({ vector: this.vector, origin: this.origin });
				this.normal = alt.normal;
				this.distance = alt.distance;
				Object.defineProperty(this, "domain_function", { writable: true, value: includeL });
			},
			G: {
				dimension: function () {
					return [this.vector, this.origin]
						.map(p => p.length)
						.reduce((a, b) => Math.max(a, b), 0);
				},
			},
			M: Object.assign({}, LinesMethods, {
				inclusive: function () { this.domain_function = includeL; return this; },
				exclusive: function () { this.domain_function = excludeL; return this; },
				clip_function: dist => dist,
				svgPath: function (length = 20000) {
					const start = add(this.origin, scale(this.vector, -length / 2));
					const end = scale(this.vector, length);
					return `M${start[0]} ${start[1]}l${end[0]} ${end[1]}`;
				},
			}),
			S: Object.assign({
				fromNormalDistance: function () {
					return this.constructor(uniqueLineToRayLine(arguments[0]));
				},
			}, Static),
		},
	};
	var Ray = {
		ray: {
			P: Object.prototype,
			A: function () {
				const ray = getLine$1(...arguments);
				this.vector = Constructors.vector(ray.vector);
				this.origin = Constructors.vector(resize(this.vector.length, ray.origin));
				Object.defineProperty(this, "domain_function", { writable: true, value: includeR });
			},
			G: {
				dimension: function () {
					return [this.vector, this.origin]
						.map(p => p.length)
						.reduce((a, b) => Math.max(a, b), 0);
				},
			},
			M: Object.assign({}, LinesMethods, {
				inclusive: function () { this.domain_function = includeR; return this; },
				exclusive: function () { this.domain_function = excludeR; return this; },
				flip: function () {
					return Constructors.ray(flip(this.vector), this.origin);
				},
				scale: function (scale) {
					return Constructors.ray(this.vector.scale(scale), this.origin);
				},
				normalize: function () {
					return Constructors.ray(this.vector.normalize(), this.origin);
				},
				clip_function: clampRay,
				svgPath: function (length = 10000) {
					const end = this.vector.scale(length);
					return `M${this.origin[0]} ${this.origin[1]}l${end[0]} ${end[1]}`;
				},
			}),
			S: Static,
		},
	};
	var Segment = {
		segment: {
			P: Array.prototype,
			A: function () {
				const a = getSegment(...arguments);
				this.push(...[a[0], a[1]].map(v => Constructors.vector(v)));
				this.vector = Constructors.vector(subtract(this[1], this[0]));
				this.origin = this[0];
				Object.defineProperty(this, "domain_function", { writable: true, value: includeS });
			},
			G: {
				points: function () { return this; },
				magnitude: function () { return magnitude(this.vector); },
				dimension: function () {
					return [this.vector, this.origin]
						.map(p => p.length)
						.reduce((a, b) => Math.max(a, b), 0);
				},
			},
			M: Object.assign({}, LinesMethods, {
				inclusive: function () { this.domain_function = includeS; return this; },
				exclusive: function () { this.domain_function = excludeS; return this; },
				clip_function: clampSegment,
				transform: function (...innerArgs) {
					const dim = this.points[0].length;
					const mat = getMatrix3x4(innerArgs);
					const transformed_points = this.points
						.map(point => resize(3, point))
						.map(point => multiplyMatrix3Vector3(mat, point))
						.map(point => resize(dim, point));
					return Constructors.segment(transformed_points);
				},
				translate: function () {
					const translate = getVector(arguments);
					const transformed_points = this.points
						.map(point => add(...resizeUp(point, translate)));
					return Constructors.segment(transformed_points);
				},
				midpoint: function () {
					return Constructors.vector(average(this.points[0], this.points[1]));
				},
				svgPath: function () {
					const pointStrings = this.points.map(p => `${p[0]} ${p[1]}`);
					return ["M", "L"].map((cmd, i) => `${cmd}${pointStrings[i]}`)
						.join("");
				},
			}),
			S: {
				fromPoints: function () {
					return this.constructor(...arguments);
				},
			},
		},
	};
	const CircleArgs = function () {
		const circle = getCircle(...arguments);
		this.radius = circle.radius;
		this.origin = Constructors.vector(...circle.origin);
	};
	const CircleGetters = {
		x: function () { return this.origin[0]; },
		y: function () { return this.origin[1]; },
		z: function () { return this.origin[2]; },
	};
	const pointOnEllipse = function (cx, cy, rx, ry, zRotation, arcAngle) {
		const cos_rotate = Math.cos(zRotation);
		const sin_rotate = Math.sin(zRotation);
		const cos_arc = Math.cos(arcAngle);
		const sin_arc = Math.sin(arcAngle);
		return [
			cx + cos_rotate * rx * cos_arc + -sin_rotate * ry * sin_arc,
			cy + sin_rotate * rx * cos_arc + cos_rotate * ry * sin_arc,
		];
	};
	const pathInfo = function (cx, cy, rx, ry, zRotation, arcStart_, deltaArc_) {
		let arcStart = arcStart_;
		if (arcStart < 0 && !Number.isNaN(arcStart)) {
			while (arcStart < 0) {
				arcStart += Math.PI * 2;
			}
		}
		const deltaArc = deltaArc_ > Math.PI * 2 ? Math.PI * 2 : deltaArc_;
		const start = pointOnEllipse(cx, cy, rx, ry, zRotation, arcStart);
		const middle = pointOnEllipse(cx, cy, rx, ry, zRotation, arcStart + deltaArc / 2);
		const end = pointOnEllipse(cx, cy, rx, ry, zRotation, arcStart + deltaArc);
		const fa = ((deltaArc / 2) > Math.PI) ? 1 : 0;
		const fs = ((deltaArc / 2) > 0) ? 1 : 0;
		return {
			x1: start[0],
			y1: start[1],
			x2: middle[0],
			y2: middle[1],
			x3: end[0],
			y3: end[1],
			fa,
			fs,
		};
	};
	const cln = n => cleanNumber(n, 4);
	const ellipticalArcTo = (rx, ry, phi_degrees, fa, fs, endX, endY) => (
		`A${cln(rx)} ${cln(ry)} ${cln(phi_degrees)} ${cln(fa)} ${cln(fs)} ${cln(endX)} ${cln(endY)}`
	);
	const CircleMethods = {
		nearestPoint: function () {
			return Constructors.vector(nearestPointOnCircle(
				this.radius,
				this.origin,
				getVector(arguments),
			));
		},
		intersect: function (object) {
			return intersect(this, object);
		},
		overlap: function (object) {
			return overlap(this, object);
		},
		svgPath: function (arcStart = 0, deltaArc = Math.PI * 2) {
			const info = pathInfo(this.origin[0], this.origin[1], this.radius, this.radius, 0, arcStart, deltaArc);
			const arc1 = ellipticalArcTo(this.radius, this.radius, 0, info.fa, info.fs, info.x2, info.y2);
			const arc2 = ellipticalArcTo(this.radius, this.radius, 0, info.fa, info.fs, info.x3, info.y3);
			return `M${info.x1} ${info.y1}${arc1}${arc2}`;
		},
		points: function (count = 128) {
			return Array.from(Array(count))
				.map((_, i) => ((2 * Math.PI) / count) * i)
				.map(angle => [
					this.origin[0] + this.radius * Math.cos(angle),
					this.origin[1] + this.radius * Math.sin(angle),
				]);
		},
		polygon: function () {
			return Constructors.polygon(this.points(arguments[0]));
		},
		segments: function () {
			const points = this.points(arguments[0]);
			return points.map((point, i) => {
				const nextI = (i + 1) % points.length;
				return [point, points[nextI]];
			});
		},
	};
	const CircleStatic = {
		fromPoints: function () {
			if (arguments.length === 3) {
				const result = circumcircle(...arguments);
				return this.constructor(result.radius, result.origin);
			}
			return this.constructor(...arguments);
		},
		fromThreePoints: function () {
			const result = circumcircle(...arguments);
			return this.constructor(result.radius, result.origin);
		},
	};
	var Circle = {
		circle: {
			A: CircleArgs,
			G: CircleGetters,
			M: CircleMethods,
			S: CircleStatic,
		},
	};
	const getFoci = function (center, rx, ry, spin) {
		const order = rx > ry;
		const lsq = order ? (rx ** 2) - (ry ** 2) : (ry ** 2) - (rx ** 2);
		const l = Math.sqrt(lsq);
		const trigX = order ? Math.cos(spin) : Math.sin(spin);
		const trigY = order ? Math.sin(spin) : Math.cos(spin);
		return [
			Constructors.vector(center[0] + l * trigX, center[1] + l * trigY),
			Constructors.vector(center[0] - l * trigX, center[1] - l * trigY),
		];
	};
	var Ellipse = {
		ellipse: {
			A: function () {
				const numbers = flattenArrays(arguments).filter(a => !Number.isNaN(a));
				const params = resize(5, numbers);
				this.rx = params[0];
				this.ry = params[1];
				this.origin = Constructors.vector(params[2], params[3]);
				this.spin = params[4];
				this.foci = getFoci(this.origin, this.rx, this.ry, this.spin);
			},
			G: {
				x: function () { return this.origin[0]; },
				y: function () { return this.origin[1]; },
			},
			M: {
				svgPath: function (arcStart = 0, deltaArc = Math.PI * 2) {
					const info = pathInfo(
						this.origin[0],
						this.origin[1],
						this.rx,
						this.ry,
						this.spin,
						arcStart,
						deltaArc,
					);
					const arc1 = ellipticalArcTo(this.rx, this.ry, (this.spin / Math.PI)
						* 180, info.fa, info.fs, info.x2, info.y2);
					const arc2 = ellipticalArcTo(this.rx, this.ry, (this.spin / Math.PI)
						* 180, info.fa, info.fs, info.x3, info.y3);
					return `M${info.x1} ${info.y1}${arc1}${arc2}`;
				},
				points: function (count = 128) {
					return Array.from(Array(count))
						.map((_, i) => ((2 * Math.PI) / count) * i)
						.map(angle => pointOnEllipse(
							this.origin.x,
							this.origin.y,
							this.rx,
							this.ry,
							this.spin,
							angle,
						));
				},
				polygon: function () {
					return Constructors.polygon(this.points(arguments[0]));
				},
				segments: function () {
					const points = this.points(arguments[0]);
					return points.map((point, i) => {
						const nextI = (i + 1) % points.length;
						return [point, points[nextI]];
					});
				},
			},
			S: {
			},
		},
	};
	const PolygonMethods = {
		area: function () {
			return signedArea(this);
		},
		centroid: function () {
			return Constructors.vector(centroid(this));
		},
		boundingBox: function () {
			return boundingBox$1(this);
		},
		straightSkeleton: function () {
			return straightSkeleton(this);
		},
		scale: function (magnitude, center = centroid(this)) {
			const newPoints = this
				.map(p => [0, 1].map((_, i) => p[i] - center[i]))
				.map(vec => vec.map((_, i) => center[i] + vec[i] * magnitude));
			return this.constructor.fromPoints(newPoints);
		},
		rotate: function (angle, centerPoint = centroid(this)) {
			const newPoints = this.map((p) => {
				const vec = [p[0] - centerPoint[0], p[1] - centerPoint[1]];
				const mag = Math.sqrt((vec[0] ** 2) + (vec[1] ** 2));
				const a = Math.atan2(vec[1], vec[0]);
				return [
					centerPoint[0] + Math.cos(a + angle) * mag,
					centerPoint[1] + Math.sin(a + angle) * mag,
				];
			});
			return Constructors.polygon(newPoints);
		},
		translate: function () {
			const vec = getVector(...arguments);
			const newPoints = this.map(p => p.map((n, i) => n + vec[i]));
			return this.constructor.fromPoints(newPoints);
		},
		transform: function () {
			const m = getMatrix3x4(...arguments);
			const newPoints = this
				.map(p => multiplyMatrix3Vector3(m, resize(3, p)));
			return Constructors.polygon(newPoints);
		},
		nearest: function () {
			const point = getVector(...arguments);
			const result = nearestPointOnPolygon(this, point);
			return result === undefined
				? undefined
				: Object.assign(result, { edge: this.sides[result.i] });
		},
		split: function () {
			const line = getLine$1(...arguments);
			const split_func = splitConvexPolygon;
			return split_func(this, line.vector, line.origin)
				.map(poly => Constructors.polygon(poly));
		},
		overlap: function () {
			return overlap(this, ...arguments);
		},
		intersect: function () {
			return intersect(this, ...arguments);
		},
		clip: function (line_type, epsilon) {
			const fn_line = line_type.domain_function ? line_type.domain_function : includeL;
			const segment = clipLineConvexPolygon(
				this,
				line_type.vector,
				line_type.origin,
				this.domain_function,
				fn_line,
				epsilon,
			);
			return segment ? Constructors.segment(segment) : undefined;
		},
		svgPath: function () {
			const pre = Array(this.length).fill("L");
			pre[0] = "M";
			return `${this.map((p, i) => `${pre[i]}${p[0]} ${p[1]}`).join("")}z`;
		},
	};
	const rectToPoints = r => [
		[r.x, r.y],
		[r.x + r.width, r.y],
		[r.x + r.width, r.y + r.height],
		[r.x, r.y + r.height],
	];
	const rectToSides = r => [
		[[r.x, r.y], [r.x + r.width, r.y]],
		[[r.x + r.width, r.y], [r.x + r.width, r.y + r.height]],
		[[r.x + r.width, r.y + r.height], [r.x, r.y + r.height]],
		[[r.x, r.y + r.height], [r.x, r.y]],
	];
	var Rect = {
		rect: {
			P: Array.prototype,
			A: function () {
				const r = getRect(...arguments);
				this.width = r.width;
				this.height = r.height;
				this.origin = Constructors.vector(r.x, r.y);
				this.push(...rectToPoints(this));
				Object.defineProperty(this, "domain_function", { writable: true, value: include });
			},
			G: {
				x: function () { return this.origin[0]; },
				y: function () { return this.origin[1]; },
				center: function () {
					return Constructors.vector(
						this.origin[0] + this.width / 2,
						this.origin[1] + this.height / 2,
					);
				},
			},
			M: Object.assign({}, PolygonMethods, {
				inclusive: function () { this.domain_function = include; return this; },
				exclusive: function () { this.domain_function = exclude; return this; },
				area: function () { return this.width * this.height; },
				segments: function () { return rectToSides(this); },
				svgPath: function () {
					return `M${this.origin.join(" ")}h${this.width}v${this.height}h${-this.width}Z`;
				},
			}),
			S: {
				fromPoints: function () {
					const box = boundingBox$1(getVectorOfVectors(arguments));
					return Constructors.rect(box.min[0], box.min[1], box.span[0], box.span[1]);
				},
			},
		},
	};
	var Polygon = {
		polygon: {
			P: Array.prototype,
			A: function () {
				this.push(...semiFlattenArrays(arguments));
				this.sides = this
					.map((p, i, arr) => [p, arr[(i + 1) % arr.length]]);
				this.vectors = this.sides.map(side => subtract(side[1], side[0]));
				Object.defineProperty(this, "domain_function", { writable: true, value: include });
			},
			G: {
				isConvex: function () {
					return undefined;
				},
				points: function () {
					return this;
				},
			},
			M: Object.assign({}, PolygonMethods, {
				inclusive: function () { this.domain_function = include; return this; },
				exclusive: function () { this.domain_function = exclude; return this; },
				segments: function () {
					return this.sides;
				},
			}),
			S: {
				fromPoints: function () {
					return this.constructor(...arguments);
				},
				regularPolygon: function () {
					return this.constructor(makePolygonCircumradius(...arguments));
				},
				convexHull: function () {
					return this.constructor(convexHull(...arguments));
				},
			},
		},
	};
	var Polyline = {
		polyline: {
			P: Array.prototype,
			A: function () {
				this.push(...semiFlattenArrays(arguments));
			},
			G: {
				points: function () {
					return this;
				},
			},
			M: {
				svgPath: function () {
					const pre = Array(this.length).fill("L");
					pre[0] = "M";
					return `${this.map((p, i) => `${pre[i]}${p[0]} ${p[1]}`).join("")}`;
				},
			},
			S: {
				fromPoints: function () {
					return this.constructor(...arguments);
				},
			},
		},
	};
	const array_assign = (thisMat, mat) => {
		for (let i = 0; i < 12; i += 1) {
			thisMat[i] = mat[i];
		}
		return thisMat;
	};
	var Matrix = {
		matrix: {
			P: Array.prototype,
			A: function () {
				getMatrix3x4(arguments).forEach(m => this.push(m));
			},
			G: {
			},
			M: {
				copy: function () { return Constructors.matrix(...Array.from(this)); },
				set: function () {
					return array_assign(this, getMatrix3x4(arguments));
				},
				isIdentity: function () { return isIdentity3x4(this); },
				multiply: function (mat) {
					return array_assign(this, multiplyMatrices3(this, mat));
				},
				determinant: function () {
					return determinant3(this);
				},
				inverse: function () {
					return array_assign(this, invertMatrix3(this));
				},
				translate: function (x, y, z) {
					return array_assign(
						this,
						multiplyMatrices3(this, makeMatrix3Translate(x, y, z)),
					);
				},
				rotateX: function (radians) {
					return array_assign(
						this,
						multiplyMatrices3(this, makeMatrix3RotateX(radians)),
					);
				},
				rotateY: function (radians) {
					return array_assign(
						this,
						multiplyMatrices3(this, makeMatrix3RotateY(radians)),
					);
				},
				rotateZ: function (radians) {
					return array_assign(
						this,
						multiplyMatrices3(this, makeMatrix3RotateZ(radians)),
					);
				},
				rotate: function (radians, vector, origin) {
					const transform = makeMatrix3Rotate(radians, vector, origin);
					return array_assign(this, multiplyMatrices3(this, transform));
				},
				scale: function (...args) {
					return array_assign(
						this,
						multiplyMatrices3(this, makeMatrix3Scale(...args)),
					);
				},
				reflectZ: function (vector, origin) {
					const transform = makeMatrix3ReflectZ(vector, origin);
					return array_assign(this, multiplyMatrices3(this, transform));
				},
				transform: function (...innerArgs) {
					return Constructors.vector(
						multiplyMatrix3Vector3(this, resize(3, getVector(innerArgs))),
					);
				},
				transformVector: function (vector) {
					return Constructors.vector(
						multiplyMatrix3Vector3(this, resize(3, getVector(vector))),
					);
				},
				transformLine: function (...innerArgs) {
					const l = getLine$1(innerArgs);
					return Constructors.line(multiplyMatrix3Line3(this, l.vector, l.origin));
				},
			},
			S: {},
		},
	};
	const Definitions = Object.assign(
		{},
		Vector,
		Line,
		Ray,
		Segment,
		Circle,
		Ellipse,
		Rect,
		Polygon,
		Polyline,
		Matrix,
	);
	const create = function (primitiveName, args) {
		const a = Object.create(Definitions[primitiveName].proto);
		Definitions[primitiveName].A.apply(a, args);
		return a;
	};
	const vector = function () { return create("vector", arguments); };
	const line = function () { return create("line", arguments); };
	const ray = function () { return create("ray", arguments); };
	const segment = function () { return create("segment", arguments); };
	const circle = function () { return create("circle", arguments); };
	const ellipse = function () { return create("ellipse", arguments); };
	const rect = function () { return create("rect", arguments); };
	const polygon = function () { return create("polygon", arguments); };
	const polyline = function () { return create("polyline", arguments); };
	const matrix = function () { return create("matrix", arguments); };
	Object.assign(Constructors, {
		vector,
		line,
		ray,
		segment,
		circle,
		ellipse,
		rect,
		polygon,
		polyline,
		matrix,
	});
	Object.keys(Definitions).forEach(primitiveName => {
		const Proto = {};
		Proto.prototype = Definitions[primitiveName].P != null
			? Object.create(Definitions[primitiveName].P)
			: Object.create(Object.prototype);
		Proto.prototype.constructor = Proto;
		Constructors[primitiveName].prototype = Proto.prototype;
		Constructors[primitiveName].prototype.constructor = Constructors[primitiveName];
		Object.keys(Definitions[primitiveName].G)
			.forEach(key => Object.defineProperty(Proto.prototype, key, {
				get: Definitions[primitiveName].G[key],
			}));
		Object.keys(Definitions[primitiveName].M)
			.forEach(key => Object.defineProperty(Proto.prototype, key, {
				value: Definitions[primitiveName].M[key],
			}));
		Object.keys(Definitions[primitiveName].S)
			.forEach(key => Object.defineProperty(Constructors[primitiveName], key, {
				value: Definitions[primitiveName].S[key]
					.bind(Constructors[primitiveName].prototype),
			}));
		Definitions[primitiveName].proto = Proto.prototype;
	});
	const math = Constructors;
	math.core = Object.assign(
		Object.create(null),
		constants,
		resizers,
		functions,
		algebra,
		sortMethods$1,
		radial,
		convexHullMethods,
		pleatMethods,
		polygonMethods,
		radial,
		matrix2,
		matrix3,
		matrix4,
		quaternion,
		nearest$1,
		parameterize,
		generalIntersect,
		encloses,
		{
			typeOf,
			intersect,
			overlap,
			clipLineConvexPolygon,
			clipPolygonPolygon,
			splitConvexPolygon,
			straightSkeleton,
			intersectConvexPolygonLine,
			intersectCircleCircle,
			intersectCircleLine,
			intersectLineLine,
			overlapConvexPolygons,
			overlapConvexPolygonPoint,
			overlapBoundingBoxes,
			overlapLineLine,
			overlapLinePoint,
		},
	);

	const vertex_degree = function (v, i) {
		const graph = this;
		Object.defineProperty(v, "degree", {
			get: () => (graph.vertices_vertices && graph.vertices_vertices[i]
				? graph.vertices_vertices[i].length
				: null),
		});
	};
	const edge_coords = function (e, i) {
		const graph = this;
		Object.defineProperty(e, "coords", {
			get: () => {
				if (!graph.edges_vertices
					|| !graph.edges_vertices[i]
					|| !graph.vertices_coords) {
					return undefined;
				}
				return graph.edges_vertices[i].map(v => graph.vertices_coords[v]);
			},
		});
	};
	const face_simple = function (f, i) {
		const graph = this;
		Object.defineProperty(f, "simple", {
			get: () => {
				if (!graph.faces_vertices || !graph.faces_vertices[i]) { return null; }
				for (let j = 0; j < f.length - 1; j += 1) {
					for (let k = j + 1; k < f.length; k += 1) {
						if (graph.faces_vertices[i][j] === graph.faces_vertices[i][k]) {
							return false;
						}
					}
				}
				return true;
			},
		});
	};
	const face_coords = function (f, i) {
		const graph = this;
		Object.defineProperty(f, "coords", {
			get: () => {
				if (!graph.faces_vertices
					|| !graph.faces_vertices[i]
					|| !graph.vertices_coords) {
					return undefined;
				}
				return graph.faces_vertices[i].map(v => graph.vertices_coords[v]);
			},
		});
	};
	const setup_vertex = function (v, i) {
		vertex_degree.call(this, v, i);
		return v;
	};
	const setup_edge = function (e, i) {
		edge_coords.call(this, e, i);
		return e;
	};
	const setup_face = function (f, i) {
		face_simple.call(this, f, i);
		face_coords.call(this, f, i);
		return f;
	};
	var setup = {
		vertices: setup_vertex,
		edges: setup_edge,
		faces: setup_face,
	};

	const foldKeys = {
		file: [
			"file_spec",
			"file_creator",
			"file_author",
			"file_title",
			"file_description",
			"file_classes",
			"file_frames",
		],
		frame: [
			"frame_author",
			"frame_title",
			"frame_description",
			"frame_attributes",
			"frame_classes",
			"frame_unit",
			"frame_parent",
			"frame_inherit",
		],
		graph: [
			"vertices_coords",
			"vertices_vertices",
			"vertices_faces",
			"edges_vertices",
			"edges_faces",
			"edges_assignment",
			"edges_foldAngle",
			"edges_length",
			"faces_vertices",
			"faces_edges",
			"vertices_edges",
			"edges_edges",
			"faces_faces",
		],
		orders: [
			"edgeOrders",
			"faceOrders",
		],
	};
	const foldFileClasses = [
		"singleModel",
		"multiModel",
		"animation",
		"diagrams",
	];
	const foldFrameClasses = [
		"creasePattern",
		"foldedForm",
		"graph",
		"linkage",
	];
	const foldFrameAttributes = [
		"2D",
		"3D",
		"abstract",
		"manifold",
		"nonManifold",
		"orientable",
		"nonOrientable",
		"selfTouching",
		"nonSelfTouching",
		"selfIntersecting",
		"nonSelfIntersecting",
	];

	var foldKeyMethods = /*#__PURE__*/Object.freeze({
		__proto__: null,
		foldKeys: foldKeys,
		foldFileClasses: foldFileClasses,
		foldFrameClasses: foldFrameClasses,
		foldFrameAttributes: foldFrameAttributes
	});

	const singularize = {
		vertices: "vertex",
		edges: "edge",
		faces: "face",
	};
	const pluralize = {
		vertex: "vertices",
		edge: "edges",
		face: "faces",
	};
	const edgesAssignmentValues = Array.from("BbMmVvFfJjUu");
	const edgesAssignmentNames = {
		b: "boundary",
		m: "mountain",
		v: "valley",
		f: "flat",
		j: "join",
		u: "unassigned",
	};
	Object.keys(edgesAssignmentNames).forEach(key => {
		edgesAssignmentNames[key.toUpperCase()] = edgesAssignmentNames[key];
	});
	const edgesAssignmentDegrees = {
		M: -180,
		m: -180,
		V: 180,
		v: 180,
		B: 0,
		b: 0,
		F: 0,
		f: 0,
		J: 0,
		j: 0,
		U: 0,
		u: 0,
	};
	const edgeAssignmentToFoldAngle = assignment => (
		edgesAssignmentDegrees[assignment] || 0
	);
	const edgeFoldAngleToAssignment = (a) => {
		if (a > math.core.EPSILON) { return "V"; }
		if (a < -math.core.EPSILON) { return "M"; }
		return "U";
	};
	const edgeFoldAngleIsFlat = angle => math.core.fnEpsilonEqual(0, angle)
	 || math.core.fnEpsilonEqual(-180, angle)
	 || math.core.fnEpsilonEqual(180, angle);
	const edgesFoldAngleAreAllFlat = ({ edges_foldAngle }) => {
		if (!edges_foldAngle) { return true; }
		for (let i = 0; i < edges_foldAngle.length; i += 1) {
			if (!edgeFoldAngleIsFlat(edges_foldAngle[i])) { return false; }
		}
		return true;
	};
	const filterKeysWithSuffix = (graph, suffix) => Object
		.keys(graph)
		.map(s => (s.substring(s.length - suffix.length, s.length) === suffix
			? s : undefined))
		.filter(str => str !== undefined);
	const filterKeysWithPrefix = (obj, prefix) => Object
		.keys(obj)
		.map(str => (str.substring(0, prefix.length) === prefix
			? str : undefined))
		.filter(str => str !== undefined);
	const getGraphKeysWithPrefix = (graph, key) => (
		filterKeysWithPrefix(graph, `${key}_`)
	);
	const getGraphKeysWithSuffix = (graph, key) => (
		filterKeysWithSuffix(graph, `_${key}`)
	);
	const transposeGraphArrays = (graph, geometry_key) => {
		const matching_keys = getGraphKeysWithPrefix(graph, geometry_key);
		if (matching_keys.length === 0) { return []; }
		const len = Math.max(...matching_keys.map(arr => graph[arr].length));
		const geometry = Array.from(Array(len))
			.map(() => ({}));
		matching_keys
			.forEach(key => geometry
				.forEach((o, i) => { geometry[i][key] = graph[key][i]; }));
		return geometry;
	};
	const transposeGraphArrayAtIndex = (
		graph,
		geometry_key,
		index,
	) => {
		const matching_keys = getGraphKeysWithPrefix(graph, geometry_key);
		if (matching_keys.length === 0) { return undefined; }
		const geometry = {};
		matching_keys.forEach((key) => { geometry[key] = graph[key][index]; });
		return geometry;
	};
	const flatFoldKeys = Object.freeze([]
		.concat(foldKeys.file)
		.concat(foldKeys.frame)
		.concat(foldKeys.graph)
		.concat(foldKeys.orders));
	const isFoldObject = (object = {}) => (
		Object.keys(object).length === 0
			? 0
			: flatFoldKeys
				.filter(key => object[key]).length / Object.keys(object).length);

	var foldSpecMethods = /*#__PURE__*/Object.freeze({
		__proto__: null,
		singularize: singularize,
		pluralize: pluralize,
		edgesAssignmentValues: edgesAssignmentValues,
		edgesAssignmentNames: edgesAssignmentNames,
		edgeAssignmentToFoldAngle: edgeAssignmentToFoldAngle,
		edgeFoldAngleToAssignment: edgeFoldAngleToAssignment,
		edgeFoldAngleIsFlat: edgeFoldAngleIsFlat,
		edgesFoldAngleAreAllFlat: edgesFoldAngleAreAllFlat,
		filterKeysWithSuffix: filterKeysWithSuffix,
		filterKeysWithPrefix: filterKeysWithPrefix,
		getGraphKeysWithPrefix: getGraphKeysWithPrefix,
		getGraphKeysWithSuffix: getGraphKeysWithSuffix,
		transposeGraphArrays: transposeGraphArrays,
		transposeGraphArrayAtIndex: transposeGraphArrayAtIndex,
		isFoldObject: isFoldObject
	});

	const verticesClusters = ({ vertices_coords }, epsilon = math.core.EPSILON) => {
		if (!vertices_coords) { return []; }
		const clusters = [];
		const finished = [];
		const vertices = vertices_coords
			.map((point, i) => ({ i, d: point[0] }))
			.sort((a, b) => a.d - b.d)
			.map(a => a.i);
		let rangeStart = 0;
		let yRange = [0, 0];
		let xRange = [0, 0];
		const isInsideCluster = (index) => (
			vertices_coords[index][0] > xRange[0]
			&& vertices_coords[index][0] < xRange[1]
			&& vertices_coords[index][1] > yRange[0]
			&& vertices_coords[index][1] < yRange[1]
		);
		const updateRange = (cluster) => {
			const newVertex = cluster[cluster.length - 1];
			while (vertices_coords[newVertex] - vertices_coords[cluster[rangeStart]] > epsilon) {
				rangeStart += 1;
			}
			const points = cluster.slice(rangeStart, cluster.length)
				.map(v => vertices_coords[v]);
			const ys = points.map(p => p[1]);
			yRange = [Math.min(...ys) - epsilon, Math.max(...ys) + epsilon];
			xRange = [points[0][0] - epsilon, points[points.length - 1][0] + epsilon];
		};
		while (finished.length !== vertices_coords.length) {
			const cluster = [];
			const startVertex = vertices.shift();
			cluster.push(startVertex);
			finished.push(startVertex);
			rangeStart = 0;
			updateRange(cluster);
			let walk = 0;
			while (walk < vertices.length && vertices_coords[vertices[walk]][0] < xRange[1]) {
				if (isInsideCluster(vertices[walk])) {
					const newVertex = vertices.splice(walk, 1).shift();
					cluster.push(newVertex);
					finished.push(newVertex);
					updateRange(cluster);
				} else {
					walk += 1;
				}
			}
			clusters.push(cluster);
		}
		return clusters;
	};

	const max_arrays_length = (...arrays) => Math.max(0, ...(arrays
		.filter(el => el !== undefined)
		.map(el => el.length)));
	const count = (graph, key) => (
		max_arrays_length(...getGraphKeysWithPrefix(graph, key).map(k => graph[k])));
	count.vertices = ({ vertices_coords, vertices_faces, vertices_vertices }) => (
		max_arrays_length(vertices_coords, vertices_faces, vertices_vertices));
	count.edges = ({ edges_vertices, edges_edges, edges_faces }) => (
		max_arrays_length(edges_vertices, edges_edges, edges_faces));
	count.faces = ({ faces_vertices, faces_edges, faces_faces }) => (
		max_arrays_length(faces_vertices, faces_edges, faces_faces));

	const uniqueElements = (array) => Array.from(new Set(array));
	const nonUniqueElements = (array) => {
		const count = {};
		array.forEach(n => {
			if (count[n] === undefined) { count[n] = 0; }
			count[n] += 1;
		});
		return array.filter(n => count[n] > 1);
	};
	const uniqueSortedNumbers = (array) => uniqueElements(array)
		.sort((a, b) => a - b);
	const splitCircularArray = (array, indices) => {
		indices.sort((a, b) => a - b);
		return [
			array.slice(indices[1]).concat(array.slice(0, indices[0] + 1)),
			array.slice(indices[0], indices[1] + 1),
		];
	};
	const booleanMatrixToIndexedArray = matrix => matrix
		.map(row => row
			.map((value, i) => (value === true ? i : undefined))
			.filter(a => a !== undefined));
	const booleanMatrixToUniqueIndexPairs = matrix => {
		const pairs = [];
		for (let i = 0; i < matrix.length - 1; i += 1) {
			for (let j = i + 1; j < matrix.length; j += 1) {
				if (matrix[i][j]) {
					pairs.push([i, j]);
				}
			}
		}
		return pairs;
	};
	const selfRelationalUniqueIndexPairs = (array_array) => {
		const circular = [];
		const pairs = [];
		array_array.forEach((arr, i) => arr.forEach(j => {
			if (i < j) { pairs.push([i, j]); }
			if (i === j && !circular[i]) {
				circular[i] = true;
				pairs.push([i, j]);
			}
		}));
		return pairs;
	};
	const clusterScalars = (floats, epsilon = math.core.EPSILON) => {
		const indices = floats
			.map((v, i) => ({ v, i }))
			.sort((a, b) => a.v - b.v)
			.map(el => el.i);
		const groups = [[indices[0]]];
		for (let i = 1; i < indices.length; i += 1) {
			const index = indices[i];
			const g = groups.length - 1;
			const prev = groups[g][groups[g].length - 1];
			if (Math.abs(floats[prev] - floats[index]) < epsilon) {
				groups[g].push(index);
			} else {
				groups.push([index]);
			}
		}
		return groups;
	};
	const chooseTwoPairs = (array) => {
		const pairs = Array((array.length * (array.length - 1)) / 2);
		let index = 0;
		for (let i = 0; i < array.length - 1; i += 1) {
			for (let j = i + 1; j < array.length; j += 1, index += 1) {
				pairs[index] = [array[i], array[j]];
			}
		}
		return pairs;
	};

	var arrays = /*#__PURE__*/Object.freeze({
		__proto__: null,
		uniqueElements: uniqueElements,
		nonUniqueElements: nonUniqueElements,
		uniqueSortedNumbers: uniqueSortedNumbers,
		splitCircularArray: splitCircularArray,
		booleanMatrixToIndexedArray: booleanMatrixToIndexedArray,
		booleanMatrixToUniqueIndexPairs: booleanMatrixToUniqueIndexPairs,
		selfRelationalUniqueIndexPairs: selfRelationalUniqueIndexPairs,
		clusterScalars: clusterScalars,
		chooseTwoPairs: chooseTwoPairs
	});

	const removeGeometryIndices = (graph, key, removeIndices) => {
		const geometry_array_size = count(graph, key);
		const removes = uniqueSortedNumbers(removeIndices);
		const index_map = [];
		for (let i = 0, j = 0, walk = 0; i < geometry_array_size; i += 1, j += 1) {
			while (i === removes[walk]) {
				index_map[i] = undefined;
				i += 1;
				walk += 1;
			}
			if (i < geometry_array_size) { index_map[i] = j; }
		}
		getGraphKeysWithSuffix(graph, key)
			.forEach(sKey => graph[sKey]
				.forEach((_, ii) => graph[sKey][ii]
					.forEach((v, jj) => { graph[sKey][ii][jj] = index_map[v]; })));
		removes.reverse();
		getGraphKeysWithPrefix(graph, key)
			.forEach((prefix_key) => removes
				.forEach(index => graph[prefix_key]
					.splice(index, 1)));
		return index_map;
	};

	const replaceGeometryIndices = (graph, key, replaceIndices) => {
		const geometry_array_size = count(graph, key);
		let didModify = false;
		Object.entries(replaceIndices)
			.filter(([index, value]) => index < value)
			.forEach(([index, value]) => {
				didModify = true;
				delete replaceIndices[index];
				replaceIndices[value] = index;
			});
		if (didModify) {
			console.warn(Messages.replaceModifyParam);
		}
		const removes = Object.keys(replaceIndices).map(n => parseInt(n, 10));
		const replaces = uniqueSortedNumbers(removes);
		const index_map = [];
		for (let i = 0, j = 0, walk = 0; i < geometry_array_size; i += 1, j += 1) {
			while (i === replaces[walk]) {
				index_map[i] = index_map[replaceIndices[replaces[walk]]];
				if (index_map[i] === undefined) {
					throw new Error(Messages.replaceUndefined);
				}
				i += 1;
				walk += 1;
			}
			if (i < geometry_array_size) { index_map[i] = j; }
		}
		getGraphKeysWithSuffix(graph, key)
			.forEach(sKey => graph[sKey]
				.forEach((_, ii) => graph[sKey][ii]
					.forEach((v, jj) => { graph[sKey][ii][jj] = index_map[v]; })));
		replaces.reverse();
		getGraphKeysWithPrefix(graph, key)
			.forEach((prefix_key) => replaces
				.forEach(index => graph[prefix_key]
					.splice(index, 1)));
		return index_map;
	};

	const duplicateVertices = (graph, epsilon) => (
		verticesClusters(graph, epsilon)
			.filter(arr => arr.length > 1)
	);
	const edgeIsolatedVertices = ({ vertices_coords, edges_vertices }) => {
		if (!vertices_coords || !edges_vertices) { return []; }
		let count = vertices_coords.length;
		const seen = Array(count).fill(false);
		edges_vertices.forEach((ev) => {
			ev.filter(v => !seen[v]).forEach((v) => {
				seen[v] = true;
				count -= 1;
			});
		});
		return seen
			.map((s, i) => (s ? undefined : i))
			.filter(a => a !== undefined);
	};
	const faceIsolatedVertices = ({ vertices_coords, faces_vertices }) => {
		if (!vertices_coords || !faces_vertices) { return []; }
		let count = vertices_coords.length;
		const seen = Array(count).fill(false);
		faces_vertices.forEach((fv) => {
			fv.filter(v => !seen[v]).forEach((v) => {
				seen[v] = true;
				count -= 1;
			});
		});
		return seen
			.map((s, i) => (s ? undefined : i))
			.filter(a => a !== undefined);
	};
	const isolatedVertices = ({ vertices_coords, edges_vertices, faces_vertices }) => {
		if (!vertices_coords) { return []; }
		let count = vertices_coords.length;
		const seen = Array(count).fill(false);
		if (edges_vertices) {
			edges_vertices.forEach((ev) => {
				ev.filter(v => !seen[v]).forEach((v) => {
					seen[v] = true;
					count -= 1;
				});
			});
		}
		if (faces_vertices) {
			faces_vertices.forEach((fv) => {
				fv.filter(v => !seen[v]).forEach((v) => {
					seen[v] = true;
					count -= 1;
				});
			});
		}
		return seen
			.map((s, i) => (s ? undefined : i))
			.filter(a => a !== undefined);
	};
	const removeIsolatedVertices = (graph, remove_indices) => {
		if (!remove_indices) {
			remove_indices = isolatedVertices(graph);
		}
		return {
			map: removeGeometryIndices(graph, _vertices, remove_indices),
			remove: remove_indices,
		};
	};
	const removeDuplicateVertices = (graph, epsilon = math.core.EPSILON) => {
		const replace_indices = [];
		const remove_indices = [];
		const clusters = verticesClusters(graph, epsilon)
			.filter(arr => arr.length > 1);
		clusters.forEach(cluster => {
			if (Math.min(...cluster) !== cluster[0]) {
				cluster.sort((a, b) => a - b);
			}
			for (let i = 1; i < cluster.length; i += 1) {
				replace_indices[cluster[i]] = cluster[0];
				remove_indices.push(cluster[i]);
			}
		});
		clusters
			.map(arr => arr.map(i => graph.vertices_coords[i]))
			.map(arr => math.core.average(...arr))
			.forEach((point, i) => { graph.vertices_coords[clusters[i][0]] = point; });
		return {
			map: replaceGeometryIndices(graph, _vertices, replace_indices),
			remove: remove_indices,
		};
	};

	var verticesViolations = /*#__PURE__*/Object.freeze({
		__proto__: null,
		duplicateVertices: duplicateVertices,
		edgeIsolatedVertices: edgeIsolatedVertices,
		faceIsolatedVertices: faceIsolatedVertices,
		isolatedVertices: isolatedVertices,
		removeIsolatedVertices: removeIsolatedVertices,
		removeDuplicateVertices: removeDuplicateVertices
	});

	const array_in_array_max_number = (arrays) => {
		let max = -1;
		arrays
			.filter(a => a !== undefined)
			.forEach(arr => arr
				.forEach(el => el
					.forEach((e) => {
						if (e > max) { max = e; }
					})));
		return max;
	};
	const max_num_in_orders = (array) => {
		let max = -1;
		array.forEach(el => {
			if (el[0] > max) { max = el[0]; }
			if (el[1] > max) { max = el[1]; }
		});
		return max;
	};
	const ordersArrayNames = {
		edges: "edgeOrders",
		faces: "faceOrders",
	};
	const countImplied = (graph, key) => Math.max(
		array_in_array_max_number(
			getGraphKeysWithSuffix(graph, key).map(str => graph[str]),
		),
		graph[ordersArrayNames[key]]
			? max_num_in_orders(graph[ordersArrayNames[key]])
			: -1,
	) + 1;
	countImplied.vertices = graph => countImplied(graph, _vertices);
	countImplied.edges = graph => countImplied(graph, _edges);
	countImplied.faces = graph => countImplied(graph, _faces);

	const counterClockwiseWalk = ({
		vertices_vertices, vertices_sectors,
	}, v0, v1, walked_edges = {}) => {
		const this_walked_edges = {};
		const face = { vertices: [v0], edges: [], angles: [] };
		let prev_vertex = v0;
		let this_vertex = v1;
		while (true) {
			const v_v = vertices_vertices[this_vertex];
			const from_neighbor_i = v_v.indexOf(prev_vertex);
			const next_neighbor_i = (from_neighbor_i + v_v.length - 1) % v_v.length;
			const next_vertex = v_v[next_neighbor_i];
			const next_edge_vertices = `${this_vertex} ${next_vertex}`;
			if (this_walked_edges[next_edge_vertices]) {
				Object.assign(walked_edges, this_walked_edges);
				face.vertices.pop();
				return face;
			}
			this_walked_edges[next_edge_vertices] = true;
			if (walked_edges[next_edge_vertices]) {
				return undefined;
			}
			face.vertices.push(this_vertex);
			face.edges.push(next_edge_vertices);
			if (vertices_sectors) {
				face.angles.push(vertices_sectors[this_vertex][next_neighbor_i]);
			}
			prev_vertex = this_vertex;
			this_vertex = next_vertex;
		}
	};
	const planarVertexWalk = ({ vertices_vertices, vertices_sectors }) => {
		const graph = { vertices_vertices, vertices_sectors };
		const walked_edges = {};
		return vertices_vertices
			.map((adj_verts, v) => adj_verts
				.map(adj_vert => counterClockwiseWalk(graph, v, adj_vert, walked_edges))
				.filter(a => a !== undefined))
			.flat();
	};
	const filterWalkedBoundaryFace = walked_faces => walked_faces
		.filter(face => face.angles
			.map(a => Math.PI - a)
			.reduce((a, b) => a + b, 0) > 0);

	var walk = /*#__PURE__*/Object.freeze({
		__proto__: null,
		counterClockwiseWalk: counterClockwiseWalk,
		planarVertexWalk: planarVertexWalk,
		filterWalkedBoundaryFace: filterWalkedBoundaryFace
	});

	const sortVerticesCounterClockwise = ({ vertices_coords }, vertices, vertex) => (
		vertices
			.map(v => vertices_coords[v])
			.map(coord => math.core.subtract(coord, vertices_coords[vertex]))
			.map(vec => Math.atan2(vec[1], vec[0]))
			.map(angle => (angle > -math.core.EPSILON ? angle : angle + Math.PI * 2))
			.map((a, i) => ({ a, i }))
			.sort((a, b) => a.a - b.a)
			.map(el => el.i)
			.map(i => vertices[i])
	);
	const sortVerticesAlongVector = ({ vertices_coords }, vertices, vector) => (
		vertices
			.map(i => ({ i, d: math.core.dot(vertices_coords[i], vector) }))
			.sort((a, b) => a.d - b.d)
			.map(a => a.i)
	);

	var sortMethods = /*#__PURE__*/Object.freeze({
		__proto__: null,
		sortVerticesCounterClockwise: sortVerticesCounterClockwise,
		sortVerticesAlongVector: sortVerticesAlongVector
	});

	const makeFacesNormal = ({ vertices_coords, faces_vertices }) => faces_vertices
		.map(vertices => vertices
			.map(vertex => vertices_coords[vertex]))
		.map(polygon => {
			const a = math.core.resize(3, math.core.subtract(polygon[1], polygon[0]));
			const b = math.core.resize(3, math.core.subtract(polygon[2], polygon[0]));
			return math.core.normalize3(math.core.cross3(a, b));
		});
	const makeVerticesNormal = ({ vertices_coords, faces_vertices, faces_normal }) => {
		const add3 = (a, b) => { a[0] += b[0]; a[1] += b[1]; a[2] += b[2]; };
		if (!faces_normal) {
			faces_normal = makeFacesNormal({ vertices_coords, faces_vertices });
		}
		const vertices_normals = vertices_coords.map(() => [0, 0, 0]);
		faces_vertices
			.forEach((vertices, f) => vertices
				.forEach(v => add3(vertices_normals[v], faces_normal[f])));
		return vertices_normals.map(v => math.core.normalize3(v));
	};

	var normals = /*#__PURE__*/Object.freeze({
		__proto__: null,
		makeFacesNormal: makeFacesNormal,
		makeVerticesNormal: makeVerticesNormal
	});

	const makeVerticesEdgesUnsorted = ({ edges_vertices }) => {
		const vertices_edges = [];
		edges_vertices.forEach((ev, i) => ev
			.forEach((v) => {
				if (vertices_edges[v] === undefined) {
					vertices_edges[v] = [];
				}
				vertices_edges[v].push(i);
			}));
		return vertices_edges;
	};
	const makeVerticesEdges = ({ edges_vertices, vertices_vertices }) => {
		const edge_map = makeVerticesToEdgeBidirectional({ edges_vertices });
		return vertices_vertices
			.map((verts, i) => verts
				.map(v => edge_map[`${i} ${v}`]));
	};
	const makeVerticesVertices2D = ({ vertices_coords, vertices_edges, edges_vertices }) => {
		if (!vertices_edges) {
			vertices_edges = makeVerticesEdgesUnsorted({ edges_vertices });
		}
		const vertices_vertices = vertices_edges
			.map((edges, v) => edges
				.map(edge => edges_vertices[edge]
					.filter(i => i !== v))
				.reduce((a, b) => a.concat(b), []));
		return vertices_coords === undefined
			? vertices_vertices
			: vertices_vertices
				.map((verts, i) => sortVerticesCounterClockwise({ vertices_coords }, verts, i));
	};
	const makeVerticesVerticesFromFaces = ({
		vertices_coords, vertices_faces, faces_vertices,
	}) => {
		if (!vertices_faces) {
			vertices_faces = makeVerticesFacesUnsorted({ vertices_coords, faces_vertices });
		}
		const vertices_faces_vertices = vertices_faces
			.map(faces => faces.map(f => faces_vertices[f]));
		const vertices_faces_indexOf = vertices_faces_vertices
			.map((faces, vertex) => faces.map(verts => verts.indexOf(vertex)));
		const vertices_faces_threeIndices = vertices_faces_vertices
			.map((faces, vertex) => faces.map((verts, j) => [
				(vertices_faces_indexOf[vertex][j] + verts.length - 1) % verts.length,
				vertices_faces_indexOf[vertex][j],
				(vertices_faces_indexOf[vertex][j] + 1) % verts.length,
			]));
		const vertices_faces_threeVerts = vertices_faces_threeIndices
			.map((faces, vertex) => faces
				.map((indices, j) => indices
					.map(index => vertices_faces_vertices[vertex][j][index])));
		const vertices_verticesLookup = vertices_faces_threeVerts.map(faces => {
			const facesVerts = faces
				.map(verts => [[0, 1], [1, 2]]
					.map(p => p.map(x => verts[x]).join(" ")));
			const from = {};
			const to = {};
			facesVerts.forEach((keys, i) => {
				from[keys[0]] = i;
				to[keys[1]] = i;
			});
			return { facesVerts, to, from };
		});
		return vertices_verticesLookup.map(lookup => {
			const toKeys = Object.keys(lookup.to);
			const toKeysInverse = toKeys
				.map(key => key.split(" ").reverse().join(" "));
			const holeKeys = toKeys
				.filter((_, i) => !(toKeysInverse[i] in lookup.from));
			if (holeKeys.length > 2) {
				console.warn("vertices_vertices found an unsolvable vertex");
				return [];
			}
			const startKeys = holeKeys.length
				? holeKeys
				: [toKeys[0]];
			const vertex_vertices = [];
			const visited = {};
			for (let s = 0; s < startKeys.length; s += 1) {
				const startKey = startKeys[s];
				const walk = [startKey];
				visited[startKey] = true;
				let isDone = false;
				do {
					const prev = walk[walk.length - 1];
					const faceIndex = lookup.to[prev];
					if (!(faceIndex in lookup.facesVerts)) { break; }
					let nextKey;
					if (lookup.facesVerts[faceIndex][0] === prev) {
						nextKey = lookup.facesVerts[faceIndex][1];
					}
					if (lookup.facesVerts[faceIndex][1] === prev) {
						nextKey = lookup.facesVerts[faceIndex][0];
					}
					if (nextKey === undefined) { return "not found"; }
					const nextKeyFlipped = nextKey.split(" ").reverse().join(" ");
					walk.push(nextKey);
					isDone = (nextKeyFlipped in visited);
					if (!isDone) { walk.push(nextKeyFlipped); }
					visited[nextKey] = true;
					visited[nextKeyFlipped] = true;
				} while (!isDone);
				const vertexKeys = walk
					.filter((_, i) => i % 2 === 0)
					.map(key => key.split(" ")[1])
					.map(str => parseInt(str, 10));
				vertex_vertices.push(...vertexKeys);
			}
			return vertex_vertices;
		});
	};
	const makeVerticesVertices = (graph) => {
		if (!graph.vertices_coords || !graph.vertices_coords.length) { return []; }
		switch (graph.vertices_coords[0].length) {
		case 3:
			return makeVerticesVerticesFromFaces(graph);
		default:
			return makeVerticesVertices2D(graph);
		}
	};
	const makeVerticesVerticesUnsorted = ({ vertices_edges, edges_vertices }) => {
		if (!vertices_edges) {
			vertices_edges = makeVerticesEdgesUnsorted({ edges_vertices });
		}
		return vertices_edges
			.map((edges, v) => edges
				.flatMap(edge => edges_vertices[edge].filter(i => i !== v)));
	};
	const makeVerticesFacesUnsorted = ({ vertices_coords, faces_vertices }) => {
		if (!faces_vertices) { return vertices_coords.map(() => []); }
		const vertices_faces = vertices_coords !== undefined
			? vertices_coords.map(() => [])
			: Array.from(Array(countImplied.vertices({ faces_vertices }))).map(() => []);
		faces_vertices.forEach((face, f) => {
			const hash = [];
			face.forEach((vertex) => { hash[vertex] = f; });
			hash.forEach((fa, v) => vertices_faces[v].push(fa));
		});
		return vertices_faces;
	};
	const makeVerticesFaces = ({ vertices_coords, vertices_vertices, faces_vertices }) => {
		if (!faces_vertices) { return vertices_coords.map(() => []); }
		if (!vertices_vertices) {
			return makeVerticesFacesUnsorted({ vertices_coords, faces_vertices });
		}
		const face_map = makeVerticesToFace({ faces_vertices });
		return vertices_vertices
			.map((verts, v) => verts
				.map((vert, i, arr) => [arr[(i + 1) % arr.length], v, vert]
					.join(" ")))
			.map(keys => keys
				.map(key => face_map[key]));
	};
	const makeVerticesToEdgeBidirectional = ({ edges_vertices }) => {
		const map = {};
		edges_vertices
			.map(ev => ev.join(" "))
			.forEach((key, i) => { map[key] = i; });
		edges_vertices
			.map(ev => `${ev[1]} ${ev[0]}`)
			.forEach((key, i) => { map[key] = i; });
		return map;
	};
	const makeVerticesToEdge = ({ edges_vertices }) => {
		const map = {};
		edges_vertices
			.map(ev => ev.join(" "))
			.forEach((key, i) => { map[key] = i; });
		return map;
	};
	const makeVerticesToFace = ({ faces_vertices }) => {
		const map = {};
		faces_vertices
			.forEach((face, f) => face
				.map((_, i) => [0, 1, 2]
					.map(j => (i + j) % face.length)
					.map(n => face[n])
					.join(" "))
				.forEach(key => { map[key] = f; }));
		return map;
	};
	const makeVerticesVerticesVector = ({
		vertices_coords, vertices_vertices, edges_vertices, edges_vector,
	}) => {
		if (!edges_vector) {
			edges_vector = makeEdgesVector({ vertices_coords, edges_vertices });
		}
		const edge_map = makeVerticesToEdge({ edges_vertices });
		return vertices_vertices
			.map((_, a) => vertices_vertices[a]
				.map((b) => {
					const edge_a = edge_map[`${a} ${b}`];
					const edge_b = edge_map[`${b} ${a}`];
					if (edge_a !== undefined) { return edges_vector[edge_a]; }
					if (edge_b !== undefined) { return math.core.flip(edges_vector[edge_b]); }
				}));
	};
	const makeVerticesSectors = ({
		vertices_coords, vertices_vertices, edges_vertices, edges_vector,
	}) => makeVerticesVerticesVector({
		vertices_coords, vertices_vertices, edges_vertices, edges_vector,
	})
		.map(vectors => (vectors.length === 1
			? [math.core.TWO_PI]
			: math.core.counterClockwiseSectors2(vectors)));
	const makeEdgesEdges = ({ edges_vertices, vertices_edges }) =>
		edges_vertices.map((verts, i) => {
			const side0 = vertices_edges[verts[0]].filter(e => e !== i);
			const side1 = vertices_edges[verts[1]].filter(e => e !== i);
			return side0.concat(side1);
		});
	const makeEdgesFacesUnsorted = ({ edges_vertices, faces_edges }) => {
		const edges_faces = edges_vertices !== undefined
			? edges_vertices.map(() => [])
			: Array.from(Array(countImplied.edges({ faces_edges }))).map(() => []);
		faces_edges.forEach((face, f) => {
			const hash = [];
			face.forEach((edge) => { hash[edge] = f; });
			hash.forEach((fa, e) => edges_faces[e].push(fa));
		});
		return edges_faces;
	};
	const makeEdgesFaces = ({
		vertices_coords, edges_vertices, edges_vector, faces_vertices, faces_edges, faces_center,
	}) => {
		if (!edges_vertices) {
			return makeEdgesFacesUnsorted({ faces_edges });
		}
		if (!edges_vector) {
			edges_vector = makeEdgesVector({ vertices_coords, edges_vertices });
		}
		const edges_origin = edges_vertices.map(pair => vertices_coords[pair[0]]);
		if (!faces_center) {
			faces_center = makeFacesConvexCenter({ vertices_coords, faces_vertices });
		}
		const edges_faces = edges_vertices.map(() => []);
		faces_edges.forEach((face, f) => {
			const hash = [];
			face.forEach((edge) => { hash[edge] = f; });
			hash.forEach((fa, e) => edges_faces[e].push(fa));
		});
		edges_faces.forEach((faces, e) => {
			const faces_cross = faces
				.map(f => faces_center[f])
				.map(center => math.core.subtract2(center, edges_origin[e]))
				.map(vector => math.core.cross2(vector, edges_vector[e]));
			faces.sort((a, b) => faces_cross[a] - faces_cross[b]);
		});
		return edges_faces;
	};
	const assignment_angles = {
		M: -180, m: -180, V: 180, v: 180,
	};
	const makeEdgesAssignmentSimple = ({ edges_foldAngle }) => edges_foldAngle
		.map(a => {
			if (a === 0) { return "F"; }
			return a < 0 ? "M" : "V";
		});
	const makeEdgesAssignment = ({
		edges_vertices, edges_foldAngle, edges_faces, faces_vertices, faces_edges,
	}) => {
		if (!edges_faces) {
			if (!faces_edges) {
				faces_edges = makeFacesEdgesFromVertices({ edges_vertices, faces_vertices });
			}
			edges_faces = makeEdgesFacesUnsorted({ edges_vertices, faces_edges });
		}
		return edges_foldAngle.map((a, i) => {
			if (edges_faces[i].length < 2) { return "B"; }
			if (a === 0) { return "F"; }
			return a < 0 ? "M" : "V";
		});
	};
	const makeEdgesFoldAngle = ({ edges_assignment }) => edges_assignment
		.map(a => assignment_angles[a] || 0);
	const makeEdgesFoldAngleFromFaces = ({
		vertices_coords,
		edges_vertices,
		edges_faces,
		edges_assignment,
		faces_vertices,
		faces_edges,
		faces_normal,
		faces_center,
	}) => {
		if (!edges_faces) {
			if (!faces_edges) {
				faces_edges = makeFacesEdgesFromVertices({ edges_vertices, faces_vertices });
			}
			edges_faces = makeEdgesFacesUnsorted({ edges_vertices, faces_edges });
		}
		if (!faces_normal) {
			faces_normal = makeFacesNormal({ vertices_coords, faces_vertices });
		}
		if (!faces_center) {
			faces_center = makeFacesConvexCenter({ vertices_coords, faces_vertices });
		}
		return edges_faces.map((faces, e) => {
			if (faces.length > 2) { throw new Error(Messages.manifold); }
			if (faces.length < 2) { return 0; }
			const a = faces_normal[faces[0]];
			const b = faces_normal[faces[1]];
			const a2b = math.core.normalize(math.core.subtract(
				faces_center[faces[1]],
				faces_center[faces[0]],
			));
			let sign = Math.sign(math.core.dot(a, a2b));
			if (sign === 0) {
				if (edges_assignment && edges_assignment[e]) {
					if (edges_assignment[e] === "F" || edges_assignment[e] === "F") { sign = 0; }
					if (edges_assignment[e] === "M" || edges_assignment[e] === "m") { sign = -1; }
					if (edges_assignment[e] === "V" || edges_assignment[e] === "v") { sign = 1; }
				} else {
					throw new Error(Messages.flatFoldAngles);
				}
			}
			return (Math.acos(math.core.dot(a, b)) * (180 / Math.PI)) * sign;
		});
	};
	const makeEdgesCoords = ({ vertices_coords, edges_vertices }) => edges_vertices
		.map(ev => ev.map(v => vertices_coords[v]));
	const makeEdgesVector = ({ vertices_coords, edges_vertices }) => makeEdgesCoords({
		vertices_coords, edges_vertices,
	}).map(verts => math.core.subtract(verts[1], verts[0]));
	const makeEdgesLength = ({ vertices_coords, edges_vertices }) => makeEdgesVector({
		vertices_coords, edges_vertices,
	}).map(vec => math.core.magnitude(vec));
	const makeEdgesBoundingBox = ({
		vertices_coords, edges_vertices, edges_coords,
	}, epsilon = 0) => {
		if (!edges_coords) {
			edges_coords = makeEdgesCoords({ vertices_coords, edges_vertices });
		}
		return edges_coords.map(coords => math.core.boundingBox(coords, epsilon));
	};
	const makePlanarFaces = ({
		vertices_coords, vertices_vertices, vertices_edges,
		vertices_sectors, edges_vertices, edges_vector,
	}) => {
		if (!vertices_vertices) {
			vertices_vertices = makeVerticesVertices({ vertices_coords, edges_vertices, vertices_edges });
		}
		if (!vertices_sectors) {
			vertices_sectors = makeVerticesSectors({
				vertices_coords, vertices_vertices, edges_vertices, edges_vector,
			});
		}
		const vertices_edges_map = makeVerticesToEdgeBidirectional({ edges_vertices });
		return filterWalkedBoundaryFace(planarVertexWalk({
			vertices_vertices, vertices_sectors,
		})).map(f => ({ ...f, edges: f.edges.map(e => vertices_edges_map[e]) }));
	};
	const makeFacesVerticesFromEdges = (graph) => graph.faces_edges
		.map(edges => edges
			.map(edge => graph.edges_vertices[edge])
			.map((pairs, i, arr) => {
				const next = arr[(i + 1) % arr.length];
				return (pairs[0] === next[0] || pairs[0] === next[1])
					? pairs[1]
					: pairs[0];
			}));
	const makeFacesEdgesFromVertices = (graph) => {
		const map = makeVerticesToEdgeBidirectional(graph);
		return graph.faces_vertices
			.map(face => face
				.map((v, i, arr) => [v, arr[(i + 1) % arr.length]].join(" ")))
			.map(face => face.map(pair => map[pair]));
	};
	const makeFacesFaces = ({ faces_vertices }) => {
		const faces_faces = faces_vertices.map(() => []);
		const edgeMap = {};
		faces_vertices
			.forEach((face, f) => face
				.forEach((v0, i, arr) => {
					let v1 = arr[(i + 1) % face.length];
					if (v1 < v0) { [v0, v1] = [v1, v0]; }
					const key = `${v0} ${v1}`;
					if (edgeMap[key] === undefined) { edgeMap[key] = {}; }
					edgeMap[key][f] = true;
				}));
		Object.values(edgeMap)
			.map(obj => Object.keys(obj))
			.filter(arr => arr.length > 1)
			.forEach(pair => {
				faces_faces[pair[0]].push(parseInt(pair[1], 10));
				faces_faces[pair[1]].push(parseInt(pair[0], 10));
			});
		return faces_faces;
	};
	const makeFacesPolygon = ({ vertices_coords, faces_vertices }, epsilon) => faces_vertices
		.map(verts => verts.map(v => vertices_coords[v]))
		.map(polygon => math.core.makePolygonNonCollinear(polygon, epsilon));
	const makeFacesPolygonQuick = ({ vertices_coords, faces_vertices }) => faces_vertices
		.map(verts => verts.map(v => vertices_coords[v]));
	const makeFacesCenter2D = ({ vertices_coords, faces_vertices }) => faces_vertices
		.map(fv => fv.map(v => vertices_coords[v]))
		.map(coords => math.core.centroid(coords));
	const makeFacesConvexCenter = ({ vertices_coords, faces_vertices }) => faces_vertices
		.map(vertices => vertices
			.map(v => vertices_coords[v])
			.reduce((a, b) => math.core.add(a, b), Array(vertices_coords[0].length).fill(0))
			.map(el => el / vertices.length));

	var make = /*#__PURE__*/Object.freeze({
		__proto__: null,
		makeVerticesEdgesUnsorted: makeVerticesEdgesUnsorted,
		makeVerticesEdges: makeVerticesEdges,
		makeVerticesVertices2D: makeVerticesVertices2D,
		makeVerticesVerticesFromFaces: makeVerticesVerticesFromFaces,
		makeVerticesVertices: makeVerticesVertices,
		makeVerticesVerticesUnsorted: makeVerticesVerticesUnsorted,
		makeVerticesFacesUnsorted: makeVerticesFacesUnsorted,
		makeVerticesFaces: makeVerticesFaces,
		makeVerticesToEdgeBidirectional: makeVerticesToEdgeBidirectional,
		makeVerticesToEdge: makeVerticesToEdge,
		makeVerticesToFace: makeVerticesToFace,
		makeVerticesVerticesVector: makeVerticesVerticesVector,
		makeVerticesSectors: makeVerticesSectors,
		makeEdgesEdges: makeEdgesEdges,
		makeEdgesFacesUnsorted: makeEdgesFacesUnsorted,
		makeEdgesFaces: makeEdgesFaces,
		makeEdgesAssignmentSimple: makeEdgesAssignmentSimple,
		makeEdgesAssignment: makeEdgesAssignment,
		makeEdgesFoldAngle: makeEdgesFoldAngle,
		makeEdgesFoldAngleFromFaces: makeEdgesFoldAngleFromFaces,
		makeEdgesCoords: makeEdgesCoords,
		makeEdgesVector: makeEdgesVector,
		makeEdgesLength: makeEdgesLength,
		makeEdgesBoundingBox: makeEdgesBoundingBox,
		makePlanarFaces: makePlanarFaces,
		makeFacesVerticesFromEdges: makeFacesVerticesFromEdges,
		makeFacesEdgesFromVertices: makeFacesEdgesFromVertices,
		makeFacesFaces: makeFacesFaces,
		makeFacesPolygon: makeFacesPolygon,
		makeFacesPolygonQuick: makeFacesPolygonQuick,
		makeFacesCenter2D: makeFacesCenter2D,
		makeFacesConvexCenter: makeFacesConvexCenter
	});

	const circularEdges = ({ edges_vertices }) => {
		if (!edges_vertices) { return []; }
		const circular = [];
		for (let i = 0; i < edges_vertices.length; i += 1) {
			if (edges_vertices[i][0] === edges_vertices[i][1]) {
				circular.push(i);
			}
		}
		return circular;
	};
	const duplicateEdges = ({ edges_vertices }) => {
		if (!edges_vertices) { return []; }
		const duplicates = [];
		const map = {};
		for (let i = 0; i < edges_vertices.length; i += 1) {
			const a = `${edges_vertices[i][0]} ${edges_vertices[i][1]}`;
			const b = `${edges_vertices[i][1]} ${edges_vertices[i][0]}`;
			if (map[a] !== undefined) {
				duplicates[i] = map[a];
			} else {
				map[a] = i;
				map[b] = i;
			}
		}
		return duplicates;
	};
	const spliceRemoveValuesFromSuffixes = (graph, suffix, remove_indices) => {
		const remove_map = {};
		remove_indices.forEach(n => { remove_map[n] = true; });
		getGraphKeysWithSuffix(graph, suffix)
			.forEach(sKey => graph[sKey]
				.forEach((elem, i) => {
					for (let j = elem.length - 1; j >= 0; j -= 1) {
						if (remove_map[elem[j]] === true) {
							graph[sKey][i].splice(j, 1);
						}
					}
				}));
	};
	const removeCircularEdges = (graph, remove_indices) => {
		if (!remove_indices) {
			remove_indices = circularEdges(graph);
		}
		if (remove_indices.length) {
			spliceRemoveValuesFromSuffixes(graph, _edges, remove_indices);
		}
		return {
			map: removeGeometryIndices(graph, _edges, remove_indices),
			remove: remove_indices,
		};
	};
	const removeDuplicateEdges = (graph, replace_indices) => {
		if (!replace_indices) {
			replace_indices = duplicateEdges(graph);
		}
		const removeObject = Object.keys(replace_indices).map(n => parseInt(n, 10));
		const map = replaceGeometryIndices(graph, _edges, replace_indices);
		if (removeObject.length) {
			if (graph.vertices_edges || graph.vertices_vertices || graph.vertices_faces) {
				graph.vertices_edges = makeVerticesEdgesUnsorted(graph);
				graph.vertices_vertices = makeVerticesVertices(graph);
				graph.vertices_edges = makeVerticesEdges(graph);
				graph.vertices_faces = makeVerticesFaces(graph);
			}
		}
		return { map, remove: removeObject };
	};

	var edgesViolations = /*#__PURE__*/Object.freeze({
		__proto__: null,
		circularEdges: circularEdges,
		duplicateEdges: duplicateEdges,
		removeCircularEdges: removeCircularEdges,
		removeDuplicateEdges: removeDuplicateEdges
	});

	const mergeSimpleNextmaps = (...maps) => {
		if (maps.length === 0) { return []; }
		const solution = maps[0].map((_, i) => i);
		maps.forEach(map => solution.forEach((s, i) => { solution[i] = map[s]; }));
		return solution;
	};
	const mergeNextmaps = (...maps) => {
		if (maps.length === 0) { return []; }
		const solution = maps[0].map((_, i) => [i]);
		maps.forEach(map => {
			solution.forEach((s, i) => s.forEach((indx, j) => { solution[i][j] = map[indx]; }));
			solution.forEach((arr, i) => {
				solution[i] = arr
					.reduce((a, b) => a.concat(b), [])
					.filter(a => a !== undefined);
			});
		});
		return solution;
	};
	const mergeSimpleBackmaps = (...maps) => {
		if (maps.length === 0) { return []; }
		let solution = maps[0].map((_, i) => i);
		maps.forEach(map => {
			const next = map.map(n => solution[n]);
			solution = next;
		});
		return solution;
	};
	const mergeBackmaps = (...maps) => {
		if (maps.length === 0) { return []; }
		let solution = maps[0].reduce((a, b) => a.concat(b), []).map((_, i) => [i]);
		maps.forEach(map => {
			const next = [];
			map.forEach((el, j) => {
				if (typeof el === _number) {
					next[j] = solution[el];
				} else {
					next[j] = el.map(n => solution[n]).reduce((a, b) => a.concat(b), []);
				}
			});
			solution = next;
		});
		return solution;
	};
	const invertMap = (map) => {
		const inv = [];
		const setIndexValue = (index, value) => {
			if (inv[index] !== undefined) {
				if (typeof inv[index] === _number) {
					inv[index] = [inv[index], value];
				} else {
					inv[index].push(value);
				}
			} else {
				inv[index] = value;
			}
		};
		map.forEach((n, i) => {
			if (n == null) { return; }
			if (typeof n === _number) { setIndexValue(n, i); }
			if (n.constructor === Array) {
				n.forEach(m => setIndexValue(m, i));
			}
		});
		return inv;
	};
	const invertSimpleMap = (map) => {
		const inv = [];
		map.forEach((n, i) => { inv[n] = i; });
		return inv;
	};

	var maps = /*#__PURE__*/Object.freeze({
		__proto__: null,
		mergeSimpleNextmaps: mergeSimpleNextmaps,
		mergeNextmaps: mergeNextmaps,
		mergeSimpleBackmaps: mergeSimpleBackmaps,
		mergeBackmaps: mergeBackmaps,
		invertMap: invertMap,
		invertSimpleMap: invertSimpleMap
	});

	const clean = (graph, epsilon) => {
		const change_v1 = removeDuplicateVertices(graph, epsilon);
		const change_e1 = removeCircularEdges(graph);
		const change_e2 = removeDuplicateEdges(graph);
		const change_v2 = removeIsolatedVertices(graph);
		const change_v1_backmap = invertSimpleMap(change_v1.map);
		const change_v2_remove = change_v2.remove.map(e => change_v1_backmap[e]);
		const change_e1_backmap = invertSimpleMap(change_e1.map);
		const change_e2_remove = change_e2.remove.map(e => change_e1_backmap[e]);
		return {
			vertices: {
				map: mergeSimpleNextmaps(change_v1.map, change_v2.map),
				remove: change_v1.remove.concat(change_v2_remove),
			},
			edges: {
				map: mergeSimpleNextmaps(change_e1.map, change_e2.map),
				remove: change_e1.remove.concat(change_e2_remove),
			},
		};
	};

	const validate_references = (graph) => {
		const counts = {
			vertices: count.vertices(graph),
			edges: count.edges(graph),
			faces: count.faces(graph),
		};
		const implied = {
			vertices: countImplied.vertices(graph),
			edges: countImplied.edges(graph),
			faces: countImplied.faces(graph),
		};
		return {
			vertices: counts.vertices >= implied.vertices,
			edges: counts.edges >= implied.edges,
			faces: counts.faces >= implied.faces,
		};
	};
	const validate = (graph, epsilon) => {
		const duplicate_edges = duplicateEdges(graph);
		const circular_edges = circularEdges(graph);
		const isolated_vertices = isolatedVertices(graph);
		const duplicate_vertices = duplicateVertices(graph, epsilon);
		const references = validate_references(graph);
		const is_perfect = duplicate_edges.length === 0
			&& circular_edges.length === 0
			&& isolated_vertices.length === 0
			&& references.vertices && references.edges && references.faces;
		const summary = is_perfect ? "valid" : "problematic";
		return {
			summary,
			vertices: {
				isolated: isolated_vertices,
				duplicate: duplicate_vertices,
				references: references.vertices,
			},
			edges: {
				circular: circular_edges,
				duplicate: duplicate_edges,
				references: references.edges,
			},
			faces: {
				references: references.faces,
			},
		};
	};

	const build_assignments_if_needed = (graph) => {
		const len = graph.edges_vertices.length;
		if (!graph.edges_assignment) { graph.edges_assignment = []; }
		if (!graph.edges_foldAngle) { graph.edges_foldAngle = []; }
		if (graph.edges_assignment.length > graph.edges_foldAngle.length) {
			for (let i = graph.edges_foldAngle.length; i < graph.edges_assignment.length; i += 1) {
				graph.edges_foldAngle[i] = edgeAssignmentToFoldAngle(graph.edges_assignment[i]);
			}
		}
		if (graph.edges_foldAngle.length > graph.edges_assignment.length) {
			for (let i = graph.edges_assignment.length; i < graph.edges_foldAngle.length; i += 1) {
				graph.edges_assignment[i] = edgeFoldAngleToAssignment(graph.edges_foldAngle[i]);
			}
		}
		for (let i = graph.edges_assignment.length; i < len; i += 1) {
			graph.edges_assignment[i] = "U";
			graph.edges_foldAngle[i] = 0;
		}
	};
	const build_faces_if_needed = (graph, reface) => {
		if (reface === undefined && !graph.faces_vertices && !graph.faces_edges) {
			reface = true;
		}
		if (reface && graph.vertices_coords) {
			const faces = makePlanarFaces(graph);
			graph.faces_vertices = faces.map(face => face.vertices);
			graph.faces_edges = faces.map(face => face.edges);
			return;
		}
		if (graph.faces_vertices && graph.faces_edges) { return; }
		if (graph.faces_vertices && !graph.faces_edges) {
			graph.faces_edges = makeFacesEdgesFromVertices(graph);
		} else if (graph.faces_edges && !graph.faces_vertices) {
			graph.faces_vertices = makeFacesVerticesFromEdges(graph);
		} else {
			graph.faces_vertices = [];
			graph.faces_edges = [];
		}
	};
	const populate = (graph, reface) => {
		if (typeof graph !== "object") { return graph; }
		if (!graph.edges_vertices) { return graph; }
		graph.vertices_edges = makeVerticesEdgesUnsorted(graph);
		graph.vertices_vertices = makeVerticesVertices(graph);
		graph.vertices_edges = makeVerticesEdges(graph);
		build_assignments_if_needed(graph);
		build_faces_if_needed(graph, reface);
		graph.vertices_faces = makeVerticesFaces(graph);
		graph.edges_faces = makeEdgesFacesUnsorted(graph);
		graph.faces_faces = makeFacesFaces(graph);
		return graph;
	};

	const getEdgesVerticesOverlappingSpan = (graph, epsilon = math.core.EPSILON) => (
		makeEdgesBoundingBox(graph, epsilon)
			.map(min_max => graph.vertices_coords
				.map(vert => (
					vert[0] > min_max.min[0]
					&& vert[1] > min_max.min[1]
					&& vert[0] < min_max.max[0]
					&& vert[1] < min_max.max[1])))
	);
	const getEdgesEdgesOverlapingSpans = ({
		vertices_coords, edges_vertices, edges_coords,
	}, epsilon = math.core.EPSILON) => {
		const min_max = makeEdgesBoundingBox({ vertices_coords, edges_vertices, edges_coords }, epsilon);
		const span_overlaps = edges_vertices.map(() => []);
		for (let e0 = 0; e0 < edges_vertices.length - 1; e0 += 1) {
			for (let e1 = e0 + 1; e1 < edges_vertices.length; e1 += 1) {
				const outside_of = (
					(min_max[e0].max[0] < min_max[e1].min[0] || min_max[e1].max[0] < min_max[e0].min[0])
					&& (min_max[e0].max[1] < min_max[e1].min[1] || min_max[e1].max[1] < min_max[e0].min[1]));
				span_overlaps[e0][e1] = !outside_of;
				span_overlaps[e1][e0] = !outside_of;
			}
		}
		for (let i = 0; i < edges_vertices.length; i += 1) {
			span_overlaps[i][i] = true;
		}
		return span_overlaps;
	};

	var span = /*#__PURE__*/Object.freeze({
		__proto__: null,
		getEdgesVerticesOverlappingSpan: getEdgesVerticesOverlappingSpan,
		getEdgesEdgesOverlapingSpans: getEdgesEdgesOverlapingSpans
	});

	const getOppositeVertices = ({ edges_vertices }, vertex, edges) => {
		edges.forEach(edge => {
			if (edges_vertices[edge][0] === vertex
				&& edges_vertices[edge][1] === vertex) {
				throw new Error(Messages.circularEdge);
			}
		});
		return edges.map(edge => (edges_vertices[edge][0] === vertex
			? edges_vertices[edge][1]
			: edges_vertices[edge][0]));
	};

	const isVertexCollinear = ({
		vertices_coords, vertices_edges, edges_vertices,
	}, vertex, epsilon = math.core.EPSILON) => {
		if (!vertices_coords || !edges_vertices) { return false; }
		if (!vertices_edges) {
			vertices_edges = makeVerticesEdgesUnsorted({ edges_vertices });
		}
		const edges = vertices_edges[vertex];
		if (edges === undefined || edges.length !== 2) { return false; }
		const vertices = getOppositeVertices({ edges_vertices }, vertex, edges);
		const points = [vertices[0], vertex, vertices[1]]
			.map(v => vertices_coords[v]);
		return math.core.collinearBetween(...points, false, epsilon);
	};
	const getVerticesEdgesOverlap = ({
		vertices_coords, edges_vertices, edges_coords,
	}, epsilon = math.core.EPSILON) => {
		if (!edges_coords) {
			edges_coords = edges_vertices.map(ev => ev.map(v => vertices_coords[v]));
		}
		const edges_span_vertices = getEdgesVerticesOverlappingSpan({
			vertices_coords, edges_vertices, edges_coords,
		}, epsilon);
		for (let e = 0; e < edges_coords.length; e += 1) {
			for (let v = 0; v < vertices_coords.length; v += 1) {
				if (!edges_span_vertices[e][v]) { continue; }
				edges_span_vertices[e][v] = math.core.overlapLinePoint(
					math.core.subtract(edges_coords[e][1], edges_coords[e][0]),
					edges_coords[e][0],
					vertices_coords[v],
					math.core.excludeS,
					epsilon,
				);
			}
		}
		return edges_span_vertices
			.map(verts => verts
				.map((vert, i) => (vert ? i : undefined))
				.filter(i => i !== undefined));
	};

	var vertices_collinear = /*#__PURE__*/Object.freeze({
		__proto__: null,
		isVertexCollinear: isVertexCollinear,
		getVerticesEdgesOverlap: getVerticesEdgesOverlap
	});

	const makeEdgesLineParallelOverlap = ({
		vertices_coords, edges_vertices,
	}, vector, point, epsilon = math.core.EPSILON) => {
		const normalized = math.core.normalize2(vector);
		const edges_origin = edges_vertices.map(ev => vertices_coords[ev[0]]);
		const edges_vector = edges_vertices
			.map(ev => ev.map(v => vertices_coords[v]))
			.map(edge => math.core.subtract2(edge[1], edge[0]));
		const overlap = edges_vector
			.map(vec => math.core.parallel2(vec, vector, epsilon));
		for (let e = 0; e < edges_vertices.length; e += 1) {
			if (!overlap[e]) { continue; }
			if (math.core.fnEpsilonEqualVectors(edges_origin[e], point)) {
				overlap[e] = true;
				continue;
			}
			const vec = math.core.normalize2(math.core.subtract2(edges_origin[e], point));
			const dot = Math.abs(math.core.dot2(vec, normalized));
			overlap[e] = Math.abs(1.0 - dot) < epsilon;
		}
		return overlap;
	};
	const makeEdgesSegmentIntersection = ({
		vertices_coords, edges_vertices, edges_coords,
	}, point1, point2, epsilon = math.core.EPSILON) => {
		if (!edges_coords) {
			edges_coords = makeEdgesCoords({ vertices_coords, edges_vertices });
		}
		const segment_box = math.core.boundingBox([point1, point2], epsilon);
		const segment_vector = math.core.subtract2(point2, point1);
		return makeEdgesBoundingBox({ vertices_coords, edges_vertices, edges_coords }, epsilon)
			.map(box => math.core.overlapBoundingBoxes(segment_box, box))
			.map((overlap, i) => (overlap ? (math.core.intersectLineLine(
				segment_vector,
				point1,
				math.core.subtract2(edges_coords[i][1], edges_coords[i][0]),
				edges_coords[i][0],
				math.core.includeS,
				math.core.includeS,
				epsilon,
			)) : undefined));
	};
	const makeEdgesEdgesIntersection = function ({
		vertices_coords, edges_vertices, edges_vector, edges_origin,
	}, epsilon = math.core.EPSILON) {
		if (!edges_vector) {
			edges_vector = makeEdgesVector({ vertices_coords, edges_vertices });
		}
		if (!edges_origin) {
			edges_origin = edges_vertices.map(ev => vertices_coords[ev[0]]);
		}
		const edges_intersections = edges_vector.map(() => []);
		const span = getEdgesEdgesOverlapingSpans({ vertices_coords, edges_vertices }, epsilon);
		for (let i = 0; i < edges_vector.length - 1; i += 1) {
			for (let j = i + 1; j < edges_vector.length; j += 1) {
				if (span[i][j] !== true) { continue; }
				const intersection = math.core.intersectLineLine(
					edges_vector[i],
					edges_origin[i],
					edges_vector[j],
					edges_origin[j],
					math.core.excludeS,
					math.core.excludeS,
					epsilon,
				);
				if (intersection !== undefined) {
					edges_intersections[i][j] = intersection;
					edges_intersections[j][i] = intersection;
				}
			}
		}
		return edges_intersections;
	};
	const intersectConvexFaceLine = ({
		vertices_coords, edges_vertices, faces_vertices, faces_edges,
	}, face, vector, point, epsilon = math.core.EPSILON) => {
		const face_vertices_indices = faces_vertices[face]
			.map(v => vertices_coords[v])
			.map(coord => math.core.overlapLinePoint(vector, point, coord, () => true, epsilon))
			.map((overlap, i) => (overlap ? i : undefined))
			.filter(i => i !== undefined);
		const vertices = face_vertices_indices.map(i => faces_vertices[face][i]);
		const vertices_are_neighbors = face_vertices_indices
			.concat(face_vertices_indices.map(i => i + faces_vertices[face].length))
			.map((n, i, arr) => arr[i + 1] - n === 1)
			.reduce((a, b) => a || b, false);
		if (vertices_are_neighbors) { return undefined; }
		if (vertices.length > 1) { return { vertices, edges: [] }; }
		const edges = faces_edges[face]
			.map(edge => edges_vertices[edge]
				.map(v => vertices_coords[v]))
			.map(seg => math.core.intersectLineLine(
				vector,
				point,
				math.core.subtract(seg[1], seg[0]),
				seg[0],
				math.core.includeL,
				math.core.excludeS,
				epsilon,
			)).map((coords, face_edge_index) => ({
				coords,
				edge: faces_edges[face][face_edge_index],
			}))
			.filter(el => el.coords !== undefined)
			.filter(el => !(vertices
				.map(v => edges_vertices[el.edge].includes(v))
				.reduce((a, b) => a || b, false)));
		return (edges.length + vertices.length === 2
			? { vertices, edges }
			: undefined);
	};

	var intersectMethods = /*#__PURE__*/Object.freeze({
		__proto__: null,
		makeEdgesLineParallelOverlap: makeEdgesLineParallelOverlap,
		makeEdgesSegmentIntersection: makeEdgesSegmentIntersection,
		makeEdgesEdgesIntersection: makeEdgesEdgesIntersection,
		intersectConvexFaceLine: intersectConvexFaceLine
	});

	const fragment_graph = (graph, epsilon = math.core.EPSILON) => {
		const edges_coords = graph.edges_vertices
			.map(ev => ev.map(v => graph.vertices_coords[v]));
		const edges_vector = edges_coords.map(e => math.core.subtract(e[1], e[0]));
		const edges_origin = edges_coords.map(e => e[0]);
		const edges_intersections = makeEdgesEdgesIntersection({
			vertices_coords: graph.vertices_coords,
			edges_vertices: graph.edges_vertices,
			edges_vector,
			edges_origin,
		}, 1e-6);
		const edges_collinear_vertices = getVerticesEdgesOverlap({
			vertices_coords: graph.vertices_coords,
			edges_vertices: graph.edges_vertices,
			edges_coords,
		}, epsilon);
		if (edges_intersections.flat().filter(a => a !== undefined).length === 0
			&& edges_collinear_vertices.flat().filter(a => a !== undefined).length === 0) {
			return undefined;
		}
		const counts = { vertices: graph.vertices_coords.length };
		edges_intersections
			.forEach(edge => edge
				.filter(a => a !== undefined)
				.filter(a => a.length === 2)
				.forEach((intersect) => {
					const newIndex = graph.vertices_coords.length;
					graph.vertices_coords.push([...intersect]);
					intersect.splice(0, 2);
					intersect.push(newIndex);
				}));
		edges_intersections.forEach((edge, i) => {
			edge.forEach((intersect, j) => {
				if (intersect) {
					edges_intersections[i][j] = intersect[0];
				}
			});
		});
		const edges_intersections_flat = edges_intersections
			.map(arr => arr.filter(a => a !== undefined));
		graph.edges_vertices.forEach((verts, i) => verts
			.push(...edges_intersections_flat[i], ...edges_collinear_vertices[i]));
		graph.edges_vertices.forEach((edge, i) => {
			graph.edges_vertices[i] = sortVerticesAlongVector({
				vertices_coords: graph.vertices_coords,
			}, edge, edges_vector[i]);
		});
		const edge_map = graph.edges_vertices
			.map((edge, i) => Array(edge.length - 1).fill(i))
			.flat();
		graph.edges_vertices = graph.edges_vertices
			.map(edge => Array.from(Array(edge.length - 1))
				.map((_, i, arr) => [edge[i], edge[i + 1]]))
			.flat();
		if (graph.edges_assignment && graph.edges_foldAngle
			&& graph.edges_foldAngle.length > graph.edges_assignment.length) {
			for (let i = graph.edges_assignment.length; i < graph.edges_foldAngle.length; i += 1) {
				graph.edges_assignment[i] = edgeFoldAngleToAssignment(graph.edges_foldAngle[i]);
			}
		}
		if (graph.edges_assignment) {
			graph.edges_assignment = edge_map.map(i => graph.edges_assignment[i] || "U");
		}
		if (graph.edges_foldAngle) {
			graph.edges_foldAngle = edge_map
				.map(i => graph.edges_foldAngle[i])
				.map((a, i) => (a === undefined
					? edgeAssignmentToFoldAngle(graph.edges_assignment[i])
					: a));
		}
		return {
			vertices: {
				new: Array.from(Array(graph.vertices_coords.length - counts.vertices))
					.map((_, i) => counts.vertices + i),
			},
			edges: {
				backmap: edge_map,
			},
		};
	};
	const fragment_keep_keys = [
		_vertices_coords,
		_edges_vertices,
		_edges_assignment,
		_edges_foldAngle,
	];
	const fragment = (graph, epsilon = math.core.EPSILON) => {
		graph.vertices_coords = graph.vertices_coords.map(coord => coord.slice(0, 2));
		[_vertices, _edges, _faces]
			.map(key => getGraphKeysWithPrefix(graph, key))
			.flat()
			.filter(key => !(fragment_keep_keys.includes(key)))
			.forEach(key => delete graph[key]);
		const change = {
			vertices: {},
			edges: {},
		};
		let i;
		for (i = 0; i < 20; i += 1) {
			const resVert = removeDuplicateVertices(graph, epsilon / 2);
			const resEdgeDup = removeDuplicateEdges(graph);
			const resEdgeCirc = removeCircularEdges(graph);
			const resFrag = fragment_graph(graph, epsilon);
			if (resFrag === undefined) {
				change.vertices.map = (change.vertices.map === undefined
					? resVert.map
					: mergeNextmaps(change.vertices.map, resVert.map));
				change.edges.map = (change.edges.map === undefined
					? mergeNextmaps(resEdgeDup.map, resEdgeCirc.map)
					: mergeNextmaps(change.edges.map, resEdgeDup.map, resEdgeCirc.map));
				break;
			}
			const invert_frag = invertMap(resFrag.edges.backmap);
			const edgemap = mergeNextmaps(resEdgeDup.map, resEdgeCirc.map, invert_frag);
			change.vertices.map = (change.vertices.map === undefined
				? resVert.map
				: mergeNextmaps(change.vertices.map, resVert.map));
			change.edges.map = (change.edges.map === undefined
				? edgemap
				: mergeNextmaps(change.edges.map, edgemap));
		}
		if (i === 20) {
			throw new Error(Messages.fragment);
		}
		return change;
	};

	const boundingBox = ({ vertices_coords }, padding) => math.core
		.boundingBox(vertices_coords, padding);
	const boundaryVertices = ({ edges_vertices, edges_assignment }) => (
		uniqueElements(edges_vertices
			.filter((_, i) => edges_assignment[i] === "B" || edges_assignment[i] === "b")
			.flat()));
	const emptyBoundaryObject = () => ({ vertices: [], edges: [] });
	const boundary = ({ vertices_edges, edges_vertices, edges_assignment }) => {
		if (edges_assignment === undefined) { return emptyBoundaryObject(); }
		if (!vertices_edges) {
			vertices_edges = makeVerticesEdgesUnsorted({ edges_vertices });
		}
		const edges_vertices_b = edges_assignment
			.map(a => a === "B" || a === "b");
		const edge_walk = [];
		const vertex_walk = [];
		let edgeIndex = -1;
		for (let i = 0; i < edges_vertices_b.length; i += 1) {
			if (edges_vertices_b[i]) { edgeIndex = i; break; }
		}
		if (edgeIndex === -1) { return emptyBoundaryObject(); }
		edges_vertices_b[edgeIndex] = false;
		edge_walk.push(edgeIndex);
		vertex_walk.push(edges_vertices[edgeIndex][0]);
		let nextVertex = edges_vertices[edgeIndex][1];
		while (vertex_walk[0] !== nextVertex) {
			vertex_walk.push(nextVertex);
			edgeIndex = vertices_edges[nextVertex]
				.filter(v => edges_vertices_b[v])
				.shift();
			if (edgeIndex === undefined) { return emptyBoundaryObject(); }
			if (edges_vertices[edgeIndex][0] === nextVertex) {
				[, nextVertex] = edges_vertices[edgeIndex];
			} else {
				[nextVertex] = edges_vertices[edgeIndex];
			}
			edges_vertices_b[edgeIndex] = false;
			edge_walk.push(edgeIndex);
		}
		return {
			vertices: vertex_walk,
			edges: edge_walk,
		};
	};
	const planarBoundary = ({
		vertices_coords, vertices_edges, vertices_vertices, edges_vertices,
	}, infiniteLoopProtection = true) => {
		if (!vertices_vertices) {
			vertices_vertices = makeVerticesVertices({ vertices_coords, vertices_edges, edges_vertices });
		}
		const edge_map = makeVerticesToEdgeBidirectional({ edges_vertices });
		const edge_walk = [];
		const vertex_walk = [];
		const walk = {
			vertices: vertex_walk,
			edges: edge_walk,
		};
		let largestX = -Infinity;
		let first_vertex_i = -1;
		vertices_coords.forEach((v, i) => {
			if (v[0] > largestX) {
				largestX = v[0];
				first_vertex_i = i;
			}
		});
		if (first_vertex_i === -1) { return walk; }
		vertex_walk.push(first_vertex_i);
		const first_vc = vertices_coords[first_vertex_i];
		const first_neighbors = vertices_vertices[first_vertex_i];
		const counter_clock_first_i = first_neighbors
			.map(i => vertices_coords[i])
			.map(vc => [vc[0] - first_vc[0], vc[1] - first_vc[1]])
			.map(vec => Math.atan2(vec[1], vec[0]))
			.map(angle => (angle < 0 ? angle + Math.PI * 2 : angle))
			.map((a, i) => ({ a, i }))
			.sort((a, b) => a.a - b.a)
			.shift()
			.i;
		const second_vertex_i = first_neighbors[counter_clock_first_i];
		const first_edge_lookup = first_vertex_i < second_vertex_i
			? `${first_vertex_i} ${second_vertex_i}`
			: `${second_vertex_i} ${first_vertex_i}`;
		const first_edge = edge_map[first_edge_lookup];
		edge_walk.push(first_edge);
		let prev_vertex_i = first_vertex_i;
		let this_vertex_i = second_vertex_i;
		const start = performance.now();
		const MAX_DURATION = 10000;
		let count = 0;
		while (true) {
			const next_neighbors = vertices_vertices[this_vertex_i];
			const from_neighbor_i = next_neighbors.indexOf(prev_vertex_i);
			const next_neighbor_i = (from_neighbor_i + 1) % next_neighbors.length;
			const next_vertex_i = next_neighbors[next_neighbor_i];
			const next_edge_lookup = this_vertex_i < next_vertex_i
				? `${this_vertex_i} ${next_vertex_i}`
				: `${next_vertex_i} ${this_vertex_i}`;
			const next_edge_i = edge_map[next_edge_lookup];
			if (next_edge_i === edge_walk[0]) {
				return walk;
			}
			vertex_walk.push(this_vertex_i);
			edge_walk.push(next_edge_i);
			prev_vertex_i = this_vertex_i;
			this_vertex_i = next_vertex_i;
			count += 1;
			if (infiniteLoopProtection
				&& count % 1000 === 0
				&& performance.now() - start > MAX_DURATION) {
				throw new Error(Messages.planarBoundary);
			}
		}
	};

	var boundary$1 = /*#__PURE__*/Object.freeze({
		__proto__: null,
		boundingBox: boundingBox,
		boundaryVertices: boundaryVertices,
		boundary: boundary,
		planarBoundary: planarBoundary
	});

	const apply_matrix_to_graph = function (graph, matrix) {
		filterKeysWithSuffix(graph, "coords").forEach((key) => {
			graph[key] = graph[key]
				.map(v => math.core.resize(3, v))
				.map(v => math.core.multiplyMatrix3Vector3(matrix, v));
		});
		filterKeysWithSuffix(graph, "matrix").forEach((key) => {
			graph[key] = graph[key]
				.map(m => math.core.multiplyMatrices3(m, matrix));
		});
		return graph;
	};
	const transform_scale = (graph, ...args) => {
		const scale = args.length === 1
			? [args[0], args[0], args[0]]
			: [1, 1, 1].map((n, i) => (args[i] === undefined ? n : args[i]));
		const matrix = math.core.makeMatrix3Scale(scale);
		return apply_matrix_to_graph(graph, matrix);
	};
	const transform_translate = (graph, ...args) => {
		const vector = math.core.getVector(...args);
		const vector3 = math.core.resize(3, vector);
		const matrix = math.core.makeMatrix3Translate(...vector3);
		return apply_matrix_to_graph(graph, matrix);
	};
	const transform_rotateZ = (graph, angle, ...args) => {
		const vector = math.core.getVector(...args);
		const vector3 = math.core.resize(3, vector);
		const matrix = math.core.makeMatrix3RotateZ(angle, ...vector3);
		return apply_matrix_to_graph(graph, matrix);
	};
	var transform = {
		scale: transform_scale,
		translate: transform_translate,
		rotateZ: transform_rotateZ,
		transform: apply_matrix_to_graph,
	};

	const getFaceFaceSharedVertices = (face_a_vertices, face_b_vertices) => {
		const hash = {};
		face_b_vertices.forEach((v) => { hash[v] = true; });
		const match = face_a_vertices.map(v => !!hash[v]);
		const shared_vertices = [];
		const notShared = match.indexOf(false);
		const already_added = {};
		for (let i = notShared + 1; i < match.length; i += 1) {
			if (match[i] && !already_added[face_a_vertices[i]]) {
				shared_vertices.push(face_a_vertices[i]);
				already_added[face_a_vertices[i]] = true;
			}
		}
		for (let i = 0; i < notShared; i += 1) {
			if (match[i] && !already_added[face_a_vertices[i]]) {
				shared_vertices.push(face_a_vertices[i]);
				already_added[face_a_vertices[i]] = true;
			}
		}
		return shared_vertices;
	};
	const makeFaceSpanningTree = ({ faces_vertices, faces_faces }, root_face = 0) => {
		if (!faces_faces) {
			faces_faces = makeFacesFaces({ faces_vertices });
		}
		if (faces_faces.length === 0) { return []; }
		const tree = [[{ face: root_face }]];
		const visited_faces = {};
		visited_faces[root_face] = true;
		do {
			const next_level_with_duplicates = tree[tree.length - 1]
				.map(current => faces_faces[current.face]
					.map(face => ({ face, parent: current.face })))
				.reduce((a, b) => a.concat(b), []);
			const dup_indices = {};
			next_level_with_duplicates.forEach((el, i) => {
				if (visited_faces[el.face]) { dup_indices[i] = true; }
				visited_faces[el.face] = true;
			});
			const next_level = next_level_with_duplicates
				.filter((_, i) => !dup_indices[i]);
			next_level
				.map(el => getFaceFaceSharedVertices(
					faces_vertices[el.face],
					faces_vertices[el.parent],
				)).forEach((ev, i) => {
					const edge_vertices = ev.slice(0, 2);
					next_level[i].edge_vertices = edge_vertices;
				});
			tree[tree.length] = next_level;
		} while (tree[tree.length - 1].length > 0);
		if (tree.length > 0 && tree[tree.length - 1].length === 0) {
			tree.pop();
		}
		return tree;
	};

	var faceSpanningTree = /*#__PURE__*/Object.freeze({
		__proto__: null,
		getFaceFaceSharedVertices: getFaceFaceSharedVertices,
		makeFaceSpanningTree: makeFaceSpanningTree
	});

	const multiplyVerticesFacesMatrix2 = ({
		vertices_coords, vertices_faces, faces_vertices,
	}, faces_matrix) => {
		if (!vertices_faces) {
			vertices_faces = makeVerticesFaces({ faces_vertices });
		}
		const vertices_matrix = vertices_faces
			.map(faces => faces
				.filter(a => a != null)
				.shift())
			.map(face => (face === undefined
				? math.core.identity2x3
				: faces_matrix[face]));
		return vertices_coords
			.map((coord, i) => math.core.multiplyMatrix2Vector2(vertices_matrix[i], coord));
	};
	const unassigned_angle = { U: true, u: true };
	const makeFacesMatrix = ({
		vertices_coords, edges_vertices, edges_foldAngle, edges_assignment, faces_vertices, faces_faces,
	}, root_face = 0) => {
		if (!edges_assignment && edges_foldAngle) {
			edges_assignment = makeEdgesAssignmentSimple({ edges_foldAngle });
		}
		if (!edges_foldAngle) {
			if (edges_assignment) {
				edges_foldAngle = makeEdgesFoldAngle({ edges_assignment });
			} else {
				edges_foldAngle = Array(edges_vertices.length).fill(0);
			}
		}
		const edge_map = makeVerticesToEdgeBidirectional({ edges_vertices });
		const faces_matrix = faces_vertices.map(() => math.core.identity3x4);
		makeFaceSpanningTree({ faces_vertices, faces_faces }, root_face)
			.slice(1)
			.forEach(level => level
				.forEach((entry) => {
					const coords = entry.edge_vertices.map(v => vertices_coords[v]);
					const edgeKey = entry.edge_vertices.join(" ");
					const edge = edge_map[edgeKey];
					const foldAngle = unassigned_angle[edges_assignment[edge]]
						? Math.PI
						: (edges_foldAngle[edge] * Math.PI) / 180;
					const local_matrix = math.core.makeMatrix3Rotate(
						foldAngle,
						math.core.subtract(...math.core.resizeUp(coords[1], coords[0])),
						coords[0],
					);
					faces_matrix[entry.face] = math.core
						.multiplyMatrices3(faces_matrix[entry.parent], local_matrix);
				}));
		return faces_matrix;
	};
	const assignment_is_folded = {
		M: true, m: true, V: true, v: true, U: true, u: true, F: false, f: false, B: false, b: false,
	};
	const makeEdgesIsFolded = ({ edges_vertices, edges_foldAngle, edges_assignment }) => {
		if (edges_assignment === undefined) {
			return edges_foldAngle === undefined
				? edges_vertices.map(() => true)
				: edges_foldAngle.map(angle => angle < -math.core.EPSILON || angle > math.core.EPSILON);
		}
		return edges_assignment.map(a => assignment_is_folded[a]);
	};
	const makeFacesMatrix2 = ({
		vertices_coords, edges_vertices, edges_foldAngle, edges_assignment, faces_vertices, faces_faces,
	}, root_face = 0) => {
		if (!edges_foldAngle) {
			if (edges_assignment) {
				edges_foldAngle = makeEdgesFoldAngle({ edges_assignment });
			} else {
				edges_foldAngle = Array(edges_vertices.length).fill(0);
			}
		}
		const edges_is_folded = makeEdgesIsFolded({ edges_vertices, edges_foldAngle, edges_assignment });
		const edge_map = makeVerticesToEdgeBidirectional({ edges_vertices });
		const faces_matrix = faces_vertices.map(() => math.core.identity2x3);
		makeFaceSpanningTree({ faces_vertices, faces_faces }, root_face)
			.slice(1)
			.forEach(level => level
				.forEach((entry) => {
					const coords = entry.edge_vertices.map(v => vertices_coords[v]);
					const edgeKey = entry.edge_vertices.join(" ");
					const edge = edge_map[edgeKey];
					const reflect_vector = math.core.subtract2(coords[1], coords[0]);
					const reflect_origin = coords[0];
					const local_matrix = edges_is_folded[edge]
						? math.core.makeMatrix2Reflect(reflect_vector, reflect_origin)
						: math.core.identity2x3;
					faces_matrix[entry.face] = math.core
						.multiplyMatrices2(faces_matrix[entry.parent], local_matrix);
				}));
		return faces_matrix;
	};

	var facesMatrix = /*#__PURE__*/Object.freeze({
		__proto__: null,
		multiplyVerticesFacesMatrix2: multiplyVerticesFacesMatrix2,
		makeFacesMatrix: makeFacesMatrix,
		makeEdgesIsFolded: makeEdgesIsFolded,
		makeFacesMatrix2: makeFacesMatrix2
	});

	const makeVerticesCoordsFolded = ({
		vertices_coords, vertices_faces, edges_vertices, edges_foldAngle,
		edges_assignment, faces_vertices, faces_faces, faces_matrix,
	}, root_face) => {
		faces_matrix = makeFacesMatrix({
			vertices_coords, edges_vertices, edges_foldAngle, edges_assignment, faces_vertices, faces_faces,
		}, root_face);
		if (!vertices_faces) {
			vertices_faces = makeVerticesFaces({ faces_vertices });
		}
		const vertices_matrix = vertices_faces
			.map(faces => faces
				.filter(a => a != null)
				.shift())
			.map(face => (face === undefined
				? math.core.identity3x4
				: faces_matrix[face]));
		return vertices_coords
			.map(coord => math.core.resize(3, coord))
			.map((coord, i) => math.core.multiplyMatrix3Vector3(vertices_matrix[i], coord));
	};
	const makeVerticesCoordsFlatFolded = ({
		vertices_coords, edges_vertices, edges_foldAngle, edges_assignment, faces_vertices, faces_faces,
	}, root_face = 0) => {
		const edges_is_folded = makeEdgesIsFolded({ edges_vertices, edges_foldAngle, edges_assignment });
		const vertices_coords_folded = [];
		faces_vertices[root_face]
			.forEach(v => { vertices_coords_folded[v] = [...vertices_coords[v]]; });
		const faces_flipped = [];
		faces_flipped[root_face] = false;
		const edge_map = makeVerticesToEdgeBidirectional({ edges_vertices });
		makeFaceSpanningTree({ faces_vertices, faces_faces }, root_face)
			.slice(1)
			.forEach(level => level
				.forEach(entry => {
					const edge_key = entry.edge_vertices.join(" ");
					const edge = edge_map[edge_key];
					const coords = edges_vertices[edge].map(v => vertices_coords_folded[v]);
					if (coords[0] === undefined || coords[1] === undefined) { return; }
					const coords_cp = edges_vertices[edge].map(v => vertices_coords[v]);
					const origin_cp = coords_cp[0];
					const vector_cp = math.core.normalize2(math.core.subtract2(coords_cp[1], coords_cp[0]));
					const normal_cp = math.core.rotate90(vector_cp);
					faces_flipped[entry.face] = edges_is_folded[edge]
						? !faces_flipped[entry.parent]
						: faces_flipped[entry.parent];
					const vector_folded = math.core.normalize2(math.core.subtract2(coords[1], coords[0]));
					const origin_folded = coords[0];
					const normal_folded = faces_flipped[entry.face]
						? math.core.rotate270(vector_folded)
						: math.core.rotate90(vector_folded);
					faces_vertices[entry.face]
						.filter(v => vertices_coords_folded[v] === undefined)
						.forEach(v => {
							const to_point = math.core.subtract2(vertices_coords[v], origin_cp);
							const project_norm = math.core.dot(to_point, normal_cp);
							const project_line = math.core.dot(to_point, vector_cp);
							const walk_up = math.core.scale2(vector_folded, project_line);
							const walk_perp = math.core.scale2(normal_folded, project_norm);
							const folded_coords = math.core.add2(math.core.add2(origin_folded, walk_up), walk_perp);
							vertices_coords_folded[v] = folded_coords;
						});
				}));
		return vertices_coords_folded;
	};

	var verticesCoordsFolded = /*#__PURE__*/Object.freeze({
		__proto__: null,
		makeVerticesCoordsFolded: makeVerticesCoordsFolded,
		makeVerticesCoordsFlatFolded: makeVerticesCoordsFlatFolded
	});

	const clone = function (o) {
		let newO;
		let i;
		if (typeof o !== _object) {
			return o;
		}
		if (!o) {
			return o;
		}
		if (Object.prototype.toString.apply(o) === "[object Array]") {
			newO = [];
			for (i = 0; i < o.length; i += 1) {
				newO[i] = clone(o[i]);
			}
			return newO;
		}
		newO = {};
		for (i in o) {
			if (o.hasOwnProperty(i)) {
				newO[i] = clone(o[i]);
			}
		}
		return newO;
	};

	const makeFacesWindingFromMatrix = faces_matrix => faces_matrix
		.map(m => m[0] * m[4] - m[1] * m[3])
		.map(c => c >= 0);
	const makeFacesWindingFromMatrix2 = faces_matrix => faces_matrix
		.map(m => m[0] * m[3] - m[1] * m[2])
		.map(c => c >= 0);
	const makeFacesWinding = ({ vertices_coords, faces_vertices }) => faces_vertices
		.map(vertices => vertices
			.map(v => vertices_coords[v])
			.map((point, i, arr) => [point, arr[(i + 1) % arr.length]])
			.map(pts => (pts[1][0] - pts[0][0]) * (pts[1][1] + pts[0][1]))
			.reduce((a, b) => a + b, 0))
		.map(face => face < 0);

	var facesWinding = /*#__PURE__*/Object.freeze({
		__proto__: null,
		makeFacesWindingFromMatrix: makeFacesWindingFromMatrix,
		makeFacesWindingFromMatrix2: makeFacesWindingFromMatrix2,
		makeFacesWinding: makeFacesWinding
	});

	const explode = (graph) => {
		if (!graph.faces_vertices) { return {}; }
		const faces_edges = graph.faces_edges
			? graph.faces_edges
			: makeFacesEdgesFromVertices(graph);
		const verticesMap = graph.faces_vertices.flatMap(vertices => vertices);
		const edgesMap = faces_edges.flatMap(edges => edges);
		let fv = 0;
		let fe = 0;
		let ev = 0;
		graph.faces_vertices = graph.faces_vertices.map(face => face.map(() => fv++));
		graph.faces_edges = graph.faces_edges.map(face => face.map(() => fe++));
		graph.edges_vertices = graph.faces_edges
			.flatMap(face => face.map((_, i, arr) => {
				const edge_vertices = i === arr.length - 1
					? [ev, (ev + 1 - arr.length)]
					: [ev, (ev + 1)];
				ev += 1;
				return edge_vertices;
			}));
		if (graph.vertices_coords) {
			graph.vertices_coords = clone(verticesMap.map(i => graph.vertices_coords[i]));
		}
		if (graph.edges_assignment) {
			graph.edges_assignment = clone(edgesMap.map(i => graph.edges_assignment[i]));
		}
		if (graph.edges_foldAngle) {
			graph.edges_foldAngle = clone(edgesMap.map(i => graph.edges_foldAngle[i]));
		}
		if (graph.vertices_vertices) { delete graph.vertices_vertices; }
		if (graph.vertices_edges) { delete graph.vertices_edges; }
		if (graph.vertices_faces) { delete graph.vertices_faces; }
		if (graph.edges_edges) { delete graph.edges_edges; }
		if (graph.edges_faces) { delete graph.edges_faces; }
		if (graph.faces_faces) { delete graph.faces_faces; }
		return {
			vertices: { map: verticesMap },
			edges: { map: edgesMap },
		};
	};
	const explodeFaces = (graph) => {
		const vertices_coords = graph.faces_vertices
			.flatMap(face => face
				.map(v => graph.vertices_coords[v]));
		let i = 0;
		const faces_vertices = graph.faces_vertices
			.map(face => face.map(() => i++));
		return {
			vertices_coords: JSON.parse(JSON.stringify(vertices_coords)),
			faces_vertices,
		};
	};
	const explodeShrinkFaces = ({ vertices_coords, faces_vertices }, shrink = 0.333) => {
		const graph = explodeFaces({ vertices_coords, faces_vertices });
		const faces_winding = makeFacesWinding(graph);
		const faces_vectors = graph.faces_vertices
			.map(vertices => vertices.map(v => graph.vertices_coords[v]))
			.map(points => points.map((p, i, arr) => math.core.subtract2(p, arr[(i+1) % arr.length])));
		const faces_centers = makeFacesConvexCenter({ vertices_coords, faces_vertices });
		const faces_point_distances = faces_vertices
			.map(vertices => vertices.map(v => vertices_coords[v]))
			.map((points, f) => points
				.map(point => math.core.distance2(point, faces_centers[f])));
		const faces_bisectors = faces_vectors
			.map((vectors, f) => vectors
				.map((vector, i, arr) => [
					vector,
					math.core.flip(arr[(i - 1 + arr.length) % arr.length]),
				]).map(pair => faces_winding[f]
					? math.core.counterClockwiseBisect2(...pair)
					: math.core.clockwiseBisect2(...pair)))
			.map((vectors, f) => vectors
				.map((vector, i) => math.core.scale(vector, faces_point_distances[f][i])));
		graph.faces_vertices
			.forEach((vertices, f) => vertices
				.forEach((v, i) => {
					graph.vertices_coords[v] = math.core.add2(
						graph.vertices_coords[v],
						math.core.scale2(faces_bisectors[f][i], -shrink),
					);
				}));
		return graph;
	};

	var explodeFacesMethods = /*#__PURE__*/Object.freeze({
		__proto__: null,
		explode: explode,
		explodeFaces: explodeFaces,
		explodeShrinkFaces: explodeShrinkFaces
	});

	const nearestVertex = ({ vertices_coords }, point) => {
		if (!vertices_coords) { return undefined; }
		const p = math.core.resize(vertices_coords[0].length, point);
		const nearest = vertices_coords
			.map((v, i) => ({ d: math.core.distance(p, v), i }))
			.sort((a, b) => a.d - b.d)
			.shift();
		return nearest ? nearest.i : undefined;
	};
	const nearestEdge = ({ vertices_coords, edges_vertices }, point) => {
		if (!vertices_coords || !edges_vertices) { return undefined; }
		const nearest_points = edges_vertices
			.map(e => e.map(ev => vertices_coords[ev]))
			.map(e => math.core.nearestPointOnLine(
				math.core.subtract(e[1], e[0]),
				e[0],
				point,
				math.core.segmentLimiter,
			));
		return math.core.smallestComparisonSearch(point, nearest_points, math.core.distance);
	};
	const faceContainingPoint = ({ vertices_coords, faces_vertices }, point) => {
		if (!vertices_coords || !faces_vertices) { return undefined; }
		const face = faces_vertices
			.map((fv, i) => ({ face: fv.map(v => vertices_coords[v]), i }))
			.filter(f => math.core.overlapConvexPolygonPoint(f.face, point))
			.shift();
		return (face === undefined ? undefined : face.i);
	};
	const nearestFace = (graph, point) => {
		const face = faceContainingPoint(graph, point);
		if (face !== undefined) { return face; }
		if (graph.edges_faces) {
			const edge = nearestEdge(graph, point);
			const faces = graph.edges_faces[edge];
			if (faces.length === 1) { return faces[0]; }
			if (faces.length > 1) {
				const faces_center = makeFacesConvexCenter({
					vertices_coords: graph.vertices_coords,
					faces_vertices: faces.map(f => graph.faces_vertices[f]),
				});
				const distances = faces_center
					.map(center => math.core.distance(center, point));
				let shortest = 0;
				for (let i = 0; i < distances.length; i += 1) {
					if (distances[i] < distances[shortest]) { shortest = i; }
				}
				return faces[shortest];
			}
		}
		return undefined;
	};
	const nearest = (graph, ...args) => {
		const nearestMethods = {
			vertices: nearestVertex,
			edges: nearestEdge,
			faces: nearestFace,
		};
		const point = math.core.getVector(...args);
		const nears = Object.create(null);
		["vertices", "edges", "faces"].forEach(key => {
			Object.defineProperty(nears, singularize[key], {
				enumerable: true,
				get: () => nearestMethods[key](graph, point),
			});
			filterKeysWithPrefix(graph, key)
				.forEach(fold_key => Object.defineProperty(nears, fold_key, {
					enumerable: true,
					get: () => graph[fold_key][nears[singularize[key]]],
				}));
		});
		return nears;
	};

	var nearestMethods$1 = /*#__PURE__*/Object.freeze({
		__proto__: null,
		nearestVertex: nearestVertex,
		nearestEdge: nearestEdge,
		faceContainingPoint: faceContainingPoint,
		nearestFace: nearestFace,
		nearest: nearest
	});

	const addVertices = (graph, vertices_coords, epsilon = math.core.EPSILON) => {
		if (!graph.vertices_coords) { graph.vertices_coords = []; }
		if (typeof vertices_coords[0] === "number") { vertices_coords = [vertices_coords]; }
		const vertices_equivalent_vertices = vertices_coords
			.map(vertex => graph.vertices_coords
				.map(v => math.core.distance(v, vertex) < epsilon)
				.map((on_vertex, i) => (on_vertex ? i : undefined))
				.filter(a => a !== undefined)
				.shift());
		let index = graph.vertices_coords.length;
		const unique_vertices = vertices_coords
			.filter((vert, i) => vertices_equivalent_vertices[i] === undefined);
		graph.vertices_coords.push(...unique_vertices);
		return vertices_equivalent_vertices
			.map(el => (el === undefined ? index++ : el));
	};

	const findAdjacentFacesToEdge = ({
		vertices_faces, edges_vertices, edges_faces, faces_edges, faces_vertices,
	}, edge) => {
		if (edges_faces && edges_faces[edge]) {
			return edges_faces[edge];
		}
		const vertices = edges_vertices[edge];
		if (vertices_faces !== undefined) {
			const faces = [];
			for (let i = 0; i < vertices_faces[vertices[0]].length; i += 1) {
				for (let j = 0; j < vertices_faces[vertices[1]].length; j += 1) {
					if (vertices_faces[vertices[0]][i] === vertices_faces[vertices[1]][j]) {
						if (vertices_faces[vertices[0]][i] === undefined) { continue; }
						faces.push(vertices_faces[vertices[0]][i]);
					}
				}
			}
			return faces;
		}
		if (faces_edges) {
			const faces = [];
			for (let i = 0; i < faces_edges.length; i += 1) {
				for (let e = 0; e < faces_edges[i].length; e += 1) {
					if (faces_edges[i][e] === edge) { faces.push(i); }
				}
			}
			return faces;
		}
		if (faces_vertices) {
			console.warn("todo: findAdjacentFacesToEdge");
		}
	};

	const splitEdgeIntoTwo = (graph, edge_index, new_vertex) => {
		const edge_vertices = graph.edges_vertices[edge_index];
		const new_edges = [
			{ edges_vertices: [edge_vertices[0], new_vertex] },
			{ edges_vertices: [new_vertex, edge_vertices[1]] },
		];
		new_edges.forEach(edge => [_edges_assignment, _edges_foldAngle]
			.filter(key => graph[key] && graph[key][edge_index] !== undefined)
			.forEach(key => { edge[key] = graph[key][edge_index]; }));
		if (graph.vertices_coords && (graph.edges_length || graph.edges_vector)) {
			const coords = new_edges
				.map(edge => edge.edges_vertices
					.map(v => graph.vertices_coords[v]));
			if (graph.edges_vector) {
				new_edges.forEach((edge, i) => {
					edge.edges_vector = math.core.subtract(coords[i][1], coords[i][0]);
				});
			}
			if (graph.edges_length) {
				new_edges.forEach((edge, i) => {
					edge.edges_length = math.core.distance2(...coords[i]);
				});
			}
		}
		return new_edges;
	};

	const update_vertices_vertices$2 = ({ vertices_vertices }, vertex, incident_vertices) => {
		if (!vertices_vertices) { return; }
		vertices_vertices[vertex] = [...incident_vertices];
		incident_vertices.forEach((v, i, arr) => {
			const otherV = arr[(i + 1) % arr.length];
			const otherI = vertices_vertices[v].indexOf(otherV);
			vertices_vertices[v][otherI] = vertex;
		});
	};
	const update_vertices_sectors = ({
		vertices_coords, vertices_vertices, vertices_sectors,
	}, vertex) => {
		if (!vertices_sectors) { return; }
		vertices_sectors[vertex] = vertices_vertices[vertex].length === 1
			? [math.core.TWO_PI]
			: math.core.counterClockwiseSectors2(vertices_vertices[vertex]
				.map(v => math.core
					.subtract2(vertices_coords[v], vertices_coords[vertex])));
	};
	const update_vertices_edges$2 = ({
		vertices_edges,
	}, old_edge, new_vertex, vertices, new_edges) => {
		if (!vertices_edges) { return; }
		vertices_edges[new_vertex] = [...new_edges];
		vertices
			.map(v => vertices_edges[v].indexOf(old_edge))
			.forEach((index, i) => {
				vertices_edges[vertices[i]][index] = new_edges[i];
			});
	};
	const update_vertices_faces$1 = ({ vertices_faces }, vertex, faces) => {
		if (!vertices_faces) { return; }
		vertices_faces[vertex] = [...faces];
	};
	const update_edges_faces$1 = ({ edges_faces }, new_edges, faces) => {
		if (!edges_faces) { return; }
		new_edges.forEach(edge => { edges_faces[edge] = [...faces]; });
	};
	const update_faces_vertices = ({ faces_vertices }, new_vertex, incident_vertices, faces) => {
		if (!faces_vertices) { return; }
		faces
			.map(i => faces_vertices[i])
			.forEach(face => face
				.map((fv, i, arr) => {
					const nextI = (i + 1) % arr.length;
					return (fv === incident_vertices[0]
									&& arr[nextI] === incident_vertices[1])
									|| (fv === incident_vertices[1]
									&& arr[nextI] === incident_vertices[0])
						? nextI : undefined;
				}).filter(el => el !== undefined)
				.sort((a, b) => b - a)
				.forEach(i => face.splice(i, 0, new_vertex)));
	};
	const update_faces_edges_with_vertices = ({
		edges_vertices, faces_vertices, faces_edges,
	}, faces) => {
		const edge_map = makeVerticesToEdgeBidirectional({ edges_vertices });
		faces
			.map(f => faces_vertices[f]
				.map((vertex, i, arr) => [vertex, arr[(i + 1) % arr.length]])
				.map(pair => edge_map[pair.join(" ")]))
			.forEach((edges, i) => { faces_edges[faces[i]] = edges; });
	};

	const splitEdge = (graph, old_edge, coords, epsilon = math.core.EPSILON) => {
		if (graph.edges_vertices.length < old_edge) { return {}; }
		const incident_vertices = graph.edges_vertices[old_edge];
		if (!coords) {
			coords = math.core.midpoint(...incident_vertices);
		}
		const similar = incident_vertices
			.map(v => graph.vertices_coords[v])
			.map(vert => math.core.distance(vert, coords) < epsilon);
		if (similar[0]) { return { vertex: incident_vertices[0], edges: {} }; }
		if (similar[1]) { return { vertex: incident_vertices[1], edges: {} }; }
		const vertex = graph.vertices_coords.length;
		graph.vertices_coords[vertex] = coords;
		const new_edges = [0, 1].map(i => i + graph.edges_vertices.length);
		splitEdgeIntoTwo(graph, old_edge, vertex)
			.forEach((edge, i) => Object.keys(edge)
				.forEach((key) => { graph[key][new_edges[i]] = edge[key]; }));
		update_vertices_vertices$2(graph, vertex, incident_vertices);
		update_vertices_sectors(graph, vertex);
		update_vertices_edges$2(graph, old_edge, vertex, incident_vertices, new_edges);
		const incident_faces = findAdjacentFacesToEdge(graph, old_edge);
		if (incident_faces) {
			update_vertices_faces$1(graph, vertex, incident_faces);
			update_edges_faces$1(graph, new_edges, incident_faces);
			update_faces_vertices(graph, vertex, incident_vertices, incident_faces);
			update_faces_edges_with_vertices(graph, incident_faces);
		}
		const edge_map = removeGeometryIndices(graph, _edges, [old_edge]);
		new_edges.forEach((_, i) => { new_edges[i] = edge_map[new_edges[i]]; });
		edge_map.splice(-2);
		edge_map[old_edge] = new_edges;
		return {
			vertex,
			edges: {
				map: edge_map,
				new: new_edges,
				remove: old_edge,
			},
		};
	};

	const make_edge = ({ vertices_coords }, vertices, face) => {
		const new_edge_coords = vertices
			.map(v => vertices_coords[v])
			.reverse();
		return {
			edges_vertices: [...vertices],
			edges_foldAngle: 0,
			edges_assignment: "U",
			edges_length: math.core.distance2(...new_edge_coords),
			edges_vector: math.core.subtract(...new_edge_coords),
			edges_faces: [face, face],
		};
	};
	const rebuild_edge = (graph, face, vertices) => {
		const edge = graph.edges_vertices.length;
		const new_edge = make_edge(graph, vertices, face);
		Object.keys(new_edge)
			.filter(key => graph[key] !== undefined)
			.forEach((key) => { graph[key][edge] = new_edge[key]; });
		return edge;
	};

	const make_faces = ({
		edges_vertices, faces_vertices, faces_edges,
	}, face, vertices) => {
		const indices = vertices.map(el => faces_vertices[face].indexOf(el));
		const faces = splitCircularArray(faces_vertices[face], indices)
			.map(fv => ({ faces_vertices: fv }));
		if (faces_edges) {
			const vertices_to_edge = makeVerticesToEdgeBidirectional({ edges_vertices });
			faces
				.map(this_face => this_face.faces_vertices
					.map((fv, i, arr) => `${fv} ${arr[(i + 1) % arr.length]}`)
					.map(key => vertices_to_edge[key]))
				.forEach((face_edges, i) => { faces[i].faces_edges = face_edges; });
		}
		return faces;
	};
	const build_faces = (graph, face, vertices) => {
		const faces = [0, 1].map(i => graph.faces_vertices.length + i);
		make_faces(graph, face, vertices)
			.forEach((newface, i) => Object.keys(newface)
				.forEach((key) => { graph[key][faces[i]] = newface[key]; }));
		return faces;
	};

	const split_at_intersections = (graph, { vertices, edges }) => {
		let map;
		const split_results = edges.map((el) => {
			const res = splitEdge(graph, map ? map[el.edge] : el.edge, el.coords);
			map = map ? mergeNextmaps(map, res.edges.map) : res.edges.map;
			return res;
		});
		vertices.push(...split_results.map(res => res.vertex));
		let bkmap;
		split_results.forEach(res => {
			res.edges.remove = bkmap ? bkmap[res.edges.remove] : res.edges.remove;
			const inverted = invertSimpleMap(res.edges.map);
			bkmap = bkmap ? mergeBackmaps(bkmap, inverted) : inverted;
		});
		return {
			vertices,
			edges: {
				map,
				remove: split_results.map(res => res.edges.remove),
			},
		};
	};

	const update_vertices_vertices$1 = ({
		vertices_coords, vertices_vertices, edges_vertices,
	}, edge) => {
		const v0 = edges_vertices[edge][0];
		const v1 = edges_vertices[edge][1];
		vertices_vertices[v0] = sortVerticesCounterClockwise(
			{ vertices_coords },
			vertices_vertices[v0].concat(v1),
			v0,
		);
		vertices_vertices[v1] = sortVerticesCounterClockwise(
			{ vertices_coords },
			vertices_vertices[v1].concat(v0),
			v1,
		);
	};
	const update_vertices_edges$1 = ({
		edges_vertices, vertices_edges, vertices_vertices,
	}, edge) => {
		if (!vertices_edges || !vertices_vertices) { return; }
		const vertices = edges_vertices[edge];
		vertices
			.map(v => vertices_vertices[v])
			.map((vert_vert, i) => vert_vert
				.indexOf(vertices[(i + 1) % vertices.length]))
			.forEach((radial_index, i) => vertices_edges[vertices[i]]
				.splice(radial_index, 0, edge));
	};
	const update_vertices_faces = (graph, old_face, new_faces) => {
		const vertices_replacement_faces = {};
		new_faces
			.forEach(f => graph.faces_vertices[f]
				.forEach(v => {
					if (!vertices_replacement_faces[v]) {
						vertices_replacement_faces[v] = [];
					}
					vertices_replacement_faces[v].push(f);
				}));
		graph.faces_vertices[old_face].forEach(v => {
			const index = graph.vertices_faces[v].indexOf(old_face);
			const replacements = vertices_replacement_faces[v];
			if (index === -1 || !replacements) {
				throw new Error(Messages.convexFace);
			}
			graph.vertices_faces[v].splice(index, 1, ...replacements);
		});
	};
	const update_edges_faces = (graph, old_face, new_edge, new_faces) => {
		const edges_replacement_faces = {};
		new_faces
			.forEach(f => graph.faces_edges[f]
				.forEach(e => {
					if (!edges_replacement_faces[e]) { edges_replacement_faces[e] = []; }
					edges_replacement_faces[e].push(f);
				}));
		const edges = [...graph.faces_edges[old_face], new_edge];
		edges.forEach(e => {
			const replacements = edges_replacement_faces[e];
			const indices = [];
			for (let i = 0; i < graph.edges_faces[e].length; i += 1) {
				if (graph.edges_faces[e][i] === old_face) { indices.push(i); }
			}
			if (indices.length === 0 || !replacements) {
				throw new Error(Messages.convexFace);
			}
			indices.reverse().forEach(index => graph.edges_faces[e].splice(index, 1));
			const index = indices[indices.length - 1];
			graph.edges_faces[e].splice(index, 0, ...replacements);
		});
	};
	const update_faces_faces = ({ faces_vertices, faces_faces }, old_face, new_faces) => {
		const incident_faces = faces_faces[old_face];
		const new_faces_vertices = new_faces.map(f => faces_vertices[f]);
		const incident_face_face = incident_faces.map(f => {
			const incident_face_vertices = faces_vertices[f];
			const score = [0, 0];
			for (let n = 0; n < new_faces_vertices.length; n += 1) {
				let count = 0;
				for (let j = 0; j < incident_face_vertices.length; j += 1) {
					if (new_faces_vertices[n].indexOf(incident_face_vertices[j]) !== -1) {
						count += 1;
					}
				}
				score[n] = count;
			}
			if (score[0] >= 2) { return new_faces[0]; }
			if (score[1] >= 2) { return new_faces[1]; }
		});
		new_faces.forEach((f, i, arr) => {
			faces_faces[f] = [arr[(i + 1) % new_faces.length]];
		});
		incident_faces.forEach((f, i) => {
			for (let j = 0; j < faces_faces[f].length; j += 1) {
				if (faces_faces[f][j] === old_face) {
					faces_faces[f][j] = incident_face_face[i];
					faces_faces[incident_face_face[i]].push(f);
				}
			}
		});
	};

	const splitFace = (graph, face, vector, point, epsilon) => {
		const intersect = intersectConvexFaceLine(graph, face, vector, point, epsilon);
		if (intersect === undefined) { return undefined; }
		const result = split_at_intersections(graph, intersect);
		result.edges.new = rebuild_edge(graph, face, result.vertices);
		update_vertices_vertices$1(graph, result.edges.new);
		update_vertices_edges$1(graph, result.edges.new);
		const faces = build_faces(graph, face, result.vertices);
		update_vertices_faces(graph, face, faces);
		update_edges_faces(graph, face, result.edges.new, faces);
		update_faces_faces(graph, face, faces);
		const faces_map = removeGeometryIndices(graph, _faces, [face]);
		faces.forEach((_, i) => { faces[i] = faces_map[faces[i]]; });
		faces_map.splice(-2);
		faces_map[face] = faces;
		result.faces = {
			map: faces_map,
			new: faces,
			remove: face,
		};
		return result;
	};

	const Graph = {};
	Graph.prototype = Object.create(Object.prototype);
	Graph.prototype.constructor = Graph;
	const graphMethods = {
		clean,
		validate,
		populate,
		fragment,
		addVertices: addVertices,
		splitEdge: splitEdge,
		faceSpanningTree: makeFaceSpanningTree,
		explodeFaces: explodeFaces,
		explodeShrinkFaces: explodeShrinkFaces,
		...transform,
	};
	Object.keys(graphMethods).forEach(key => {
		Graph.prototype[key] = function () {
			return graphMethods[key](this, ...arguments);
		};
	});
	Graph.prototype.splitFace = function (face, ...args) {
		const line = math.core.getLine(...args);
		return splitFace(this, face, line.vector, line.origin);
	};
	Graph.prototype.copy = function () {
		return Object.assign(Object.create(Object.getPrototypeOf(this)), clone(this));
	};
	Graph.prototype.clear = function () {
		foldKeys.graph.forEach(key => delete this[key]);
		foldKeys.orders.forEach(key => delete this[key]);
		delete this.file_frames;
		return this;
	};
	Graph.prototype.boundingBox = function () {
		return math.rect.fromPoints(this.vertices_coords);
	};
	Graph.prototype.unitize = function () {
		if (!this.vertices_coords) { return this; }
		const box = math.core.bounding_box(this.vertices_coords);
		const longest = Math.max(...box.span);
		const scale = longest === 0 ? 1 : (1 / longest);
		const origin = box.min;
		this.vertices_coords = this.vertices_coords
			.map(coord => math.core.subtract(coord, origin))
			.map(coord => coord.map(n => n * scale));
		return this;
	};
	Graph.prototype.folded = function () {
		const vertices_coords = this.faces_matrix2
			? multiplyVerticesFacesMatrix2(this, this.faces_matrix2)
			: makeVerticesCoordsFolded(this, ...arguments);
		return Object.assign(
			Object.create(Object.getPrototypeOf(this)),
			Object.assign(clone(this), {
				vertices_coords,
				frame_classes: [_foldedForm],
			}),
		);
	};
	Graph.prototype.flatFolded = function () {
		const vertices_coords = this.faces_matrix2
			? multiplyVerticesFacesMatrix2(this, this.faces_matrix2)
			: makeVerticesCoordsFlatFolded(this, ...arguments);
		return Object.assign(
			Object.create(Object.getPrototypeOf(this)),
			Object.assign(clone(this), {
				vertices_coords,
				frame_classes: [_foldedForm],
			}),
		);
	};
	const shortenKeys = function (el) {
		const object = Object.create(null);
		Object.keys(el).forEach((k) => {
			object[k.substring(this.length + 1)] = el[k];
		});
		return object;
	};
	const getComponent = function (key) {
		return transposeGraphArrays(this, key)
			.map(shortenKeys.bind(key))
			.map(setup[key].bind(this));
	};
	[_vertices, _edges, _faces]
		.forEach(key => Object.defineProperty(Graph.prototype, key, {
			enumerable: true,
			get: function () { return getComponent.call(this, key); },
		}));
	Object.defineProperty(Graph.prototype, _boundary, {
		enumerable: true,
		get: function () {
			const b = boundary(this);
			const poly = b.vertices.map(v => this.vertices_coords[v]);
			Object.keys(b).forEach(key => { poly[key] = b[key]; });
			return Object.assign(poly, b);
		},
	});
	const nearestMethods = {
		vertices: nearestVertex,
		edges: nearestEdge,
		faces: nearestFace,
	};
	Graph.prototype.nearest = function () {
		const point = math.core.getVector(arguments);
		const nears = Object.create(null);
		const cache = {};
		[_vertices, _edges, _faces].forEach(key => {
			Object.defineProperty(nears, singularize[key], {
				enumerable: true,
				get: () => {
					if (cache[key] !== undefined) { return cache[key]; }
					cache[key] = nearestMethods[key](this, point);
					return cache[key];
				},
			});
			filterKeysWithPrefix(this, key).forEach(fold_key =>
				Object.defineProperty(nears, fold_key, {
					enumerable: true,
					get: () => this[fold_key][nears[singularize[key]]],
				}));
		});
		return nears;
	};
	var GraphProto = Graph.prototype;

	const clip = function (graph, line) {
		const polygon = boundary(graph).vertices.map(v => graph.vertices_coords[v]);
		const vector = line.vector ? line.vector : math.core.subtract2(line[1], line[0]);
		const origin = line.origin ? line.origin : line[0];
		const fn_line = (line.domain_function ? line.domain_function : math.core.includeL);
		return math.core.clipLineConvexPolygon(
			polygon,
			vector,
			origin,
			math.core.include,
			fn_line,
		);
	};

	const addEdges = (graph, edges_vertices) => {
		if (!graph.edges_vertices) { graph.edges_vertices = []; }
		if (typeof edges_vertices[0] === "number") { edges_vertices = [edges_vertices]; }
		const indices = edges_vertices.map((_, i) => graph.edges_vertices.length + i);
		graph.edges_vertices.push(...edges_vertices);
		const index_map = removeDuplicateEdges(graph).map;
		return indices.map(i => index_map[i]);
	};

	const add_segment_edges = (graph, segment_vertices, pre_edge_map) => {
		const unfiltered_segment_edges_vertices = Array
			.from(Array(segment_vertices.length - 1))
			.map((_, i) => [segment_vertices[i], segment_vertices[i + 1]]);
		const seg_not_exist_yet = unfiltered_segment_edges_vertices
			.map(verts => verts.join(" "))
			.map(str => pre_edge_map[str] === undefined);
		const segment_edges_vertices = unfiltered_segment_edges_vertices
			.filter((_, i) => seg_not_exist_yet[i]);
		const segment_edges = Array
			.from(Array(segment_edges_vertices.length))
			.map((_, i) => graph.edges_vertices.length + i);
		segment_edges.forEach((e, i) => {
			graph.edges_vertices[e] = segment_edges_vertices[i];
		});
		if (graph.edges_assignment) {
			segment_edges.forEach(e => { graph.edges_assignment[e] = "U"; });
		}
		if (graph.edges_foldAngle) {
			segment_edges.forEach(e => { graph.edges_foldAngle[e] = 0; });
		}
		for (let i = 0; i < segment_vertices.length; i += 1) {
			const vertex = segment_vertices[i];
			const prev = seg_not_exist_yet[i - 1] ? segment_vertices[i - 1] : undefined;
			const next = seg_not_exist_yet[i] ? segment_vertices[i + 1] : undefined;
			const new_adjacent_vertices = [prev, next].filter(a => a !== undefined);
			const previous_vertices_vertices = graph.vertices_vertices[vertex]
				? graph.vertices_vertices[vertex] : [];
			const unsorted_vertices_vertices = previous_vertices_vertices
				.concat(new_adjacent_vertices);
			graph.vertices_vertices[vertex] = sortVerticesCounterClockwise(
				graph,
				unsorted_vertices_vertices,
				segment_vertices[i],
			);
		}
		const edge_map = makeVerticesToEdgeBidirectional(graph);
		for (let i = 0; i < segment_vertices.length; i += 1) {
			const vertex = segment_vertices[i];
			graph.vertices_edges[vertex] = graph.vertices_vertices[vertex]
				.map(v => edge_map[`${vertex} ${v}`]);
		}
		segment_vertices
			.map(center => (graph.vertices_vertices[center].length === 1
				? [math.core.TWO_PI]
				: math.core.counterClockwiseSectors2(graph.vertices_vertices[center]
					.map(v => math.core
						.subtract2(graph.vertices_coords[v], graph.vertices_coords[center])))))
			.forEach((sectors, i) => {
				graph.vertices_sectors[segment_vertices[i]] = sectors;
			});
		return segment_edges;
	};
	const addPlanarSegment = (graph, point1, point2, epsilon = math.core.EPSILON) => {
		if (!graph.vertices_sectors) {
			graph.vertices_sectors = makeVerticesSectors(graph);
		}
		const segment = [point1, point2].map(p => [p[0], p[1]]);
		const segment_vector = math.core.subtract2(segment[1], segment[0]);
		const intersections = makeEdgesSegmentIntersection(
			graph,
			segment[0],
			segment[1],
			epsilon,
		);
		const intersected_edges = intersections
			.map((pt, e) => (pt === undefined ? undefined : e))
			.filter(a => a !== undefined)
			.sort((a, b) => a - b);
		const faces_map = {};
		intersected_edges
			.forEach(e => graph.edges_faces[e]
				.forEach(f => { faces_map[f] = true; }));
		const intersected_faces = Object.keys(faces_map)
			.map(s => parseInt(s, 10))
			.sort((a, b) => a - b);
		const splitEdge_results = intersected_edges
			.reverse()
			.map(edge => splitEdge(graph, edge, intersections[edge], epsilon));
		const splitEdge_vertices = splitEdge_results.map(el => el.vertex);
		const endpoint_vertices = addVertices(graph, segment, epsilon);
		const new_vertex_hash = {};
		splitEdge_vertices.forEach(v => { new_vertex_hash[v] = true; });
		endpoint_vertices.forEach(v => { new_vertex_hash[v] = true; });
		const new_vertices = Object.keys(new_vertex_hash).map(n => parseInt(n, 10));
		const segment_vertices = sortVerticesAlongVector(graph, new_vertices, segment_vector);
		const edge_map = makeVerticesToEdgeBidirectional(graph);
		const segment_edges = add_segment_edges(graph, segment_vertices, edge_map);
		segment_edges.forEach(e => {
			const v = graph.edges_vertices[e];
			edge_map[`${v[0]} ${v[1]}`] = e;
			edge_map[`${v[1]} ${v[0]}`] = e;
		});
		const face_walk_start_pairs = segment_vertices
			.map(v => graph.vertices_vertices[v]
				.map(adj_v => [[adj_v, v], [v, adj_v]]))
			.reduce((a, b) => a.concat(b), [])
			.reduce((a, b) => a.concat(b), []);
		const walked_edges = {};
		const all_walked_faces = face_walk_start_pairs
			.map(pair => counterClockwiseWalk(graph, pair[0], pair[1], walked_edges))
			.filter(a => a !== undefined);
		const walked_faces = filterWalkedBoundaryFace(all_walked_faces);
		removeGeometryIndices(graph, "faces", intersected_faces);
		const new_faces = walked_faces
			.map((_, i) => graph.faces_vertices.length + i);
		if (graph.faces_vertices) {
			new_faces.forEach((f, i) => {
				graph.faces_vertices[f] = walked_faces[i].vertices;
			});
		}
		if (graph.faces_edges) {
			new_faces.forEach((f, i) => {
				graph.faces_edges[f] = walked_faces[i].edges
					.map(pair => edge_map[pair]);
			});
		}
		if (graph.faces_angles) {
			new_faces.forEach((f, i) => {
				graph.faces_angles[f] = walked_faces[i].faces_angles;
			});
		}
		if (graph.vertices_faces) {
			graph.vertices_faces = makeVerticesFaces(graph);
		}
		if (graph.edges_faces) {
			graph.edges_faces = makeEdgesFacesUnsorted(graph);
		}
		if (graph.faces_faces) {
			graph.faces_faces = makeFacesFaces(graph);
		}
		if (graph.vertices_coords.length !== graph.vertices_vertices.length
			|| graph.vertices_coords.length !== graph.vertices_edges.length
			|| graph.vertices_coords.length !== graph.vertices_faces.length) {
			console.warn("vertices mismatch", JSON.parse(JSON.stringify(graph)));
		}
		if (graph.edges_vertices.length !== graph.edges_faces.length
			|| graph.edges_vertices.length !== graph.edges_assignment.length) {
			console.warn("edges mismatch", JSON.parse(JSON.stringify(graph)));
		}
		if (graph.faces_vertices.length !== graph.faces_edges.length
			|| graph.faces_vertices.length !== graph.faces_faces.length) {
			console.warn("faces mismatch", JSON.parse(JSON.stringify(graph)));
		}
		return segment_edges;
	};

	const update_vertices_vertices = ({ vertices_vertices }, vertices) => {
		const other = [vertices[1], vertices[0]];
		vertices
			.map((v, i) => vertices_vertices[v].indexOf(other[i]))
			.forEach((index, i) => vertices_vertices[vertices[i]].splice(index, 1));
	};
	const update_vertices_edges = ({ vertices_edges }, edge, vertices) => {
		vertices
			.map((v, i) => vertices_edges[v].indexOf(edge))
			.forEach((index, i) => vertices_edges[vertices[i]].splice(index, 1));
	};
	const join_faces = (graph, faces, edge, vertices) => {
		const faces_edge_index = faces
			.map(f => graph.faces_edges[f].indexOf(edge));
		const faces_vertices_index = [];
		faces.forEach((face, f) => graph.faces_vertices[face]
			.forEach((v, i, arr) => {
				const next = arr[(i + 1) % arr.length];
				if ((v === vertices[0] && next === vertices[1])
					|| (v === vertices[1] && next === vertices[0])) {
					faces_vertices_index[f] = i;
				}
			}));
		if (faces_vertices_index[0] === undefined || faces_vertices_index[1] === undefined) { console.warn("removePlanarEdge error joining faces"); }
		const edges_len_before = faces
			.map(f => graph.faces_edges[f].length);
		const vertices_len_before = faces
			.map(f => graph.faces_vertices[f].length);
		const edges_len_after = edges_len_before.map(len => len - 1);
		const vertices_len_after = vertices_len_before.map(len => len - 1);
		const faces_edge_keep = faces_edge_index
			.map((e, i) => (e + 1) % edges_len_before[i]);
		const faces_vertex_keep = faces_vertices_index
			.map((v, i) => (v + 1) % vertices_len_before[i]);
		const new_faces_edges = faces
			.map((face, f) => Array.from(Array(edges_len_after[f]))
				.map((_, i) => (faces_edge_keep[f] + i) % edges_len_before[f])
				.map(index => graph.faces_edges[face][index]));
		const new_faces_vertices = faces
			.map((face, f) => Array.from(Array(vertices_len_after[f]))
				.map((_, i) => (faces_vertex_keep[f] + i) % vertices_len_before[f])
				.map(index => graph.faces_vertices[face][index]));
		const new_faces_faces = faces
			.map(f => graph.faces_faces[f])
			.reduce((a, b) => a.concat(b), [])
			.filter(f => f !== faces[0] && f !== faces[1]);
		return {
			vertices: new_faces_vertices[0].concat(new_faces_vertices[1]),
			edges: new_faces_edges[0].concat(new_faces_edges[1]),
			faces: new_faces_faces,
		};
	};
	const removePlanarEdge = (graph, edge) => {
		const vertices = [...graph.edges_vertices[edge]]
			.sort((a, b) => b - a);
		const faces = [...graph.edges_faces[edge]];
		update_vertices_vertices(graph, vertices);
		update_vertices_edges(graph, edge, vertices);
		const vertices_should_remove = vertices
			.map(v => graph.vertices_vertices[v].length === 0);
		const remove_vertices = vertices
			.filter((vertex, i) => vertices_should_remove[i]);
		if (faces.length === 2 && faces[0] !== faces[1]) {
			const new_face = graph.faces_vertices.length;
			const new_face_data = join_faces(graph, faces, edge, vertices);
			graph.faces_vertices.push(new_face_data.vertices);
			graph.faces_edges.push(new_face_data.edges);
			graph.faces_faces.push(new_face_data.faces);
			graph.vertices_faces.forEach((arr, i) => {
				let already_added = false;
				arr.forEach((face, j) => {
					if (face === faces[0] || face === faces[1]) {
						graph.vertices_faces[i][j] = new_face;
						const params = already_added ? [i, 1] : [i, 1, new_face];
						arr.splice(...params);
						already_added = true;
					}
				});
			});
			graph.edges_faces.forEach((arr, i) => arr.forEach((face, j) => {
				if (face === faces[0] || face === faces[1]) {
					graph.edges_faces[i][j] = new_face;
				}
			}));
			graph.faces_faces.forEach((arr, i) => arr.forEach((face, j) => {
				if (face === faces[0] || face === faces[1]) {
					graph.faces_faces[i][j] = new_face;
				}
			}));
			graph.faces_vertices.forEach(fv => fv.forEach(f => {
				if (f === undefined) {
					console.log("FOUND ONE before remove", graph.faces_vertices);
				}
			}));
			removeGeometryIndices(graph, "faces", faces);
		}
		if (faces.length === 2 && faces[0] === faces[1] && remove_vertices.length) {
			const face = faces[0];
			graph.faces_vertices[face] = graph.faces_vertices[face]
				.filter(v => !remove_vertices.includes(v))
				.filter((v, i, arr) => v !== arr[(i+1)%arr.length]);
			graph.faces_edges[face] = graph.faces_edges[face]
				.filter(e => e !== edge);
		}
		removeGeometryIndices(graph, "edges", [edge]);
		removeGeometryIndices(graph, "vertices", remove_vertices);
	};

	const removePlanarVertex = (graph, vertex) => {
		const edges = graph.vertices_edges[vertex];
		const faces = uniqueSortedNumbers(graph.vertices_faces[vertex]
			.filter(a => a != null));
		if (edges.length !== 2 || faces.length > 2) {
			console.warn("cannot remove non 2-degree vertex yet (e,f)", edges, faces);
			return;
		}
		const vertices = getOppositeVertices(graph, vertex, edges);
		const vertices_reverse = vertices.slice().reverse();
		edges.sort((a, b) => a - b);
		vertices.forEach(v => {
			const index = graph.vertices_edges[v].indexOf(edges[1]);
			if (index === -1) { return; }
			graph.vertices_edges[v][index] = edges[0];
		});
		vertices.forEach((v, i) => {
			const index = graph.vertices_vertices[v].indexOf(vertex);
			if (index === -1) {
				console.warn("removePlanarVertex unknown vertex issue");
				return;
			}
			graph.vertices_vertices[v][index] = vertices_reverse[i];
		});
		graph.edges_vertices[edges[0]] = [...vertices];
		faces.forEach(face => {
			const index = graph.faces_vertices[face].indexOf(vertex);
			if (index === -1) {
				console.warn("removePlanarVertex unknown face_vertex issue");
				return;
			}
			graph.faces_vertices[face].splice(index, 1);
		});
		faces.forEach(face => {
			const index = graph.faces_edges[face].indexOf(edges[1]);
			if (index === -1) {
				console.warn("removePlanarVertex unknown face_edge issue");
				return;
			}
			graph.faces_edges[face].splice(index, 1);
		});
		removeGeometryIndices(graph, "vertices", [vertex]);
		removeGeometryIndices(graph, "edges", [edges[1]]);
	};

	const alternatingSum = (numbers) => [0, 1]
		.map(even_odd => numbers
			.filter((_, i) => i % 2 === even_odd)
			.reduce((a, b) => a + b, 0));
	const alternatingSumDifference = (sectors) => {
		const halfsum = sectors.reduce((a, b) => a + b, 0) / 2;
		return alternatingSum(sectors).map(s => s - halfsum);
	};
	const kawasakiSolutionsRadians = (radians) => radians
		.map((v, i, arr) => [v, arr[(i + 1) % arr.length]])
		.map(pair => math.core.counterClockwiseAngleRadians(...pair))
		.map((_, i, arr) => arr.slice(i + 1, arr.length).concat(arr.slice(0, i)))
		.map(opposite_sectors => alternatingSum(opposite_sectors).map(s => Math.PI - s))
		.map((kawasakis, i) => radians[i] + kawasakis[0])
		.map((angle, i) => (math.core.isCounterClockwiseBetween(
			angle,
			radians[i],
			radians[(i + 1) % radians.length],
		)
			? angle
			: undefined));
	const kawasakiSolutionsVectors = (vectors) => {
		const vectors_radians = vectors.map(v => Math.atan2(v[1], v[0]));
		return kawasakiSolutionsRadians(vectors_radians)
			.map(a => (a === undefined
				? undefined
				: [Math.cos(a), Math.sin(a)]));
	};

	var kawasakiMath = /*#__PURE__*/Object.freeze({
		__proto__: null,
		alternatingSum: alternatingSum,
		alternatingSumDifference: alternatingSumDifference,
		kawasakiSolutionsRadians: kawasakiSolutionsRadians,
		kawasakiSolutionsVectors: kawasakiSolutionsVectors
	});

	const flat_assignment = {
		B: true, b: true, F: true, f: true, U: true, u: true,
	};
	const vertices_flat = ({ vertices_edges, edges_assignment }) => vertices_edges
		.map(edges => edges
			.map(e => flat_assignment[edges_assignment[e]])
			.reduce((a, b) => a && b, true))
		.map((valid, i) => (valid ? i : undefined))
		.filter(a => a !== undefined);
	const folded_assignments = {
		M: true, m: true, V: true, v: true,
	};
	const maekawa_signs = {
		M: -1, m: -1, V: 1, v: 1,
	};
	const validateMaekawa = ({ edges_vertices, vertices_edges, edges_assignment }) => {
		if (!vertices_edges) {
			vertices_edges = makeVerticesEdgesUnsorted({ edges_vertices });
		}
		const is_valid = vertices_edges
			.map(edges => edges
				.map(e => maekawa_signs[edges_assignment[e]])
				.filter(a => a !== undefined)
				.reduce((a, b) => a + b, 0))
			.map(sum => sum === 2 || sum === -2);
		boundaryVertices({ edges_vertices, edges_assignment })
			.forEach(v => { is_valid[v] = true; });
		vertices_flat({ vertices_edges, edges_assignment })
			.forEach(v => { is_valid[v] = true; });
		return is_valid
			.map((valid, v) => (!valid ? v : undefined))
			.filter(a => a !== undefined);
	};
	const validateKawasaki = ({
		vertices_coords,
		vertices_vertices,
		vertices_edges,
		edges_vertices,
		edges_assignment,
		edges_vector,
	}, epsilon = math.core.EPSILON) => {
		if (!vertices_vertices) {
			vertices_vertices = makeVerticesVertices({ vertices_coords, vertices_edges, edges_vertices });
		}
		const is_valid = makeVerticesVerticesVector({
			vertices_coords, vertices_vertices, edges_vertices, edges_vector,
		})
			.map((vectors, v) => vectors
				.filter((_, i) => folded_assignments[edges_assignment[vertices_edges[v][i]]]))
			.map(vectors => (vectors.length > 1
				? math.core.counterClockwiseSectors2(vectors)
				: [0, 0]))
			.map(sectors => alternatingSum(sectors))
			.map(pair => Math.abs(pair[0] - pair[1]) < epsilon);
		boundaryVertices({ edges_vertices, edges_assignment })
			.forEach(v => { is_valid[v] = true; });
		vertices_flat({ vertices_edges, edges_assignment })
			.forEach(v => { is_valid[v] = true; });
		return is_valid
			.map((valid, v) => (!valid ? v : undefined))
			.filter(a => a !== undefined);
	};

	var validateSingleVertex = /*#__PURE__*/Object.freeze({
		__proto__: null,
		validateMaekawa: validateMaekawa,
		validateKawasaki: validateKawasaki
	});

	const CreasePattern = {};
	CreasePattern.prototype = Object.create(GraphProto);
	CreasePattern.prototype.constructor = CreasePattern;
	const arcResolution = 96;
	const make_edges_array = function (array) {
		array.mountain = (degrees = -180) => {
			array.forEach(i => {
				this.edges_assignment[i] = "M";
				this.edges_foldAngle[i] = degrees;
			});
			return array;
		};
		array.valley = (degrees = 180) => {
			array.forEach(i => {
				this.edges_assignment[i] = "V";
				this.edges_foldAngle[i] = degrees;
			});
			return array;
		};
		array.flat = () => {
			array.forEach(i => {
				this.edges_assignment[i] = "F";
				this.edges_foldAngle[i] = 0;
			});
			return array;
		};
		return array;
	};
	["line", "ray", "segment"].forEach(type => {
		CreasePattern.prototype[type] = function () {
			const primitive = math[type](...arguments);
			if (!primitive) { return; }
			const segment = clip(this, primitive);
			if (!segment) { return; }
			const edges = addPlanarSegment(this, segment[0], segment[1]);
			return make_edges_array.call(this, edges);
		};
	});
	["circle", "ellipse", "rect", "polygon"].forEach((fName) => {
		CreasePattern.prototype[fName] = function () {
			const primitive = math[fName](...arguments);
			if (!primitive) { return; }
			const segments = primitive.segments(arcResolution)
				.map(segment => math.segment(segment))
				.map(segment => clip(this, segment))
				.filter(a => a !== undefined);
			if (!segments) { return; }
			const vertices = [];
			const edges = [];
			segments.forEach(segment => {
				const verts = addVertices(this, segment);
				vertices.push(...verts);
				edges.push(...addEdges(this, verts));
			});
			const { map } = fragment(this).edges;
			populate(this);
			return make_edges_array.call(this, edges.map(e => map[e])
				.reduce((a, b) => a.concat(b), []));
		};
	});
	CreasePattern.prototype.removeEdge = function (edge) {
		const vertices = this.edges_vertices[edge];
		removePlanarEdge(this, edge);
		vertices
			.map(v => isVertexCollinear(this, v))
			.map((collinear, i) => (collinear ? vertices[i] : undefined))
			.filter(a => a !== undefined)
			.sort((a, b) => b - a)
			.forEach(v => removePlanarVertex(this, v));
		return true;
	};
	CreasePattern.prototype.validate = function (epsilon) {
		const valid = validate(this, epsilon);
		valid.vertices.kawasaki = validateKawasaki(this, epsilon);
		valid.vertices.maekawa = validateMaekawa(this);
		if (this.edges_foldAngle) {
			valid.edges.not_flat = this.edges_foldAngle
				.map((angle, i) => (edgeFoldAngleIsFlat(angle) ? undefined : i))
				.filter(a => a !== undefined);
		}
		if (valid.summary === "valid") {
			if (valid.vertices.kawasaki.length || valid.vertices.maekawa.length) {
				valid.summary = "invalid";
			} else if (valid.edges.not_flat.length) {
				valid.summary = "not flat";
			}
		}
		return valid;
	};
	var CreasePatternProto = CreasePattern.prototype;

	const foldFacesLayer = (faces_layer, faces_folding) => {
		const new_faces_layer = [];
		const arr = faces_layer.map((_, i) => i);
		const folding = arr.filter(i => faces_folding[i]);
		const not_folding = arr.filter(i => !faces_folding[i]);
		not_folding
			.sort((a, b) => faces_layer[a] - faces_layer[b])
			.forEach((face, i) => { new_faces_layer[face] = i; });
		folding
			.sort((a, b) => faces_layer[b] - faces_layer[a])
			.forEach((face, i) => { new_faces_layer[face] = not_folding.length + i; });
		return new_faces_layer;
	};

	const make_face_side = (vector, origin, face_center, face_winding) => {
		const center_vector = math.core.subtract2(face_center, origin);
		const determinant = math.core.cross2(vector, center_vector);
		return face_winding ? determinant > 0 : determinant < 0;
	};
	const make_face_center = (graph, face) => (!graph.faces_vertices[face]
		? [0, 0]
		: graph.faces_vertices[face]
			.map(v => graph.vertices_coords[v])
			.reduce((a, b) => [a[0] + b[0], a[1] + b[1]], [0, 0])
			.map(el => el / graph.faces_vertices[face].length));
	const unfolded_assignment = {
		F: true, f: true, U: true, u: true,
	};
	const opposite_lookup = {
		M: "V", m: "V", V: "M", v: "M",
	};
	const get_opposite_assignment = assign => opposite_lookup[assign] || assign;
	const face_snapshot = (graph, face) => ({
		center: graph.faces_center[face],
		matrix: graph.faces_matrix2[face],
		winding: graph.faces_winding[face],
		crease: graph.faces_crease[face],
		side: graph.faces_side[face],
		layer: graph.faces_layer[face],
	});
	const flatFold = (graph, vector, origin, assignment = "V", epsilon = math.core.EPSILON) => {
		const opposite_assignment = get_opposite_assignment(assignment);
		populate(graph);
		if (!graph.faces_layer) {
			graph.faces_layer = Array(graph.faces_vertices.length).fill(0);
		}
		graph.faces_center = graph.faces_vertices
			.map((_, i) => make_face_center(graph, i));
		if (!graph.faces_matrix2) {
			graph.faces_matrix2 = makeFacesMatrix2(graph, 0);
		}
		graph.faces_winding = makeFacesWindingFromMatrix2(graph.faces_matrix2);
		graph.faces_crease = graph.faces_matrix2
			.map(math.core.invertMatrix2)
			.map(matrix => math.core.multiplyMatrix2Line2(matrix, vector, origin));
		graph.faces_side = graph.faces_vertices
			.map((_, i) => make_face_side(
				graph.faces_crease[i].vector,
				graph.faces_crease[i].origin,
				graph.faces_center[i],
				graph.faces_winding[i],
			));
		const vertices_coords_folded = multiplyVerticesFacesMatrix2(
			graph,
			graph.faces_matrix2,
		);
		const collinear_edges = makeEdgesLineParallelOverlap({
			vertices_coords: vertices_coords_folded,
			edges_vertices: graph.edges_vertices,
		}, vector, origin, epsilon)
			.map((is_collinear, e) => (is_collinear ? e : undefined))
			.filter(e => e !== undefined)
			.filter(e => unfolded_assignment[graph.edges_assignment[e]]);
		collinear_edges
			.map(e => graph.edges_faces[e].find(f => f != null))
			.map(f => graph.faces_winding[f])
			.map(winding => (winding ? assignment : opposite_assignment))
			.forEach((assign, e) => {
				graph.edges_assignment[collinear_edges[e]] = assign;
				graph.edges_foldAngle[collinear_edges[e]] = edgeAssignmentToFoldAngle(
					assign,
				);
			});
		const face0 = face_snapshot(graph, 0);
		const split_changes = graph.faces_vertices
			.map((_, i) => i)
			.reverse()
			.map((i) => {
				const face = face_snapshot(graph, i);
				const change = splitFace(
					graph,
					i,
					face.crease.vector,
					face.crease.origin,
					epsilon,
				);
				if (change === undefined) { return undefined; }
				graph.edges_assignment[change.edges.new] = face.winding
					? assignment
					: opposite_assignment;
				graph.edges_foldAngle[change.edges.new] = edgeAssignmentToFoldAngle(
					graph.edges_assignment[change.edges.new]);
				const new_faces = change.faces.map[change.faces.remove];
				new_faces.forEach(f => {
					graph.faces_center[f] = make_face_center(graph, f);
					graph.faces_side[f] = make_face_side(
						face.crease.vector,
						face.crease.origin,
						graph.faces_center[f],
						face.winding,
					);
					graph.faces_layer[f] = face.layer;
				});
				return change;
			})
			.filter(a => a !== undefined);
		const faces_map = mergeNextmaps(...split_changes.map(el => el.faces.map));
		const edges_map = mergeNextmaps(...split_changes.map(el => el.edges.map)
			.filter(a => a !== undefined));
		const faces_remove = split_changes.map(el => el.faces.remove).reverse();
		graph.faces_layer = foldFacesLayer(
			graph.faces_layer,
			graph.faces_side,
		);
		const face0_was_split = faces_map && faces_map[0] && faces_map[0].length === 2;
		const face0_newIndex = (face0_was_split
			? faces_map[0].filter(f => graph.faces_side[f]).shift()
			: 0);
		let face0_preMatrix = face0.matrix;
		if (assignment !== opposite_assignment) {
			face0_preMatrix = (!face0_was_split && !graph.faces_side[0]
				? face0.matrix
				: math.core.multiplyMatrices2(
					face0.matrix,
					math.core.makeMatrix2Reflect(
						face0.crease.vector,
						face0.crease.origin,
					),
				)
			);
		}
		graph.faces_matrix2 = makeFacesMatrix2(graph, face0_newIndex)
			.map(matrix => math.core.multiplyMatrices2(face0_preMatrix, matrix));
		delete graph.faces_center;
		delete graph.faces_winding;
		delete graph.faces_crease;
		delete graph.faces_side;
		return {
			faces: { map: faces_map, remove: faces_remove },
			edges: { map: edges_map },
		};
	};

	const Origami = {};
	Origami.prototype = Object.create(GraphProto);
	Origami.prototype.constructor = Origami;
	Origami.prototype.flatFold = function () {
		const line = math.core.getLine(arguments);
		flatFold(this, line.vector, line.origin);
		return this;
	};
	var OrigamiProto = Origami.prototype;

	const isFoldedForm = (graph) => (
		(graph.frame_classes && graph.frame_classes.includes("foldedForm"))
			|| (graph.file_classes && graph.file_classes.includes("foldedForm"))
	);

	var query = /*#__PURE__*/Object.freeze({
		__proto__: null,
		isFoldedForm: isFoldedForm
	});

	const connectedComponents = (array_array) => {
		const groups = [];
		const recurse = (index, current_group) => {
			if (groups[index] !== undefined) { return 0; }
			groups[index] = current_group;
			array_array[index].forEach(i => recurse(i, current_group));
			return 1;
		};
		for (let row = 0, group = 0; row < array_array.length; row += 1) {
			if (!(row in array_array)) { continue; }
			group += recurse(row, group);
		}
		return groups;
	};

	const selfRelationalArraySubset = (array_array, indices) => {
		const hash = {};
		indices.forEach(f => { hash[f] = true; });
		const array_arraySubset = [];
		indices.forEach(i => {
			array_arraySubset[i] = array_array[i].filter(j => hash[j]);
		});
		return array_arraySubset;
	};
	const subgraph = (graph, components) => {
		const remove_indices = {};
		const sorted_components = {};
		[_faces, _edges, _vertices].forEach(key => {
			remove_indices[key] = Array.from(Array(count[key](graph))).map((_, i) => i);
			sorted_components[key] = uniqueSortedNumbers(components[key] || []).reverse();
		});
		Object.keys(sorted_components)
			.forEach(key => sorted_components[key]
				.forEach(i => remove_indices[key].splice(i, 1)));
		const res = JSON.parse(JSON.stringify(graph));
		Object.keys(remove_indices)
			.forEach(key => removeGeometryIndices(res, key, remove_indices[key]));
		return res;
	};

	var subgraphMethods = /*#__PURE__*/Object.freeze({
		__proto__: null,
		selfRelationalArraySubset: selfRelationalArraySubset,
		subgraph: subgraph
	});

	const coplanarFacesGroups = ({
		vertices_coords, faces_vertices,
	}, epsilon = math.core.EPSILON) => {
		const faces_normal = makeFacesNormal({ vertices_coords, faces_vertices });
		const facesNormalMatch = faces_vertices.map(() => []);
		for (let a = 0; a < faces_vertices.length - 1; a += 1) {
			for (let b = a + 1; b < faces_vertices.length; b += 1) {
				if (a === b) { continue; }
				if (math.core.parallelNormalized(faces_normal[a], faces_normal[b], epsilon)) {
					facesNormalMatch[a].push(b);
					facesNormalMatch[b].push(a);
				}
			}
		}
		const facesNormalMatchCluster = connectedComponents(facesNormalMatch);
		const normalClustersFaces = invertMap(facesNormalMatchCluster)
			.map(el => (typeof el === "number" ? [el] : el));
		const normalClustersNormal = normalClustersFaces
			.map(faces => faces_normal[faces[0]]);
		const faces_clusterAligned = [];
		normalClustersFaces.forEach((faces, i) => faces.forEach(f => {
			faces_clusterAligned[f] = math.core
				.dot3(faces_normal[f], normalClustersNormal[i]) > 0;
		}));
		const facesOneVertex = faces_vertices
			.map(fv => vertices_coords[fv[0]])
			.map(point => math.core.resize(3, point));
		const normalClustersFacesDot = normalClustersFaces
			.map((faces, i) => faces
				.map(f => math.core.dot3(normalClustersNormal[i], facesOneVertex[f])));
		const clustersClusters = normalClustersFacesDot
			.map((dots, i) => clusterScalars(dots)
				.map(cluster => cluster.map(index => normalClustersFaces[i][index])));
		const clustersNormal = clustersClusters
			.flatMap((cluster, i) => cluster
				.map(() => [...normalClustersNormal[i]]));
		const clusters = clustersClusters.flat();
		const clustersOrigin = clusters
			.map(faces => faces[0])
			.map(face => facesOneVertex[face])
			.map((point, i) => math.core.dot3(clustersNormal[i], point))
			.map((mag, i) => math.core.scale3(clustersNormal[i], mag));
		return clusters.map((faces, i) => ({
			plane: {
				normal: clustersNormal[i],
				origin: clustersOrigin[i],
			},
			faces,
			facesAligned: faces.map(f => faces_clusterAligned[f]),
		}));
	};
	const coplanarOverlappingFacesGroups = ({
		vertices_coords, faces_vertices, faces_faces,
	}, epsilon = math.core.EPSILON) => {
		if (!faces_faces) {
			faces_faces = makeFacesFaces({ faces_vertices });
		}
		const coplanarFaces = coplanarFacesGroups(
			{ vertices_coords, faces_vertices },
			epsilon,
		);
		const faces_winding = [];
		coplanarFaces.forEach(cluster => cluster.facesAligned
			.forEach((aligned, j) => { faces_winding[cluster.faces[j]] = aligned; }));
		const targetVector = [0, 0, 1];
		const transforms = coplanarFaces
			.map(cluster => cluster.plane.normal)
			.map(normal => {
				const dot = math.core.dot(normal, targetVector);
				return (Math.abs(dot + 1) < 1e-2)
					? math.core.makeMatrix4Rotate(Math.PI, [1, 0, 0])
					: math.core
						.matrix4FromQuaternion(math.core
							.quaternionFromTwoVectors(normal, targetVector));
			});
		const vertices_coords3D = vertices_coords
			.map(coord => math.core.resize(3, coord));
		const planarSets_polygons3D = coplanarFaces
			.map(cluster => cluster.faces
				.map((f, i) => (cluster.facesAligned[i]
					? faces_vertices[f]
					: faces_vertices[f].slice().reverse()))
				.map(verts => verts.map(v => vertices_coords3D[v]))
				.map(polygon => math.core.makePolygonNonCollinear(polygon, epsilon)));
		const faces_polygon = [];
		const planarSets_polygons2D = planarSets_polygons3D
			.map((cluster, i) => cluster
				.map(points => points
					.map(point => math.core.multiplyMatrix4Vector3(transforms[i], point))
					.map(point => [point[0], point[1]])));
		coplanarFaces
			.map(cluster => cluster.faces)
			.forEach((faces, i) => faces
				.forEach((face, j) => {
					faces_polygon[face] = planarSets_polygons2D[i][j];
				}));
		const planarSets_faces_faces = coplanarFaces
			.map(el => el.faces)
			.map(faces => selfRelationalArraySubset(faces_faces, faces));
		const planarSets_faces_set = planarSets_faces_faces
			.map(f_f => connectedComponents(f_f));
		const planarSets_sets_faces = planarSets_faces_set
			.map(faces => invertMap(faces)
				.map(res => (res.constructor === Array ? res : [res])));
		const planarSets_disjointSetsOtherFaces = planarSets_faces_set
			.map(faces_group => {
				const faces = faces_group.map((_, i) => i);
				return faces_group.map(groupIndex => faces
					.filter(face => faces_group[face] !== groupIndex));
			});
		const faces_facesOverlap = faces_vertices.map(() => []);
		planarSets_disjointSetsOtherFaces
			.forEach(planarSet => planarSet.forEach((otherFaces, face) => {
				for (let f = 0; f < otherFaces.length; f += 1) {
					const otherFace = otherFaces[f];
					const polygons = [face, otherFace]
						.map(i => faces_polygon[i]);
					const overlap = math.core
						.overlapConvexPolygons(...polygons, epsilon);
					if (overlap) {
						faces_facesOverlap[face][otherFace] = true;
						faces_facesOverlap[otherFace][face] = true;
					}
				}
			}));
		const planarSets_overlapping_faces_faces = planarSets_disjointSetsOtherFaces
			.map(group => group.map((faces, f) => faces.filter(face => faces_facesOverlap[f][face])));
		const planarSets_overlapping_sets_sets = [];
		planarSets_overlapping_faces_faces
			.forEach((overlapFaces_faces, s) => {
				planarSets_overlapping_sets_sets[s] = [];
				overlapFaces_faces.forEach((values, key) => {
					const thisSet = planarSets_faces_set[s][key];
					const otherSets = values.map(f => planarSets_faces_set[s][f]);
					if (!planarSets_overlapping_sets_sets[s][thisSet]) {
						planarSets_overlapping_sets_sets[s][thisSet] = new Set();
					}
					otherSets.forEach(v => {
						if (!planarSets_overlapping_sets_sets[s][v]) {
							planarSets_overlapping_sets_sets[s][v] = new Set();
						}
					});
					otherSets.forEach(v => {
						planarSets_overlapping_sets_sets[s][thisSet].add(v);
						planarSets_overlapping_sets_sets[s][v].add(thisSet);
					});
				});
			});
		planarSets_overlapping_sets_sets
			.forEach((sets, i) => sets
				.forEach((set, j) => {
					planarSets_overlapping_sets_sets[i][j] = [...set];
				}));
		const planarSets_disjointSetsSets = planarSets_overlapping_sets_sets
			.map(set_set => invertMap(connectedComponents(set_set))
				.map(sets => (sets.constructor === Array ? sets : [sets])));
		const newSets_originalSet = planarSets_disjointSetsSets
			.flatMap((arrays, i) => arrays.map(() => i));
		const planarSets_faces = coplanarFaces
			.map((el, i) => planarSets_disjointSetsSets[i]
				.map(set => set.flatMap(s => planarSets_sets_faces[i][s])));
		const coplanarOverlappingFaces = planarSets_faces
			.flatMap((set, s) => set
				.map(faces => ({
					faces,
					facesAligned: faces.map(f => faces_winding[f]),
					plane: coplanarFaces[s].plane,
				})));
		const sets_plane = newSets_originalSet.map(i => coplanarFaces[i].plane);
		const sets_transformXY = newSets_originalSet.map(i => transforms[i]);
		const sets_faces = coplanarOverlappingFaces.map(sets => sets.faces);
		const faces_set = invertMap(sets_faces);
		return {
			sets_plane,
			sets_transformXY,
			faces_set,
			faces_winding,
			faces_facesOverlap: faces_facesOverlap
				.map(overlap => overlap
					.map((_, i) => i)
					.filter(a => a !== undefined)),
		};
	};

	const disjointFacePlaneSets = ({
		vertices_coords, faces_vertices,
	}, epsilon = math.core.EPSILON) => {
		const coplanarFaces = coplanarFacesGroups({ vertices_coords, faces_vertices }, epsilon);
		const faces_coplanarIndex = [];
		coplanarFaces.forEach((cluster, i) => cluster.faces
			.forEach(f => { faces_coplanarIndex[f] = i; }));
		const faces_winding = [];
		coplanarFaces.forEach(cluster => cluster.facesAligned
			.forEach((aligned, j) => { faces_winding[cluster.faces[j]] = aligned; }));
		const targetVector = [0, 0, 1];
		const transforms = coplanarFaces
			.map(cluster => cluster.plane.normal)
			.map(normal => {
				const dot = math.core.dot(normal, targetVector);
				return (Math.abs(dot + 1) < epsilon * 10)
					? math.core.makeMatrix4Rotate(Math.PI, [1, 0, 0])
					: math.core
						.matrix4FromQuaternion(math.core
							.quaternionFromTwoVectors(normal, targetVector));
			});
		const vertices_coords3D = vertices_coords
			.map(coord => math.core.resize(3, coord));
		const polygons3D = coplanarFaces
			.map(cluster => cluster.faces
				.map((f, i) => (cluster.facesAligned[i]
					? faces_vertices[f]
					: faces_vertices[f].slice().reverse()))
				.map(verts => verts.map(v => vertices_coords3D[v])));
		const polygons2D = polygons3D
			.map((cluster, i) => cluster
				.map(points => points
					.map(point => math.core.multiplyMatrix4Vector3(transforms[i], point))
					.map(point => [point[0], point[1]])));
		const faces_facesOverlap = faces_vertices.map(() => []);
		polygons2D.forEach((polygons, c) => {
			for (let i = 0; i < polygons.length - 1; i += 1) {
				for (let j = i + 1; j < polygons.length; j += 1) {
					const clip = math.core.clipPolygonPolygon(polygons[i], polygons[j]);
					if (clip !== undefined) {
						const faces = [coplanarFaces[c].faces[i], coplanarFaces[c].faces[j]];
						faces_facesOverlap[faces[0]].push(faces[1]);
						faces_facesOverlap[faces[1]].push(faces[0]);
					}
				}
			}
		});
		const faces_group = connectedComponents(faces_facesOverlap);
		const groups_faces = invertMap(faces_group)
			.map(el => (typeof el === "number" ? [el] : el));
		return {
			groups_plane: groups_faces
				.map(faces => coplanarFaces[faces_coplanarIndex[faces[0]]].plane),
			groups_transformXY: groups_faces.map(faces => transforms[faces_coplanarIndex[faces[0]]]),
			faces_group: faces_group,
			faces_winding,
			faces_facesOverlap,
		};
	};

	var setsMethods = /*#__PURE__*/Object.freeze({
		__proto__: null,
		disjointFacePlaneSets: disjointFacePlaneSets
	});

	const makeEdgesFacesOverlap = ({
		vertices_coords, edges_vertices, edges_vector, edges_faces, faces_vertices,
	}, epsilon) => {
		if (!edges_vector) {
			edges_vector = makeEdgesVector({ vertices_coords, edges_vertices });
		}
		const faces_winding = makeFacesWinding({ vertices_coords, faces_vertices });
		const edges_origin = edges_vertices.map(verts => vertices_coords[verts[0]]);
		const edges_coords = edges_vertices
			.map(verts => verts.map(v => vertices_coords[v]));
		const faces_coords = faces_vertices
			.map(verts => verts.map(v => vertices_coords[v]));
		faces_winding.forEach((winding, i) => {
			if (!winding) {
				faces_coords[i].reverse();
			}
		});
		const matrix = edges_vertices
			.map(() => faces_vertices
				.map(() => undefined));
		edges_faces.forEach((faces, e) => faces
			.forEach(f => { matrix[e][f] = false; }));
		const edges_bounds = makeEdgesBoundingBox({ edges_coords });
		const faces_bounds = faces_coords
			.map(coords => math.core.boundingBox(coords));
		edges_bounds.forEach((edge_bounds, e) => faces_bounds.forEach((face_bounds, f) => {
			if (matrix[e][f] === false) { return; }
			if (!math.core.overlapBoundingBoxes(face_bounds, edge_bounds)) {
				matrix[e][f] = false;
			}
		}));
		edges_coords.forEach((edge_coords, e) => faces_coords.forEach((face_coords, f) => {
			if (matrix[e][f] !== undefined) { return; }
			const point_in_poly = edges_coords[e]
				.map(point => math.core.overlapConvexPolygonPoint(
					faces_coords[f],
					point,
					math.core.exclude,
					epsilon,
				)).reduce((a, b) => a || b, false);
			if (point_in_poly) { matrix[e][f] = true; return; }
			const edge_intersect = math.core.intersectConvexPolygonLine(
				faces_coords[f],
				edges_vector[e],
				edges_origin[e],
				math.core.excludeS,
				math.core.excludeS,
				epsilon,
			);
			if (edge_intersect) { matrix[e][f] = true; return; }
			matrix[e][f] = false;
		}));
		return matrix;
	};
	const getFacesFaces2DOverlap = ({
		vertices_coords, faces_vertices,
	}, epsilon = math.core.EPSILON) => {
		const matrix = Array.from(Array(faces_vertices.length))
			.map(() => Array.from(Array(faces_vertices.length)));
		const faces_coords = faces_vertices
			.map(verts => verts.map(v => vertices_coords[v]));
		const faces_bounds = faces_coords
			.map(polygon => math.core.boundingBox(polygon));
		for (let i = 0; i < faces_bounds.length - 1; i += 1) {
			for (let j = i + 1; j < faces_bounds.length; j += 1) {
				if (!math.core.overlapBoundingBoxes(faces_bounds[i], faces_bounds[j])) {
					matrix[i][j] = false;
					matrix[j][i] = false;
				}
			}
		}
		const faces_polygon = faces_coords
			.map(polygon => math.core.makePolygonNonCollinear(polygon, epsilon));
		for (let i = 0; i < faces_vertices.length - 1; i += 1) {
			for (let j = i + 1; j < faces_vertices.length; j += 1) {
				if (matrix[i][j] === false) { continue; }
				const overlap = math.core.overlapConvexPolygons(
					faces_polygon[i],
					faces_polygon[j],
					epsilon,
				);
				matrix[i][j] = overlap;
				matrix[j][i] = overlap;
			}
		}
		return matrix;
	};

	var overlapGraph = /*#__PURE__*/Object.freeze({
		__proto__: null,
		makeEdgesFacesOverlap: makeEdgesFacesOverlap,
		getFacesFaces2DOverlap: getFacesFaces2DOverlap
	});

	const makeTriangleFan = (indices) => Array.from(Array(indices.length - 2))
		.map((_, i) => [indices[0], indices[i + 1], indices[i + 2]]);
	const triangulateConvexFacesVertices = ({ faces_vertices }) => faces_vertices
		.flatMap(vertices => (vertices.length < 4
			? [vertices]
			: makeTriangleFan(vertices)));
	const groupByThree = (array) => (array.length === 3 ? [array] : Array
		.from(Array(Math.floor(array.length / 3)))
		.map((_, i) => [i * 3 + 0, i * 3 + 1, i * 3 + 2]
			.map(j => array[j])));
	const triangulateNonConvexFacesVertices = ({ vertices_coords, faces_vertices }, earcut) => {
		if (!vertices_coords || !vertices_coords.length) {
			throw new Error(Messages.nonConvexTriangulation);
		}
		const dimension = vertices_coords[0].length;
		return faces_vertices
			.map(fv => fv.flatMap(v => vertices_coords[v]))
			.map(polygon => earcut(polygon, null, dimension))
			.map((vertices, i) => vertices
				.map(j => faces_vertices[i][j]))
			.flatMap(res => groupByThree(res));
	};
	const rebuildWithNewFaces = (graph) => {
		if (!graph.edges_vertices) { graph.edges_vertices = []; }
		const edgeLookup = makeVerticesToEdgeBidirectional(graph);
		let e = graph.edges_vertices.length;
		const newEdgesVertices = [];
		graph.faces_edges = graph.faces_vertices
			.map(vertices => vertices
				.map((v, i, arr) => {
					const edge_vertices = [v, arr[(i + 1) % arr.length]];
					const vertexPair = edge_vertices.join(" ");
					if (vertexPair in edgeLookup) { return edgeLookup[vertexPair]; }
					newEdgesVertices.push(edge_vertices);
					edgeLookup[vertexPair] = e;
					edgeLookup[edge_vertices.reverse().join(" ")] = e;
					return e++;
				}));
		const newEdgeCount = newEdgesVertices.length;
		graph.edges_vertices.push(...newEdgesVertices);
		if (graph.edges_assignment) {
			graph.edges_assignment.push(...Array(newEdgeCount).fill("J"));
		}
		if (graph.edges_foldAngle) {
			graph.edges_foldAngle.push(...Array(newEdgeCount).fill(0));
		}
		if (graph.vertices_vertices) { delete graph.vertices_vertices; }
		if (graph.vertices_edges) { delete graph.vertices_edges; }
		if (graph.vertices_faces) { delete graph.vertices_faces; }
		if (graph.edges_faces) { delete graph.edges_faces; }
		if (graph.faces_faces) { delete graph.faces_faces; }
		if (graph.faceOrders) { delete graph.faceOrders; }
		return graph;
	};
	const makeTriangulatedFacesNextMap = ({ faces_vertices }) => {
		let count = 0;
		return faces_vertices
			.map(verts => Math.max(3, verts.length))
			.map(length => Array.from(Array(length - 2)).map(() => count++));
	};
	const triangulate = (graph, earcut) => {
		if (!graph.faces_vertices) { return {}; }
		const edgeCount = graph.edges_vertices ? graph.edges_vertices.length : 0;
		const nextMap = makeTriangulatedFacesNextMap(graph);
		graph.faces_vertices = earcut
			? triangulateNonConvexFacesVertices(graph, earcut)
			: triangulateConvexFacesVertices(graph);
		rebuildWithNewFaces(graph);
		const newEdges = Array
			.from(Array(graph.edges_vertices.length - edgeCount))
			.map((_, i) => edgeCount + i);
		return {
			faces: { map: nextMap },
			edges: { new: newEdges },
		};
	};

	var triangulateMethods = /*#__PURE__*/Object.freeze({
		__proto__: null,
		triangulateConvexFacesVertices: triangulateConvexFacesVertices,
		triangulateNonConvexFacesVertices: triangulateNonConvexFacesVertices,
		triangulate: triangulate
	});

	const makeEdgesEdgesSimilar = ({
		vertices_coords, edges_vertices, edges_coords,
	}, epsilon = math.core.EPSILON) => {
		if (!edges_coords) {
			edges_coords = makeEdgesCoords({ vertices_coords, edges_vertices });
		}
		const edges_boundingBox = makeEdgesBoundingBox({
			vertices_coords, edges_vertices, edges_coords,
		});
		const matrix = Array.from(Array(edges_coords.length)).map(() => []);
		const dimensions = edges_boundingBox.length ? edges_boundingBox[0].min.length : 0;
		for (let i = 0; i < edges_coords.length - 1; i += 1) {
			for (let j = i + 1; j < edges_coords.length; j += 1) {
				let similar = true;
				for (let d = 0; d < dimensions; d += 1) {
					if (!math.core.fnEpsilonEqual(
						edges_boundingBox[i].min[d],
						edges_boundingBox[j].min[d],
						epsilon,
					) || !math.core.fnEpsilonEqual(
						edges_boundingBox[i].max[d],
						edges_boundingBox[j].max[d],
						epsilon,
					)) {
						similar = false;
					}
				}
				matrix[i][j] = similar;
				matrix[j][i] = similar;
			}
		}
		for (let i = 0; i < edges_coords.length - 1; i += 1) {
			for (let j = i + 1; j < edges_coords.length; j += 1) {
				if (!matrix[i][j]) { continue; }
				const test0 = math.core.fnEpsilonEqualVectors(edges_coords[i][0], edges_coords[j][0], epsilon)
					&& math.core.fnEpsilonEqualVectors(edges_coords[i][1], edges_coords[j][1], epsilon);
				const test1 = math.core.fnEpsilonEqualVectors(edges_coords[i][0], edges_coords[j][1], epsilon)
					&& math.core.fnEpsilonEqualVectors(edges_coords[i][1], edges_coords[j][0], epsilon);
				const similar = test0 || test1;
				matrix[i][j] = similar;
				matrix[j][i] = similar;
			}
		}
		return booleanMatrixToIndexedArray(matrix);
	};
	const makeEdgesEdgesParallel = ({
		vertices_coords, edges_vertices, edges_vector,
	}, epsilon = math.core.EPSILON) => {
		if (!edges_vector) {
			edges_vector = makeEdgesVector({ vertices_coords, edges_vertices });
		}
		const normalized = edges_vector.map(vec => math.core.normalize(vec));
		return normalized
			.map((vec1, i) => normalized
				.map((vec2, j) => (i === j
					? undefined
					: (1 - Math.abs(math.core.dot(normalized[i], normalized[j])) < epsilon)))
				.map((parallel, j) => (parallel ? j : undefined))
				.filter(a => a !== undefined));
	};
	const makeEdgesEdgesNotParallel = ({
		vertices_coords, edges_vertices, edges_vector,
	}, epsilon = math.core.EPSILON) => {
		if (!edges_vector) {
			edges_vector = makeEdgesVector({ vertices_coords, edges_vertices });
		}
		const normalized = edges_vector.map(vec => math.core.normalize(vec));
		return normalized
			.map((vec1, i) => normalized
				.map((vec2, j) => (i === j
					? undefined
					: (1 - Math.abs(math.core.dot(normalized[i], normalized[j])) < epsilon)))
				.map((parallel, j) => (parallel ? undefined : j))
				.filter(a => a !== undefined));
	};
	const makeEdgesEdges2DParallel = ({
		vertices_coords, edges_vertices, edges_vector,
	}, epsilon = math.core.EPSILON) => {
		if (!edges_vector) {
			edges_vector = makeEdgesVector({ vertices_coords, edges_vertices });
		}
		const sorted = edges_vector
			.map(vec => Math.atan2(vec[1], vec[0]))
			.map((a, i) => ({ a, i }))
			.sort((a, b) => a.a - b.a);
		let found = -1;
		sorted.forEach((el, i) => {
			{ return; }
		});
		const shifted = sorted
			.slice(found)
			.concat(sorted.slice(0, found))
			.filter(a => a);
		console.log("shifted", shifted);
	};
	const overwriteEdgesOverlaps = (edges_edges, vectors, origins, func, epsilon) => {
		const edges_edgesOverlap = edges_edges.map(() => []);
		edges_edges
			.forEach((arr, i) => arr
				.forEach(j => {
					if (i >= j) { return; }
					if (math.core.overlapLineLine(
						vectors[i],
						origins[i],
						vectors[j],
						origins[j],
						func,
						func,
						epsilon,
					)) {
						edges_edgesOverlap[i].push(j);
						edges_edgesOverlap[j].push(i);
					}
				}));
		return edges_edgesOverlap;
	};
	const makeEdgesEdgesCrossing = ({
		vertices_coords, edges_vertices, edges_vector,
	}, epsilon) => {
		if (!edges_vector) {
			edges_vector = makeEdgesVector({ vertices_coords, edges_vertices });
		}
		const edges_origin = edges_vertices.map(verts => vertices_coords[verts[0]]);
		const edge_edgesNotParallel = makeEdgesEdgesNotParallel({
			vertices_coords, edges_vertices, edges_vector,
		}, epsilon);
		return overwriteEdgesOverlaps(
			edge_edgesNotParallel,
			edges_vector,
			edges_origin,
			math.core.excludeS,
			epsilon,
		);
	};
	const makeEdgesEdgesParallelOverlap = ({
		vertices_coords, edges_vertices, edges_vector,
	}, epsilon) => {
		if (!edges_vector) {
			edges_vector = makeEdgesVector({ vertices_coords, edges_vertices });
		}
		const edges_origin = edges_vertices.map(verts => vertices_coords[verts[0]]);
		const edges_edgesParallel = makeEdgesEdgesParallel({
			vertices_coords, edges_vertices, edges_vector,
		}, epsilon);
		return overwriteEdgesOverlaps(
			edges_edgesParallel,
			edges_vector,
			edges_origin,
			math.core.excludeS,
			epsilon,
		);
	};

	var edgesEdges = /*#__PURE__*/Object.freeze({
		__proto__: null,
		makeEdgesEdgesSimilar: makeEdgesEdgesSimilar,
		makeEdgesEdgesParallel: makeEdgesEdgesParallel,
		makeEdgesEdges2DParallel: makeEdgesEdges2DParallel,
		makeEdgesEdgesCrossing: makeEdgesEdgesCrossing,
		makeEdgesEdgesParallelOverlap: makeEdgesEdgesParallelOverlap
	});

	const flattenFrame = (graph, frame_num = 1) => {
		if (!graph.file_frames || graph.file_frames.length < frame_num) {
			return graph;
		}
		const dontCopy = [_frame_parent, _frame_inherit];
		const memo = { visited_frames: [] };
		const fileMetadata = {};
		filterKeysWithPrefix(graph, "file_")
			.filter(key => key !== "file_frames")
			.forEach(key => { fileMetadata[key] = graph[key]; });
		const recurse = (recurse_graph, frame, orderArray) => {
			if (memo.visited_frames.indexOf(frame) !== -1) {
				throw new Error(Messages.graphCycle);
			}
			memo.visited_frames.push(frame);
			orderArray = [frame].concat(orderArray);
			if (frame === 0) { return orderArray; }
			if (recurse_graph.file_frames[frame - 1].frame_inherit
				&& recurse_graph.file_frames[frame - 1].frame_parent != null) {
				return recurse(
					recurse_graph,
					recurse_graph.file_frames[frame - 1].frame_parent,
					orderArray,
				);
			}
			return orderArray;
		};
		return recurse(graph, frame_num, []).map((frame) => {
			if (frame === 0) {
				const swap = graph.file_frames;
				graph.file_frames = null;
				const copy = clone(graph);
				graph.file_frames = swap;
				delete copy.file_frames;
				dontCopy.forEach(key => delete copy[key]);
				return copy;
			}
			const outerCopy = clone(graph.file_frames[frame - 1]);
			dontCopy.forEach(key => delete outerCopy[key]);
			return outerCopy;
		}).reduce((a, b) => Object.assign(a, b), fileMetadata);
	};

	var graph_methods = Object.assign(
		Object.create(null),
		{
			count,
			countImplied,
			validate,
			clean,
			populate,
			remove: removeGeometryIndices,
			replace: replaceGeometryIndices,
			removePlanarVertex,
			removePlanarEdge,
			addVertices,
			addEdges,
			splitEdge,
			splitFace,
			flatFold,
			addPlanarSegment,
			clip,
			fragment,
			verticesClusters,
			connectedComponents,
			clone,
			flattenFrame,
		},
		foldKeyMethods,
		foldSpecMethods,
		make,
		boundary$1,
		walk,
		nearestMethods$1,
		sortMethods,
		span,
		maps,
		query,
		setsMethods,
		subgraphMethods,
		intersectMethods,
		overlapGraph,
		triangulateMethods,
		normals,
		transform,
		verticesViolations,
		edgesViolations,
		vertices_collinear,
		edgesEdges,
		verticesCoordsFolded,
		faceSpanningTree,
		facesMatrix,
		facesWinding,
		explodeFacesMethods,
		arrays,
	);

	const file_spec = 1.1;
	const file_creator = "Rabbit Ear";

	const Create = {};
	const make_rect_vertices_coords = (w, h) => [[0, 0], [w, 0], [w, h], [0, h]];
	const make_closed_polygon = (vertices_coords) => populate({
		vertices_coords,
		edges_vertices: vertices_coords
			.map((_, i, arr) => [i, (i + 1) % arr.length]),
		edges_assignment: Array(vertices_coords.length).fill("B"),
	});
	Create.square = (scale = 1) => (
		make_closed_polygon(make_rect_vertices_coords(scale, scale)));
	Create.rectangle = (width = 1, height = 1) => (
		make_closed_polygon(make_rect_vertices_coords(width, height)));
	Create.polygon = (sides = 3, radius = 1) => (
		make_closed_polygon(math.core.makePolygonCircumradius(sides, radius)));
	Create.kite = () => populate({
		vertices_coords: [
			[0, 0], [1, 0], [1, Math.sqrt(2) - 1], [1, 1], [Math.sqrt(2) - 1, 1], [0, 1],
		],
		edges_vertices: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0], [0, 2], [0, 4], [0, 3]],
		edges_assignment: Array.from("BBBBBBVVF"),
	});

	const ObjectConstructors = Object.create(null);
	const ConstructorPrototypes = {
		graph: GraphProto,
		cp: CreasePatternProto,
		origami: OrigamiProto,
	};
	const default_graph = {
		graph: () => {},
		cp: Create.square,
		origami: Create.square,
	};
	const CustomProperties = {
		graph: () => ({ file_spec, file_creator }),
		cp: () => ({ file_spec, file_creator, frame_classes: ["creasePattern"] }),
		origami: () => ({ file_spec, file_creator, frame_classes: ["foldedForm"] }),
	};
	Object.keys(ConstructorPrototypes).forEach(name => {
		ObjectConstructors[name] = function () {
			const argFolds = Array.from(arguments)
				.filter(a => isFoldObject(a))
				.map(obj => JSON.parse(JSON.stringify(obj)));
			return populate(Object.assign(
				Object.create(ConstructorPrototypes[name]),
				(argFolds.length ? {} : default_graph[name]()),
				...argFolds,
				CustomProperties[name](),
			));
		};
		ObjectConstructors[name].prototype = ConstructorPrototypes[name];
		ObjectConstructors[name].prototype.constructor = ObjectConstructors[name];
		Object.keys(Create).forEach(funcName => {
			ObjectConstructors[name][funcName] = function () {
				return ObjectConstructors[name](Create[funcName](...arguments));
			};
		});
	});
	Object.assign(ObjectConstructors.graph, graph_methods);

	const intersectionUD = (line1, line2) => {
		const det = math.core.cross2(line1.normal, line2.normal);
		if (Math.abs(det) < math.core.EPSILON) { return undefined; }
		const x = line1.distance * line2.normal[1] - line2.distance * line1.normal[1];
		const y = line2.distance * line1.normal[0] - line1.distance * line2.normal[0];
		return [x / det, y / det];
	};
	const normalAxiom1 = (point1, point2) => {
		const normal = math.core.normalize2(math.core.rotate90(math.core.subtract2(point2, point1)));
		return {
			normal,
			distance: math.core.dot2(math.core.add2(point1, point2), normal) / 2.0,
		};
	};
	const normalAxiom2 = (point1, point2) => {
		const normal = math.core.normalize2(math.core.subtract2(point2, point1));
		return {
			normal,
			distance: math.core.dot2(math.core.add2(point1, point2), normal) / 2.0,
		};
	};
	const normalAxiom3 = (line1, line2) => {
		const intersect = intersectionUD(line1, line2);
		return intersect === undefined
			? [{
				normal: line1.normal,
				distance: (line1.distance + line2.distance * math.core.dot2(line1.normal, line2.normal)) / 2,
			}]
			: [math.core.add2, math.core.subtract2]
				.map(f => math.core.normalize2(f(line1.normal, line2.normal)))
				.map(normal => ({ normal, distance: math.core.dot2(intersect, normal) }));
	};
	const normalAxiom4 = (line, point) => {
		const normal = math.core.rotate90(line.normal);
		const distance = math.core.dot2(point, normal);
		return { normal, distance };
	};
	const normalAxiom5 = (line, point1, point2) => {
		const p1base = math.core.dot2(point1, line.normal);
		const a = line.distance - p1base;
		const c = math.core.distance2(point1, point2);
		if (a > c) { return []; }
		const b = Math.sqrt(c * c - a * a);
		const a_vec = math.core.scale2(line.normal, a);
		const base_center = math.core.add2(point1, a_vec);
		const base_vector = math.core.scale2(math.core.rotate90(line.normal), b);
		const mirrors = b < math.core.EPSILON
			? [base_center]
			: [math.core.add2(base_center, base_vector), math.core.subtract2(base_center, base_vector)];
		return mirrors
			.map(pt => math.core.normalize2(math.core.subtract2(point2, pt)))
			.map(normal => ({ normal, distance: math.core.dot2(point1, normal) }));
	};
	const cubrt = n => (n < 0
		? -Math.pow(-n, 1 / 3)
		: Math.pow(n, 1 / 3));
	const polynomial = (degree, a, b, c, d) => {
		switch (degree) {
		case 1: return [-d / c];
		case 2: {
			const discriminant = Math.pow(c, 2.0) - (4.0 * b * d);
			if (discriminant < -math.core.EPSILON) { return []; }
			const q1 = -c / (2.0 * b);
			if (discriminant < math.core.EPSILON) { return [q1]; }
			const q2 = Math.sqrt(discriminant) / (2.0 * b);
			return [q1 + q2, q1 - q2];
		}
		case 3: {
			const a2 = b / a;
			const a1 = c / a;
			const a0 = d / a;
			const q = (3.0 * a1 - Math.pow(a2, 2.0)) / 9.0;
			const r = (9.0 * a2 * a1 - 27.0 * a0 - 2.0 * Math.pow(a2, 3.0)) / 54.0;
			const d0 = Math.pow(q, 3.0) + Math.pow(r, 2.0);
			const u = -a2 / 3.0;
			if (d0 > 0.0) {
				const sqrt_d0 = Math.sqrt(d0);
				const s = cubrt(r + sqrt_d0);
				const t = cubrt(r - sqrt_d0);
				return [u + s + t];
			}
			if (Math.abs(d0) < math.core.EPSILON) {
				const s = Math.pow(r, 1.0 / 3.0);
				if (r < 0.0) { return []; }
				return [u + 2.0 * s, u - s];
			}
			const sqrt_d0 = Math.sqrt(-d0);
			const phi = Math.atan2(sqrt_d0, r) / 3.0;
			const r_s = Math.pow((Math.pow(r, 2.0) - d0), 1.0 / 6.0);
			const s_r = r_s * Math.cos(phi);
			const s_i = r_s * Math.sin(phi);
			return [
				u + 2.0 * s_r,
				u - s_r - Math.sqrt(3.0) * s_i,
				u - s_r + Math.sqrt(3.0) * s_i,
			];
		}
		default: return [];
		}
	};
	const normalAxiom6 = (line1, line2, point1, point2) => {
		if (Math.abs(1.0 - (math.core.dot2(line1.normal, point1) / line1.distance)) < 0.02) { return []; }
		const line_vec = math.core.rotate90(line1.normal);
		const vec1 = math.core.subtract2(
			math.core.add2(point1, math.core.scale2(line1.normal, line1.distance)),
			math.core.scale2(point2, 2.0),
		);
		const vec2 = math.core.subtract2(math.core.scale2(line1.normal, line1.distance), point1);
		const c1 = math.core.dot2(point2, line2.normal) - line2.distance;
		const c2 = 2.0 * math.core.dot2(vec2, line_vec);
		const c3 = math.core.dot2(vec2, vec2);
		const c4 = math.core.dot2(math.core.add2(vec1, vec2), line_vec);
		const c5 = math.core.dot2(vec1, vec2);
		const c6 = math.core.dot2(line_vec, line2.normal);
		const c7 = math.core.dot2(vec2, line2.normal);
		const a = c6;
		const b = c1 + c4 * c6 + c7;
		const c = c1 * c2 + c5 * c6 + c4 * c7;
		const d = c1 * c3 + c5 * c7;
		let polynomial_degree = 0;
		if (Math.abs(c) > math.core.EPSILON) { polynomial_degree = 1; }
		if (Math.abs(b) > math.core.EPSILON) { polynomial_degree = 2; }
		if (Math.abs(a) > math.core.EPSILON) { polynomial_degree = 3; }
		return polynomial(polynomial_degree, a, b, c, d)
			.map(n => math.core.add2(
				math.core.scale2(line1.normal, line1.distance),
				math.core.scale2(line_vec, n),
			))
			.map(p => ({ p, normal: math.core.normalize2(math.core.subtract2(p, point1)) }))
			.map(el => ({
				normal: el.normal,
				distance: math.core.dot2(el.normal, math.core.midpoint2(el.p, point1)),
			}));
	};
	const normalAxiom7 = (line1, line2, point) => {
		const normal = math.core.rotate90(line1.normal);
		const norm_norm = math.core.dot2(normal, line2.normal);
		if (Math.abs(norm_norm) < math.core.EPSILON) { return undefined; }
		const a = math.core.dot2(point, normal);
		const b = math.core.dot2(point, line2.normal);
		const distance = (line2.distance + 2.0 * a * norm_norm - b) / (2.0 * norm_norm);
		return { normal, distance };
	};

	var AxiomsND = /*#__PURE__*/Object.freeze({
		__proto__: null,
		normalAxiom1: normalAxiom1,
		normalAxiom2: normalAxiom2,
		normalAxiom3: normalAxiom3,
		normalAxiom4: normalAxiom4,
		normalAxiom5: normalAxiom5,
		normalAxiom6: normalAxiom6,
		normalAxiom7: normalAxiom7
	});

	const axiom1 = (point1, point2) => ({
		vector: math.core.normalize2(math.core.subtract2(...math.core.resizeUp(point2, point1))),
		origin: point1,
	});
	const axiom2 = (point1, point2) => ({
		vector: math.core.normalize2(math.core.rotate90(math.core.subtract2(
			...math.core.resizeUp(point2, point1),
		))),
		origin: math.core.midpoint2(point1, point2),
	});
	const axiom3 = (line1, line2) => math.core
		.bisectLines2(line1.vector, line1.origin, line2.vector, line2.origin);
	const axiom4 = (line, point) => ({
		vector: math.core.rotate90(math.core.normalize2(line.vector)),
		origin: point,
	});
	const axiom5 = (line, point1, point2) => (
		math.core.intersectCircleLine(
			math.core.distance2(point1, point2),
			point1,
			line.vector,
			line.origin,
			math.core.include_l,
		) || []).map(sect => ({
		vector: math.core.normalize2(math.core.rotate90(math.core.subtract2(
			...math.core.resizeUp(sect, point2),
		))),
		origin: math.core.midpoint2(point2, sect),
	}));
	const axiom6 = (line1, line2, point1, point2) => normalAxiom6(
		math.core.rayLineToUniqueLine(line1),
		math.core.rayLineToUniqueLine(line2),
		point1,
		point2,
	).map(math.core.uniqueLineToRayLine);
	const axiom7 = (line1, line2, point) => {
		const intersect = math.core.intersectLineLine(
			line1.vector,
			line1.origin,
			line2.vector,
			point,
			math.core.include_l,
			math.core.include_l,
		);
		return intersect === undefined
			? undefined
			: ({
				vector: math.core.normalize2(math.core.rotate90(math.core.subtract2(
					...math.core.resizeUp(intersect, point),
				))),
				origin: math.core.midpoint2(point, intersect),
			});
	};

	var AxiomsVO = /*#__PURE__*/Object.freeze({
		__proto__: null,
		axiom1: axiom1,
		axiom2: axiom2,
		axiom3: axiom3,
		axiom4: axiom4,
		axiom5: axiom5,
		axiom6: axiom6,
		axiom7: axiom7
	});

	const arrayify = (axiomNumber, solutions) => {
		switch (axiomNumber) {
		case 3: case "3":
		case 5: case "5":
		case 6: case "6": return solutions;
		case 7: case "7": return solutions === undefined ? [] : [solutions];
		default: return [solutions];
		}
	};
	const unarrayify = (axiomNumber, solutions) => {
		switch (axiomNumber) {
		case 3: case "3":
		case 5: case "5":
		case 6: case "6": return solutions;
		default: return solutions ? solutions[0] : undefined;
		}
	};

	const reflectPoint = (foldLine, point) => {
		const matrix = math.core.makeMatrix2Reflect(foldLine.vector, foldLine.origin);
		return math.core.multiplyMatrix2Vector2(matrix, point);
	};
	const validateAxiom1 = (params, boundary) => params.points
		.map(p => math.core.overlapConvexPolygonPoint(boundary, p, math.core.include))
		.reduce((a, b) => a && b, true);
	const validateAxiom2 = validateAxiom1;
	const validateAxiom3 = (params, boundary, results) => {
		const segments = params.lines
			.map(line => math.core.clipLineConvexPolygon(boundary,
				line.vector,
				line.origin,
				math.core.include,
				math.core.includeL));
		if (segments[0] === undefined || segments[1] === undefined) {
			return [false, false];
		}
		const results_clip = results.map(line => (line === undefined
			? undefined
			: math.core.clipLineConvexPolygon(
				boundary,
				line.vector,
				line.origin,
				math.core.include,
				math.core.includeL,
			)));
		const results_inside = [0, 1].map((i) => results_clip[i] !== undefined);
		const seg0Reflect = results.map(foldLine => (foldLine === undefined
			? undefined
			: [
				reflectPoint(foldLine, segments[0][0]),
				reflectPoint(foldLine, segments[0][1]),
			]));
		const reflectMatch = seg0Reflect.map(seg => (seg === undefined
			? false
			: (math.core.overlapLinePoint(
				math.core.subtract(segments[1][1], segments[1][0]),
				segments[1][0],
				seg[0],
				math.core.includeS,
			)
			|| math.core.overlapLinePoint(
				math.core.subtract(segments[1][1], segments[1][0]),
				segments[1][0],
				seg[1],
				math.core.includeS,
			)
			|| math.core.overlapLinePoint(
				math.core.subtract(seg[1], seg[0]),
				seg[0],
				segments[1][0],
				math.core.includeS,
			)
			|| math.core.overlapLinePoint(
				math.core.subtract(seg[1], seg[0]),
				seg[0],
				segments[1][1],
				math.core.includeS,
			))));
		return [0, 1].map(i => reflectMatch[i] === true && results_inside[i] === true);
	};
	const validateAxiom4 = (params, boundary) => {
		const intersect = math.core.intersectLineLine(
			params.lines[0].vector,
			params.lines[0].origin,
			math.core.rotate90(params.lines[0].vector),
			params.points[0],
			math.core.includeL,
			math.core.includeL,
		);
		return [params.points[0], intersect]
			.filter(a => a !== undefined)
			.map(p => math.core.overlapConvexPolygonPoint(boundary, p, math.core.include))
			.reduce((a, b) => a && b, true);
	};
	const validateAxiom5 = (params, boundary, results) => {
		if (results.length === 0) { return []; }
		const testParamPoints = params.points
			.map(point => math.core.overlapConvexPolygonPoint(boundary, point, math.core.include))
			.reduce((a, b) => a && b, true);
		const testReflections = results
			.map(foldLine => reflectPoint(foldLine, params.points[1]))
			.map(point => math.core.overlapConvexPolygonPoint(boundary, point, math.core.include));
		return testReflections.map(ref => ref && testParamPoints);
	};
	const validateAxiom6 = function (params, boundary, results) {
		if (results.length === 0) { return []; }
		const testParamPoints = params.points
			.map(point => math.core.overlapConvexPolygonPoint(boundary, point, math.core.include))
			.reduce((a, b) => a && b, true);
		if (!testParamPoints) { return results.map(() => false); }
		const testReflect0 = results
			.map(foldLine => reflectPoint(foldLine, params.points[0]))
			.map(point => math.core.overlapConvexPolygonPoint(boundary, point, math.core.include));
		const testReflect1 = results
			.map(foldLine => reflectPoint(foldLine, params.points[1]))
			.map(point => math.core.overlapConvexPolygonPoint(boundary, point, math.core.include));
		return results.map((_, i) => testReflect0[i] && testReflect1[i]);
	};
	const validateAxiom7 = (params, boundary, result) => {
		const paramPointTest = math.core
			.overlapConvexPolygonPoint(boundary, params.points[0], math.core.include);
		if (result === undefined) { return [false]; }
		const reflected = reflectPoint(result, params.points[0]);
		const reflectTest = math.core.overlapConvexPolygonPoint(boundary, reflected, math.core.include);
		const paramLineTest = (math.core.intersectConvexPolygonLine(
			boundary,
			params.lines[1].vector,
			params.lines[1].origin,
			math.core.includeS,
			math.core.includeL,
		) !== undefined);
		const intersect = math.core.intersectLineLine(
			params.lines[1].vector,
			params.lines[1].origin,
			result.vector,
			result.origin,
			math.core.includeL,
			math.core.includeL,
		);
		const intersectInsideTest = intersect
			? math.core.overlapConvexPolygonPoint(boundary, intersect, math.core.include)
			: false;
		return paramPointTest && reflectTest && paramLineTest && intersectInsideTest;
	};
	const validateAxiom = (number, params, boundary, results) => arrayify(number, [null,
		validateAxiom1,
		validateAxiom2,
		validateAxiom3,
		validateAxiom4,
		validateAxiom5,
		validateAxiom6,
		validateAxiom7,
	][number](params, boundary, unarrayify(number, results)));

	var Validate = /*#__PURE__*/Object.freeze({
		__proto__: null,
		validateAxiom1: validateAxiom1,
		validateAxiom2: validateAxiom2,
		validateAxiom3: validateAxiom3,
		validateAxiom4: validateAxiom4,
		validateAxiom5: validateAxiom5,
		validateAxiom6: validateAxiom6,
		validateAxiom7: validateAxiom7,
		validateAxiom: validateAxiom
	});

	const paramsVecsToNorms = (params) => ({
		points: params.points,
		lines: params.lines.map(math.core.uniqueLineToRayLine),
	});
	const spreadParams = (params) => {
		const lines = params.lines ? params.lines : [];
		const points = params.points ? params.points : [];
		return [...lines, ...points];
	};
	const axiomInBoundary = (number, params = {}, boundary = undefined) => {
		const solutions = arrayify(
			number,
			AxiomsVO[`axiom${number}`](...spreadParams(params)),
		).map(l => math.line(l));
		if (boundary) {
			arrayify(number, Validate[`validateAxiom${number}`](params, boundary, solutions))
				.forEach((valid, i) => (valid ? i : undefined))
				.filter(a => a !== undefined)
				.forEach(i => delete solutions[i]);
		}
		return solutions;
	};
	const normalAxiomInBoundary = (number, params = {}, boundary = undefined) => {
		const solutions = arrayify(
			number,
			AxiomsND[`normalAxiom${number}`](...spreadParams(params)),
		).map(l => math.line.fromNormalDistance(l));
		if (boundary) {
			arrayify(number, Validate[`validateAxiom${number}`](paramsVecsToNorms(params), boundary, solutions))
				.forEach((valid, i) => (valid ? i : undefined))
				.filter(a => a !== undefined)
				.forEach(i => delete solutions[i]);
		}
		return solutions;
	};

	var BoundaryAxioms = /*#__PURE__*/Object.freeze({
		__proto__: null,
		axiomInBoundary: axiomInBoundary,
		normalAxiomInBoundary: normalAxiomInBoundary
	});

	const axiom = (number, params = {}, boundary = undefined) => axiomInBoundary(number, params, boundary);
	Object.keys(AxiomsVO).forEach(key => { axiom[key] = AxiomsVO[key]; });
	Object.keys(AxiomsND).forEach(key => { axiom[key] = AxiomsND[key]; });
	Object.keys(BoundaryAxioms).forEach(key => { axiom[key] = BoundaryAxioms[key]; });
	axiom.validateAxiom1 = validateAxiom1;
	axiom.validateAxiom2 = validateAxiom2;
	axiom.validateAxiom3 = validateAxiom3;
	axiom.validateAxiom4 = validateAxiom4;
	axiom.validateAxiom5 = validateAxiom5;
	axiom.validateAxiom6 = validateAxiom6;
	axiom.validateAxiom7 = validateAxiom7;
	axiom.validate = validateAxiom;

	const line_line_for_arrows = (a, b) => math.core.intersectLineLine(
		a.vector,
		a.origin,
		b.vector,
		b.origin,
		math.core.includeL,
		math.core.includeL,
	);
	const diagram_reflect_point = (foldLine, point) => {
		const matrix = math.core.makeMatrix2Reflect(foldLine.vector, foldLine.origin);
		return math.core.multiplyMatrix2Vector2(matrix, point);
	};
	const boundary_for_arrows$1 = ({ vertices_coords }) => math.core
		.convexHull(vertices_coords);
	const widest_perp = (graph, foldLine, point) => {
		const boundary = boundary_for_arrows$1(graph);
		if (point === undefined) {
			const foldSegment = math.core.clipLineConvexPolygon(
				boundary,
				foldLine.vector,
				foldLine.origin,
				math.core.exclude,
				math.core.includeL,
			);
			point = math.core.midpoint(...foldSegment);
		}
		const perpVector = math.core.rotate270(foldLine.vector);
		const smallest = math.core
			.clipLineConvexPolygon(
				boundary,
				perpVector,
				point,
				math.core.exclude,
				math.core.includeL,
			).map(pt => math.core.distance(point, pt))
			.sort((a, b) => a - b)
			.shift();
		const scaled = math.core.scale(math.core.normalize(perpVector), smallest);
		return math.segment(
			math.core.add(point, math.core.flip(scaled)),
			math.core.add(point, scaled),
		);
	};
	const between_2_segments = (params, segments, foldLine) => {
		const midpoints = segments
			.map(seg => math.core.midpoint(seg[0], seg[1]));
		const midpointLine = math.line.fromPoints(...midpoints);
		const origin = math.intersect(foldLine, midpointLine);
		const perpLine = math.line(foldLine.vector.rotate90(), origin);
		return math.segment(params.lines.map(line => math.intersect(line, perpLine)));
	};
	const between_2_intersecting_segments = (params, intersect, foldLine, boundary) => {
		const paramVectors = params.lines.map(l => l.vector);
		const flippedVectors = paramVectors.map(math.core.flip);
		const paramRays = paramVectors
			.concat(flippedVectors)
			.map(vec => math.ray(vec, intersect));
		const a1 = paramRays.filter(ray => (
			math.core.dot(ray.vector, foldLine.vector) > 0
			&& math.core.cross2(ray.vector, foldLine.vector) > 0))
			.shift();
		const a2 = paramRays.filter(ray => (
			math.core.dot(ray.vector, foldLine.vector) > 0
			&& math.core.cross2(ray.vector, foldLine.vector) < 0))
			.shift();
		const b1 = paramRays.filter(ray => (
			math.core.dot(ray.vector, foldLine.vector) < 0
			&& math.core.cross2(ray.vector, foldLine.vector) > 0))
			.shift();
		const b2 = paramRays.filter(ray => (
			math.core.dot(ray.vector, foldLine.vector) < 0
			&& math.core.cross2(ray.vector, foldLine.vector) < 0))
			.shift();
		const rayEndpoints = [a1, a2, b1, b2]
			.map(ray => math.core.intersectConvexPolygonLine(
				boundary,
				ray.vector,
				ray.origin,
				math.core.excludeS,
				math.core.excludeR,
			).shift()
				.shift());
		const rayLengths = rayEndpoints
			.map(pt => math.core.distance(pt, intersect));
		const arrowStart = (rayLengths[0] < rayLengths[1]
			? rayEndpoints[0]
			: rayEndpoints[1]);
		const arrowEnd = (rayLengths[0] < rayLengths[1]
			? math.core.add(a2.origin, a2.vector.normalize().scale(rayLengths[0]))
			: math.core.add(a1.origin, a1.vector.normalize().scale(rayLengths[1])));
		const arrowStart2 = (rayLengths[2] < rayLengths[3]
			? rayEndpoints[2]
			: rayEndpoints[3]);
		const arrowEnd2 = (rayLengths[2] < rayLengths[3]
			? math.core.add(b2.origin, b2.vector.normalize().scale(rayLengths[2]))
			: math.core.add(b1.origin, b1.vector.normalize().scale(rayLengths[3])));
		return [
			math.segment(arrowStart, arrowEnd),
			math.segment(arrowStart2, arrowEnd2),
		];
	};
	const axiom_1_arrows = (params, graph) => axiom(1, params)
		.map(foldLine => [widest_perp(graph, foldLine)]);
	const axiom_2_arrows = params => [
		[math.segment(params.points)],
	];
	const axiom_3_arrows = (params, graph) => {
		const boundary = boundary_for_arrows$1(graph);
		const segs = params.lines.map(l => math.core
			.clipLineConvexPolygon(
				boundary,
				l.vector,
				l.origin,
				math.core.exclude,
				math.core.includeL,
			));
		const segVecs = segs.map(seg => math.core.subtract(seg[1], seg[0]));
		const intersect = math.core.intersectLineLine(
			segVecs[0],
			segs[0][0],
			segVecs[1],
			segs[1][0],
			math.core.excludeS,
			math.core.excludeS,
		);
		return !intersect
			? [between_2_segments(params, segs, axiom(3, params)
				.filter(a => a !== undefined).shift())]
			: axiom(3, params).map(foldLine => between_2_intersecting_segments(
				params,
				intersect,
				foldLine,
				boundary,
			));
	};
	const axiom_4_arrows = (params, graph) => axiom(4, params)
		.map(foldLine => [widest_perp(
			graph,
			foldLine,
			line_line_for_arrows(foldLine, params.lines[0]),
		)]);
	const axiom_5_arrows = (params) => axiom(5, params)
		.map(foldLine => [math.segment(
			params.points[1],
			diagram_reflect_point(foldLine, params.points[1]),
		)]);
	const axiom_6_arrows = (params) => axiom(6, params)
		.map(foldLine => params.points
			.map(pt => math.segment(pt, diagram_reflect_point(foldLine, pt))));
	const axiom_7_arrows = (params, graph) => axiom(7, params)
		.map(foldLine => [
			math.segment(params.points[0], diagram_reflect_point(foldLine, params.points[0])),
			widest_perp(graph, foldLine, line_line_for_arrows(foldLine, params.lines[1])),
		]);
	const arrow_functions = [null,
		axiom_1_arrows,
		axiom_2_arrows,
		axiom_3_arrows,
		axiom_4_arrows,
		axiom_5_arrows,
		axiom_6_arrows,
		axiom_7_arrows,
	];
	delete arrow_functions[0];
	const axiomArrows = (number, params = {}, ...args) => {
		const points = params.points
			? params.points.map(p => math.core.getVector(p))
			: undefined;
		const lines = params.lines
			? params.lines.map(l => math.core.getLine(l))
			: undefined;
		return arrow_functions[number]({ points, lines }, ...args);
	};
	Object.keys(arrow_functions).forEach(number => {
		axiomArrows[number] = (...args) => axiomArrows(number, ...args);
	});

	const boundary_for_arrows = ({ vertices_coords }) => math.core
		.convexHull(vertices_coords);
	const widest_perpendicular = (polygon, foldLine, point) => {
		if (point === undefined) {
			const foldSegment = math.core.clipLineConvexPolygon(
				polygon,
				foldLine.vector,
				foldLine.origin,
				math.core.exclude,
				math.core.includeL,
			);
			if (foldSegment === undefined) { return; }
			point = math.core.midpoint(...foldSegment);
		}
		const perpVector = math.core.rotate90(foldLine.vector);
		const smallest = math.core
			.clipLineConvexPolygon(
				polygon,
				perpVector,
				point,
				math.core.exclude,
				math.core.includeL,
			)
			.map(pt => math.core.distance(point, pt))
			.sort((a, b) => a - b)
			.shift();
		const scaled = math.core.scale(math.core.normalize(perpVector), smallest);
		return math.segment(
			math.core.add(point, math.core.flip(scaled)),
			math.core.add(point, scaled)
		);
	};
	const simpleArrow = (graph, line) => {
		const hull = boundary_for_arrows(graph);
		const box = math.core.boundingBox(hull);
		const segment = widest_perpendicular(hull, line);
		if (segment === undefined) { return undefined; }
		const vector = math.core.subtract(segment[1], segment[0]);
		const length = math.core.magnitude(vector);
		const direction = math.core.dot(vector, [1, 0]);
		const vmin = box.span[0] < box.span[1] ? box.span[0] : box.span[1];
		segment.head = {
			width: vmin * 0.1,
			height: vmin * 0.15,
		};
		segment.bend = direction > 0 ? 0.3 : -0.3;
		segment.padding = length * 0.05;
		return segment;
	};

	var diagram = Object.assign(
		Object.create(null),
		{
			axiom_arrows: axiomArrows,
			simple_arrow: simpleArrow,
		},
	);

	const flipFacesLayer = faces_layer => invertMap(
		invertMap(faces_layer).reverse(),
	);
	const facesLayerToEdgesAssignments = (graph, faces_layer) => {
		const edges_assignment = [];
		const faces_winding = makeFacesWinding(graph);
		const edges_faces = graph.edges_faces
			? graph.edges_faces
			: makeEdgesFaces(graph);
		edges_faces.forEach((faces, e) => {
			if (faces.length === 1) { edges_assignment[e] = "B"; }
			if (faces.length === 2) {
				const windings = faces.map(f => faces_winding[f]);
				if (windings[0] === windings[1]) {
					edges_assignment[e] = "F";
					return;
				}
				const layers = faces.map(f => faces_layer[f]);
				const local_dir = layers[0] < layers[1];
				const global_dir = windings[0] ? local_dir : !local_dir;
				edges_assignment[e] = global_dir ? "V" : "M";
			}
		});
		return edges_assignment;
	};
	const faceOrdersToMatrix = (faceOrders) => {
		const faces = [];
		faceOrders.forEach(order => {
			faces[order[0]] = undefined;
			faces[order[1]] = undefined;
		});
		const matrix = faces.map(() => []);
		faceOrders
			.forEach(([a, b, c]) => {
				matrix[a][b] = c;
				matrix[b][a] = -c;
			});
		return matrix;
	};

	var general = /*#__PURE__*/Object.freeze({
		__proto__: null,
		flipFacesLayer: flipFacesLayer,
		facesLayerToEdgesAssignments: facesLayerToEdgesAssignments,
		faceOrdersToMatrix: faceOrdersToMatrix
	});

	const topologicalOrder$1 = ({ faceOrders, faces_normal }, faces) => {
		if (!faceOrders) { return []; }
		const facesHash = {};
		faces.forEach(face => { facesHash[face] = true; });
		faces[0];
		const faces_normal_match = [];
		faces.map(face => {
			faces_normal_match[face] = math.core
				.dot(faces_normal[face], faces_normal[faces[0]]) > 0;
		});
		const facesBelow = [];
		faces.forEach(face => { facesBelow[face] = []; });
		faceOrders.forEach(order => {
			if (!facesHash[order[0]]) { return; }
			const pair = (order[2] === -1) ^ (!faces_normal_match[order[1]])
				? [order[1], order[0]]
				: [order[0], order[1]];
			facesBelow[pair[0]].push(pair[1]);
		});
		const layers_face = [];
		const faces_visited = {};
		const recurse = (face) => {
			faces_visited[face] = true;
			facesBelow[face].forEach(f => {
				if (faces_visited[f]) { return; }
				recurse(f);
			});
			layers_face.push(face);
		};
		faces.forEach(face => {
			if (faces_visited[face]) { return; }
			recurse(face);
		});
		return layers_face;
	};

	const nudgeFacesWithFacesLayer = ({ faces_layer }) => {
		const faces_nudge = [];
		const layers_face = invertMap(faces_layer);
		layers_face.forEach((face, layer) => {
			faces_nudge[face] = {
				vector: [0, 0, 1],
				layer,
			};
		});
		return faces_nudge;
	};
	const nudgeFacesWithFaceOrders = ({ vertices_coords, faces_vertices, faceOrders }) => {
		const faces_normal = makeFacesNormal({ vertices_coords, faces_vertices });
		const faces_sets = connectedComponents(makeVerticesVerticesUnsorted({
			edges_vertices: faceOrders.map(ord => [ord[0], ord[1]]),
		}));
		const sets_faces = invertMap(faces_sets)
			.map(el => (el.constructor === Array ? el : [el]));
		const sets_layers_face = sets_faces
			.map(faces => topologicalOrder$1({ faceOrders, faces_normal }, faces));
		const sets_normals = sets_faces.map(faces => faces_normal[faces[0]]);
		const faces_nudge = [];
		sets_layers_face.forEach((set, i) => set.forEach((face, index) => {
			faces_nudge[face] = {
				vector: sets_normals[i],
				layer: index,
			};
		}));
		return faces_nudge;
	};

	var nudge = /*#__PURE__*/Object.freeze({
		__proto__: null,
		nudgeFacesWithFacesLayer: nudgeFacesWithFacesLayer,
		nudgeFacesWithFaceOrders: nudgeFacesWithFaceOrders
	});

	const makeFoldedStripTacos = (folded_faces, is_circular, epsilon) => {
		const faces_center = folded_faces
			.map((ends) => (ends ? (ends[0] + ends[1]) / 2 : undefined));
		const locations = [];
		folded_faces.forEach((ends, i) => {
			if (!ends) { return; }
			if (!is_circular && i === folded_faces.length - 1) { return; }
			const fold_end = ends[1];
			const min = fold_end - (epsilon * 2);
			const max = fold_end + (epsilon * 2);
			const faces = [i, (i + 1) % folded_faces.length];
			const sides = faces
				.map(f => faces_center[f])
				.map(center => center > fold_end);
			const taco_type = (!sides[0] && !sides[1]) * 1 + (sides[0] && sides[1]) * 2;
			const match = locations
				.filter(el => el.min < fold_end && el.max > fold_end)
				.shift();
			const entry = { faces, taco_type };
			if (match) {
				match.pairs.push(entry);
			} else {
				locations.push({ min, max, pairs: [entry] });
			}
		});
		return locations
			.map(el => el.pairs)
			.filter(pairs => pairs.length > 1)
			.map(pairs => ({
				both: pairs.filter(el => el.taco_type === 0).map(el => el.faces),
				left: pairs.filter(el => el.taco_type === 1).map(el => el.faces),
				right: pairs.filter(el => el.taco_type === 2).map(el => el.faces),
			}));
	};

	const between = (arr, i, j) => (i < j
		? arr.slice(i + 1, j)
		: arr.slice(j + 1, i));
	const validateTacoTortillaStrip = (
		faces_folded,
		layers_face,
		is_circular = true,
		epsilon = math.core.EPSILON,
	) => {
		const faces_layer = invertMap(layers_face);
		const fold_location = faces_folded
			.map(ends => (ends ? ends[1] : undefined));
		const faces_mins = faces_folded
			.map(ends => (ends ? Math.min(...ends) : undefined))
			.map(n => n + epsilon);
		const faces_maxs = faces_folded
			.map(ends => (ends ? Math.max(...ends) : undefined))
			.map(n => n - epsilon);
		const max = faces_layer.length + (is_circular ? 0 : -1);
		for (let i = 0; i < max; i += 1) {
			const j = (i + 1) % faces_layer.length;
			if (faces_layer[i] === faces_layer[j]) { continue; }
			const layers_between = between(layers_face, faces_layer[i], faces_layer[j])
				.flat();
			const all_below_min = layers_between
				.map(index => fold_location[i] < faces_mins[index])
				.reduce((a, b) => a && b, true);
			const all_above_max = layers_between
				.map(index => fold_location[i] > faces_maxs[index])
				.reduce((a, b) => a && b, true);
			if (!all_below_min && !all_above_max) { return false; }
		}
		return true;
	};

	const validateTacoTacoFacePairs = (face_pair_stack) => {
		const pair_stack = nonUniqueElements(face_pair_stack);
		const pairs = {};
		let count = 0;
		for (let i = 0; i < pair_stack.length; i += 1) {
			if (pairs[pair_stack[i]] === undefined) {
				count += 1;
				pairs[pair_stack[i]] = count;
			} else if (pairs[pair_stack[i]] !== undefined) {
				if (pairs[pair_stack[i]] !== count) { return false; }
				count -= 1;
				pairs[pair_stack[i]] = undefined;
			}
		}
		return true;
	};

	const build_layers = (layers_face, faces_pair) => layers_face
		.map(f => faces_pair[f])
		.filter(a => a !== undefined);
	const validateLayerSolver = (
		faces_folded,
		layers_face,
		taco_face_pairs,
		circ_and_done,
		epsilon,
	) => {
		const flat_layers_face = math.core.flattenArrays(layers_face);
		if (!validateTacoTortillaStrip(
			faces_folded,
			layers_face,
			circ_and_done,
			epsilon,
		)) { return false; }
		for (let i = 0; i < taco_face_pairs.length; i += 1) {
			const pair_stack = build_layers(flat_layers_face, taco_face_pairs[i]);
			if (!validateTacoTacoFacePairs(pair_stack)) { return false; }
		}
		return true;
	};

	const change_map = {
		V: true, v: true, M: true, m: true,
	};
	const assignmentsToFacesFlip = (assignments) => {
		let counter = 0;
		const shifted_assignments = assignments.slice(1);
		return [false].concat(shifted_assignments
			.map(a => (change_map[a] ? ++counter : counter))
			.map(count => count % 2 === 1));
	};
	const up_down = {
		V: 1, v: 1, M: -1, m: -1,
	};
	const upOrDown = (mv, i) => (i % 2 === 0
		? (up_down[mv] || 0)
		: -(up_down[mv] || 0));
	const assignmentsToFacesVertical = (assignments) => {
		let iterator = 0;
		return assignments
			.slice(1)
			.concat([assignments[0]])
			.map(a => {
				const updown = upOrDown(a, iterator);
				iterator += up_down[a] === undefined ? 0 : 1;
				return updown;
			});
	};

	const foldStripWithAssignments = (faces, assignments) => {
		const faces_end = assignmentsToFacesFlip(assignments)
			.map((flip, i) => faces[i] * (flip ? -1 : 1));
		const cumulative = faces.map(() => undefined);
		cumulative[0] = [0, faces_end[0]];
		for (let i = 1; i < faces.length; i += 1) {
			if (assignments[i] === "B" || assignments[i] === "b") { break; }
			const prev = (i - 1 + faces.length) % faces.length;
			const prev_end = cumulative[prev][1];
			cumulative[i] = [prev_end, prev_end + faces_end[i]];
		}
		return cumulative;
	};

	const is_boundary = { B: true, b: true };
	const singleVertexSolver = (ordered_scalars, assignments, epsilon = math.core.EPSILON) => {
		const faces_folded = foldStripWithAssignments(ordered_scalars, assignments);
		const faces_updown = assignmentsToFacesVertical(assignments);
		const is_circular = assignments
			.map(a => !(is_boundary[a]))
			.reduce((a, b) => a && b, true);
		if (is_circular) {
			const start = faces_folded[0][0];
			const end = faces_folded[faces_folded.length - 1][1];
			if (Math.abs(start - end) > epsilon) { return []; }
		}
		const taco_face_pairs = makeFoldedStripTacos(faces_folded, is_circular, epsilon)
			.map(taco => [taco.left, taco.right]
				.map(invertMap)
				.filter(arr => arr.length > 1))
			.reduce((a, b) => a.concat(b), []);
		const recurse = (layers_face = [0], face = 0, layer = 0) => {
			const next_face = face + 1;
			const next_dir = faces_updown[face];
			const is_done = face >= ordered_scalars.length - 1;
			const circ_and_done = is_circular && is_done;
			if (!validateLayerSolver(
				faces_folded,
				layers_face,
				taco_face_pairs,
				circ_and_done,
				epsilon,
			)) {
				return [];
			}
			if (circ_and_done) {
				const faces_layer = invertMap(layers_face);
				const first_face_layer = faces_layer[0];
				const last_face_layer = faces_layer[face];
				if (next_dir > 0 && last_face_layer > first_face_layer) { return []; }
				if (next_dir < 0 && last_face_layer < first_face_layer) { return []; }
			}
			if (is_done) { return [layers_face]; }
			if (next_dir === 0) {
				layers_face[layer] = [next_face].concat(layers_face[layer]);
				return recurse(layers_face, next_face, layer);
			}
			const splice_layers = next_dir === 1
				? Array.from(Array(layers_face.length - layer))
					.map((_, i) => layer + i + 1)
				: Array.from(Array(layer + 1))
					.map((_, i) => i);
			const next_layers_faces = splice_layers.map(() => clone(layers_face));
			next_layers_faces
				.forEach((layers, i) => layers.splice(splice_layers[i], 0, next_face));
			return next_layers_faces
				.map((layers, i) => recurse(layers, next_face, splice_layers[i]))
				.reduce((a, b) => a.concat(b), []);
		};
		return recurse().map(invertMap);
	};

	const get_unassigned_indices = (edges_assignment) => edges_assignment
		.map((_, i) => i)
		.filter(i => edges_assignment[i] === "U" || edges_assignment[i] === "u");
	const maekawaAssignments = (vertices_edges_assignments) => {
		const unassigneds = get_unassigned_indices(vertices_edges_assignments);
		const permuts = Array.from(Array(2 ** unassigneds.length))
			.map((_, i) => i.toString(2))
			.map(l => Array(unassigneds.length - l.length + 1).join("0") + l)
			.map(str => Array.from(str).map(l => (l === "0" ? "V" : "M")));
		const all = permuts.map(perm => {
			const array = vertices_edges_assignments.slice();
			unassigneds.forEach((index, i) => { array[index] = perm[i]; });
			return array;
		});
		if (vertices_edges_assignments.includes("B")
			|| vertices_edges_assignments.includes("b")) {
			return all;
		}
		const count_m = all.map(a => a.filter(l => l === "M" || l === "m").length);
		const count_v = all.map(a => a.filter(l => l === "V" || l === "v").length);
		return all.filter((_, i) => Math.abs(count_m[i] - count_v[i]) === 2);
	};

	const assignmentSolver = (orderedScalars, assignments, epsilon) => {
		if (assignments == null) {
			assignments = orderedScalars.map(() => "U");
		}
		const all_assignments = maekawaAssignments(assignments);
		const layers = all_assignments
			.map(assigns => singleVertexSolver(orderedScalars, assigns, epsilon));
		return all_assignments
			.map((_, i) => i)
			.filter(i => layers[i].length > 0)
			.map(i => ({
				assignment: all_assignments[i],
				layer: layers[i],
			}));
	};

	const taco_taco_valid_states$1 = [
		"111112",
		"111121",
		"111222",
		"112111",
		"121112",
		"121222",
		"122111",
		"122212",
		"211121",
		"211222",
		"212111",
		"212221",
		"221222",
		"222111",
		"222212",
		"222221",
	];
	const taco_tortilla_valid_states$1 = ["112", "121", "212", "221"];
	const tortilla_tortilla_valid_states$1 = ["11", "22"];
	const transitivity_valid_states$1 = [
		"112",
		"121",
		"122",
		"211",
		"212",
		"221",
	];
	const check_state$1 = (states, t, key) => {
		const A = Array.from(key).map(char => parseInt(char, 10));
		if (A.filter(x => x === 0).length !== t) { return; }
		states[t][key] = false;
		let solution = false;
		for (let i = 0; i < A.length; i += 1) {
			const modifications = [];
			if (A[i] !== 0) { continue; }
			for (let x = 1; x <= 2; x += 1) {
				A[i] = x;
				if (states[t - 1][A.join("")] !== false) {
					modifications.push([i, x]);
				}
			}
			A[i] = 0;
			if (modifications.length > 0 && solution === false) {
				solution = [];
			}
			if (modifications.length === 1) {
				solution.push(modifications[0]);
			}
		}
		if (solution !== false && solution.length === 0) {
			solution = true;
		}
		states[t][key] = solution;
	};
	const make_lookup$1 = (valid_states) => {
		const choose_count = valid_states[0].length;
		const states = Array
			.from(Array(choose_count + 1))
			.map(() => ({}));
		Array.from(Array(Math.pow(2, choose_count)))
			.map((_, i) => i.toString(2))
			.map(str => Array.from(str).map(n => parseInt(n, 10) + 1).join(""))
			.map(str => (`11111${str}`).slice(-choose_count))
			.forEach(key => { states[0][key] = false; });
		valid_states.forEach(s => { states[0][s] = true; });
		Array.from(Array(choose_count))
			.map((_, i) => i + 1)
			.map(t => Array.from(Array(Math.pow(3, choose_count)))
				.map((_, i) => i.toString(3))
				.map(str => (`000000${str}`).slice(-choose_count))
				.forEach(key => check_state$1(states, t, key)));
		let outs = [];
		Array.from(Array(choose_count + 1))
			.map((_, i) => choose_count - i)
			.forEach(t => {
				const A = [];
				Object.keys(states[t]).forEach(key => {
					let out = states[t][key];
					if (out.constructor === Array) { out = out[0]; }
					A.push([key, out]);
				});
				outs = outs.concat(A);
			});
		outs.sort((a, b) => parseInt(a[0], 10) - parseInt(b[0], 10));
		const lookup = {};
		outs.forEach(el => { lookup[el[0]] = Object.freeze(el[1]); });
		return Object.freeze(lookup);
	};
	const layerTable$1 = {
		taco_taco: make_lookup$1(taco_taco_valid_states$1),
		taco_tortilla: make_lookup$1(taco_tortilla_valid_states$1),
		tortilla_tortilla: make_lookup$1(tortilla_tortilla_valid_states$1),
		transitivity: make_lookup$1(transitivity_valid_states$1),
	};

	const constraintToFacePairs$1 = ({
		taco_taco: f => [
			[f[0], f[2]],
			[f[1], f[3]],
			[f[1], f[2]],
			[f[0], f[3]],
			[f[0], f[1]],
			[f[2], f[3]],
		],
		taco_tortilla: f => [[f[0], f[2]], [f[0], f[1]], [f[1], f[2]]],
		tortilla_tortilla: f => [[f[0], f[2]], [f[1], f[3]]],
		transitivity: f => [[f[0], f[1]], [f[1], f[2]], [f[2], f[0]]],
	});
	const pairArrayToSortedPairString$1 = pair => (pair[0] < pair[1]
		? `${pair[0]} ${pair[1]}`
		: `${pair[1]} ${pair[0]}`);
	const constraintToFacePairsStrings$1 = ({
		taco_taco: f => [
			pairArrayToSortedPairString$1([f[0], f[2]]),
			pairArrayToSortedPairString$1([f[1], f[3]]),
			pairArrayToSortedPairString$1([f[1], f[2]]),
			pairArrayToSortedPairString$1([f[0], f[3]]),
			pairArrayToSortedPairString$1([f[0], f[1]]),
			pairArrayToSortedPairString$1([f[2], f[3]]),
		],
		taco_tortilla: f => [
			pairArrayToSortedPairString$1([f[0], f[2]]),
			pairArrayToSortedPairString$1([f[0], f[1]]),
			pairArrayToSortedPairString$1([f[1], f[2]]),
		],
		tortilla_tortilla: f => [
			pairArrayToSortedPairString$1([f[0], f[2]]),
			pairArrayToSortedPairString$1([f[1], f[3]]),
		],
		transitivity: f => [
			pairArrayToSortedPairString$1([f[0], f[1]]),
			pairArrayToSortedPairString$1([f[1], f[2]]),
			pairArrayToSortedPairString$1([f[2], f[0]]),
		],
	});
	const to_signed_layer_convert$1 = { 0: 0, 1: 1, 2: -1 };
	const keysToFaceOrders$1 = (facePairs, faces_aligned) => {
		const keys = Object.keys(facePairs);
		const faceOrders = keys.map(string => string
			.split(" ")
			.map(n => parseInt(n, 10)));
		faceOrders.forEach((faces, i) => {
			const value = to_signed_layer_convert$1[facePairs[keys[i]]];
			const side = (((value === 1) ^ (faces_aligned[faces[1]])) * -2) + 1;
			faces.push(side);
		});
		return faceOrders;
	};
	const reformatSolution = (solution, faces_winding) => {
		if (solution.orders) {
			solution.orders = solution.orders
				.flatMap(order => keysToFaceOrders$1(order, faces_winding));
		}
		if (solution.leaves) {
			solution.leaves = solution.leaves
				.map(order => keysToFaceOrders$1(order, faces_winding));
		}
		if (solution.partitions) {
			solution.partitions
				.forEach(child => reformatSolution(child, faces_winding));
		}
		if (solution.node) {
			solution.node
				.forEach(child => reformatSolution(child, faces_winding));
		}
		return solution;
	};

	const taco_types$1 = Object.freeze(Object.keys(layerTable$1));
	const flipFacePairOrder$1 = { 0: 0, 1: 2, 2: 1 };
	const buildRuleAndLookup$1 = (type, constraint, ...orders) => {
		const facePairsArray = constraintToFacePairs$1[type](constraint);
		const flipped = facePairsArray.map(pair => pair[1] < pair[0]);
		const facePairs = facePairsArray.map((pair, i) => (flipped[i]
			? `${pair[1]} ${pair[0]}`
			: `${pair[0]} ${pair[1]}`));
		const key = facePairs.map((facePair, i) => {
			for (let o = 0; o < orders.length; o += 1) {
				if (orders[o][facePair]) {
					return flipped[i]
						? flipFacePairOrder$1[orders[o][facePair]]
						: orders[o][facePair];
				}
			}
			return 0;
		}).join("");
		if (layerTable$1[type][key] === true) { return true; }
		if (layerTable$1[type][key] === false) { return false; }
		const implication = layerTable$1[type][key];
		const implicationFacePair = facePairs[implication[0]];
		const implicationOrder = flipped[implication[0]]
			? flipFacePairOrder$1[implication[1]]
			: implication[1];
		return [implicationFacePair, implicationOrder];
	};
	const getConstraintIndicesFromFacePairs$1 = (
		constraints,
		constraintsLookup,
		facePairsSubsetArray,
	) => {
		const constraintIndices = {};
		taco_types$1.forEach(type => {
			const constraintIndicesWithDups = facePairsSubsetArray
				.flatMap(facePair => constraintsLookup[type][facePair]);
			constraintIndices[type] = uniqueElements(constraintIndicesWithDups)
				.filter(i => constraints[type][i]);
		});
		return constraintIndices;
	};
	const propagate$1 = (
		constraints,
		constraintsLookup,
		initiallyModifiedFacePairs,
		...orders
	) => {
		let modifiedFacePairs = initiallyModifiedFacePairs;
		const newOrders = {};
		do {
			const modifiedConstraintIndices = getConstraintIndicesFromFacePairs$1(
				constraints,
				constraintsLookup,
				modifiedFacePairs,
			);
			const roundModificationsFacePairs = {};
			for (let t = 0; t < taco_types$1.length; t += 1) {
				const type = taco_types$1[t];
				const indices = modifiedConstraintIndices[type];
				for (let i = 0; i < indices.length; i += 1) {
					const lookupResult = buildRuleAndLookup$1(
						type,
						constraints[type][indices[i]],
						...orders,
						newOrders,
					);
					if (lookupResult === true) { continue; }
					if (lookupResult === false) {
						console.warn("invalid state found", type, constraints[type][indices[i]]);
						return false;
					}
					if (newOrders[lookupResult[0]]) {
						if (newOrders[lookupResult[0]] !== lookupResult[1]) {
							console.warn("order conflict", type, constraints[type][indices[i]]);
							return false;
						}
					} else {
						const [key, value] = lookupResult;
						roundModificationsFacePairs[key] = true;
						newOrders[lookupResult[0]] = value;
					}
				}
			}
			modifiedFacePairs = Object.keys(roundModificationsFacePairs);
		} while (modifiedFacePairs.length);
		return newOrders;
	};

	const getNeighborsArray = (key, constraints, constraintsLookup) => {
		const neighborsHash = {};
		Object.keys(constraints).forEach(type => {
			const indices = constraintsLookup[type][key];
			if (!indices) { return; }
			indices
				.map(c => constraints[type][c])
				.map(faces => constraintToFacePairsStrings$1[type](faces)
					.forEach(facePair => { neighborsHash[facePair] = true; }));
		});
		return Object.keys(neighborsHash);
	};
	const getDisjointSets = (
		remainingKeys,
		constraints,
		constraintsLookup,
		constraintsNeighborsMemo = {},
	) => {
		const keys = {};
		remainingKeys.forEach(key => { keys[key] = true; });
		let i = 0;
		const groups = [];
		while (i < remainingKeys.length) {
			if (!keys[remainingKeys[i]]) { i += 1; continue; }
			const group = [];
			const stack = [remainingKeys[i]];
			const stackHash = { [remainingKeys[i]]: true };
			do {
				const key = stack.shift();
				delete keys[key];
				group.push(key);
				const neighborsArray = constraintsNeighborsMemo[key]
					? constraintsNeighborsMemo[key]
					: getNeighborsArray(key, constraints, constraintsLookup);
				constraintsNeighborsMemo[key] = neighborsArray;
				const neighbors = neighborsArray
					.filter(facePair => keys[facePair] && !stackHash[facePair]);
				stack.push(...neighbors);
				neighbors.forEach(facePair => { stackHash[facePair] = true; });
			} while (stack.length);
			i += 1;
			groups.push(group);
		}
		return groups;
	};

	const makeTortillasFacesCrossing$1 = (graph, edges_faces_side, epsilon) => {
		const faces_winding = makeFacesWinding(graph);
		const faces_polygon = makeFacesPolygon(graph, epsilon);
		faces_winding.forEach((winding, i) => {
			if (!winding) {
				faces_polygon[i].reverse();
			}
		});
		const tortilla_edge_indices = edges_faces_side
			.map(side => side.length === 2 && side[0] !== side[1])
			.map((bool, i) => (bool ? i : undefined))
			.filter(a => a !== undefined);
		const edges_coords = tortilla_edge_indices
			.map(e => graph.edges_vertices[e])
			.map(edge => edge
				.map(vertex => graph.vertices_coords[vertex]));
		const edges_vector = edges_coords
			.map(coords => math.core.subtract2(coords[1], coords[0]));
		const matrix = [];
		tortilla_edge_indices.forEach(e => { matrix[e] = []; });
		const result = tortilla_edge_indices
			.map((e, ei) => faces_polygon
				.map(poly => math.core.clipLineConvexPolygon(
					poly,
					edges_vector[ei],
					edges_coords[ei][0],
					math.core.exclude,
					math.core.excludeS,
					epsilon,
				))
				.map(res => res !== undefined));
		result.forEach((faces, ei) => faces
			.forEach((overlap, f) => {
				if (overlap) {
					matrix[tortilla_edge_indices[ei]].push(f);
				}
			}));
		return matrix;
	};
	const makeTortillaTortillaFacesCrossing$1 = (graph, edges_faces_side, epsilon) => {
		const tortillas_faces_crossing = makeTortillasFacesCrossing$1(graph, edges_faces_side, epsilon);
		const tortilla_faces_results = tortillas_faces_crossing
			.map((faces, e) => faces.map(face => [graph.edges_faces[e], [face, face]]))
			.reduce((a, b) => a.concat(b), []);
		return tortilla_faces_results;
	};

	const makeEdgesFacesSide$1 = (graph) => {
		const edges_origin = graph.edges_vertices
			.map(vertices => graph.vertices_coords[vertices[0]]);
		const edges_vector = graph.edges_vertices
			.map(vertices => math.core.subtract2(
				graph.vertices_coords[vertices[1]],
				graph.vertices_coords[vertices[0]],
			));
		return graph.edges_faces
			.map((faces, i) => faces
				.map(face => math.core.cross2(
					math.core.subtract2(
						graph.faces_center[face],
						edges_origin[i],
					),
					edges_vector[i],
				))
				.map(cross => Math.sign(cross)));
	};
	const makeTacosFacesSide$1 = (graph, tacos_edges, tacos_faces) => {
		const tacos_edge_coords = tacos_edges
			.map(edges => graph.edges_vertices[edges[0]]
				.map(vertex => graph.vertices_coords[vertex]));
		const tacos_edge_origin = tacos_edge_coords
			.map(coords => coords[0]);
		const tacos_edge_vector = tacos_edge_coords
			.map(coords => math.core.subtract2(coords[1], coords[0]));
		const tacos_faces_center = tacos_faces
			.map(faces => faces
				.map(face_pair => face_pair
					.map(face => graph.faces_center[face])));
		return tacos_faces_center
			.map((faces, i) => faces
				.map(pairs => pairs
					.map(center => math.core.cross2(
						math.core.subtract2(
							center,
							tacos_edge_origin[i],
						),
						tacos_edge_vector[i],
					))
					.map(cross => Math.sign(cross))));
	};

	const classify_faces_pair$1 = (pair) => {
		if ((pair[0] === 1 && pair[1] === -1)
			|| (pair[0] === -1 && pair[1] === 1)) {
			return "both";
		}
		if ((pair[0] === 1 && pair[1] === 1)) { return "right"; }
		if ((pair[0] === -1 && pair[1] === -1)) { return "left"; }
		return undefined;
	};
	const is_taco_taco$1 = (classes) => classes[0] === classes[1]
		&& classes[0] !== "both";
	const is_tortilla_tortilla$1 = (classes) => classes[0] === classes[1]
		&& classes[0] === "both";
	const is_taco_tortilla$1 = (classes) => classes[0] !== classes[1]
		&& (classes[0] === "both" || classes[1] === "both");
	const make_taco_tortilla$1 = (face_pairs, types, faces_side) => {
		const direction = types[0] === "left" || types[1] === "left" ? -1 : 1;
		const taco = types[0] === "both" ? [...face_pairs[1]] : [...face_pairs[0]];
		const index = types[0] === "both" ? 0 : 1;
		const tortilla = faces_side[index][0] === direction
			? face_pairs[index][0]
			: face_pairs[index][1];
		return { taco, tortilla };
	};
	const make_tortilla_tortilla$1 = (face_pairs, tortillas_sides) => {
		if (face_pairs === undefined) { return undefined; }
		return (tortillas_sides[0][0] === tortillas_sides[1][0])
			? face_pairs
			: [face_pairs[0], [face_pairs[1][1], face_pairs[1][0]]];
	};
	const makeTacosTortillas$1 = (graph, epsilon = math.core.EPSILON) => {
		const edges_faces_side = makeEdgesFacesSide$1(graph);
		const edges_edgesParallelOverlap = makeEdgesEdgesParallelOverlap(graph, epsilon);
		const tacos_edges = selfRelationalUniqueIndexPairs(edges_edgesParallelOverlap)
			.filter(pair => pair
				.map(edge => graph.edges_faces[edge].length > 1)
				.reduce((a, b) => a && b, true));
		const tacos_faces = tacos_edges
			.map(pair => pair
				.map(edge => graph.edges_faces[edge]));
		const tacos_faces_side = makeTacosFacesSide$1(graph, tacos_edges, tacos_faces);
		const tacos_types = tacos_faces_side
			.map(faces => faces
				.map(classify_faces_pair$1));
		const taco_taco = tacos_types
			.map((pair, i) => (is_taco_taco$1(pair) ? tacos_faces[i] : undefined))
			.filter(a => a !== undefined);
		const tortilla_tortilla_aligned = tacos_types
			.map((pair, i) => (is_tortilla_tortilla$1(pair) ? tacos_faces[i] : undefined))
			.map((pair, i) => make_tortilla_tortilla$1(pair, tacos_faces_side[i]))
			.filter(a => a !== undefined);
		const tortilla_tortilla_crossing = makeTortillaTortillaFacesCrossing$1(
			graph,
			edges_faces_side,
			epsilon,
		);
		const tortilla_tortilla = tortilla_tortilla_aligned
			.concat(tortilla_tortilla_crossing);
		const taco_tortilla_aligned = tacos_types
			.map((pair, i) => (is_taco_tortilla$1(pair)
				? make_taco_tortilla$1(tacos_faces[i], tacos_types[i], tacos_faces_side[i])
				: undefined))
			.filter(a => a !== undefined);
		const edges_faces_overlap = makeEdgesFacesOverlap(graph, epsilon);
		const edges_overlap_faces = booleanMatrixToIndexedArray(edges_faces_overlap)
			.map((faces, e) => (edges_faces_side[e].length > 1
				&& edges_faces_side[e][0] === edges_faces_side[e][1]
				? faces
				: []));
		const taco_tortillas_crossing = edges_overlap_faces
			.map((tortillas, edge) => ({ taco: graph.edges_faces[edge], tortillas }))
			.filter(el => el.tortillas.length);
		const taco_tortilla_crossing = taco_tortillas_crossing
			.flatMap(el => el.tortillas
				.map(tortilla => ({ taco: [...el.taco], tortilla })));
		const taco_tortilla = taco_tortilla_aligned.concat(taco_tortilla_crossing);
		return {
			taco_taco,
			tortilla_tortilla,
			taco_tortilla,
		};
	};

	const makeTransitivityTrios$1 = (
		graph,
		faces_facesOverlap,
		faces_winding,
		epsilon = math.core.EPSILON,
	) => {
		const polygons = makeFacesPolygon(graph, epsilon);
		polygons.forEach((face, i) => {
			if (!faces_winding[i]) { face.reverse(); }
		});
		const matrix = graph.faces_vertices.map(() => []);
		polygons.forEach((_, f1) => faces_facesOverlap[f1].forEach(f2 => {
			if (f2 <= f1) { return; }
			const polygon = math.core
				.clipPolygonPolygon(polygons[f1], polygons[f2], epsilon);
			if (polygon) { matrix[f1][f2] = polygon; }
		}));
		const trios = [];
		matrix.forEach((row, i) => row.forEach((poly, j) => {
			if (j <= i || !matrix[i][j]) { return; }
			matrix.forEach((_, k) => {
				if (k <= i || k <= j) { return; }
				const polygon = math.core.clipPolygonPolygon(poly, polygons[k], epsilon);
				if (polygon) { trios.push([i, j, k].sort((a, b) => a - b)); }
			});
		}));
		return trios;
	};

	const filterTransitivity$1 = (transitivity_trios, tacos_tortillas) => {
		const tacos_trios = {};
		tacos_tortillas.taco_taco
			.map(tacos => [tacos[0][0], tacos[0][1], tacos[1][0], tacos[1][1]]
				.sort((a, b) => a - b))
			.forEach(taco => [
				`${taco[0]} ${taco[1]} ${taco[2]}`,
				`${taco[0]} ${taco[1]} ${taco[3]}`,
				`${taco[0]} ${taco[2]} ${taco[3]}`,
				`${taco[1]} ${taco[2]} ${taco[3]}`,
			].forEach(key => { tacos_trios[key] = true; }));
		tacos_tortillas.taco_tortilla
			.map(el => [el.taco[0], el.taco[1], el.tortilla]
				.sort((a, b) => a - b).join(" "))
			.forEach(key => { tacos_trios[key] = true; });
		return transitivity_trios
			.filter(trio => tacos_trios[trio.join(" ")] === undefined);
	};

	const makeConstraints$1 = (tacos_tortillas, transitivity_trios) => {
		const constraints = {};
		constraints.taco_taco = tacos_tortillas.taco_taco.map(el => [
			el[0][0], el[1][0], el[0][1], el[1][1],
		]);
		constraints.taco_tortilla = tacos_tortillas.taco_tortilla.map(el => [
			el.taco[0], el.tortilla, el.taco[1],
		]);
		constraints.tortilla_tortilla = tacos_tortillas.tortilla_tortilla.map(el => [
			el[0][0], el[0][1], el[1][0], el[1][1],
		]);
		constraints.transitivity = transitivity_trios.map(el => [
			el[0], el[1], el[2],
		]);
		return constraints;
	};
	const makeConstraintsLookup$1 = (constraints) => {
		const lookup = {};
		Object.keys(constraints).forEach(key => { lookup[key] = {}; });
		Object.keys(constraints).forEach(type => {
			constraints[type]
				.forEach((constraint, i) => constraintToFacePairsStrings$1[type](constraint)
					.forEach(key => {
						if (lookup[type][key] === undefined) {
							lookup[type][key] = [];
						}
						lookup[type][key].push(i);
					}));
		});
		return lookup;
	};

	const make_conditions_flip_condition$1 = { 0: 0, 1: 2, 2: 1 };
	const make_conditions_assignment_direction$1 = {
		M: 1, m: 1, V: 2, v: 2,
	};
	const solveEdgeAdjacentFacePairs$1 = (graph, facePairs, faces_winding) => {
		const facePairsHash = {};
		facePairs.forEach(key => { facePairsHash[key] = true; });
		const solution = {};
		graph.edges_faces.forEach((faces, edge) => {
			const assignment = graph.edges_assignment[edge];
			const local_order = make_conditions_assignment_direction$1[assignment];
			if (faces.length < 2 || local_order === undefined) { return; }
			const upright = faces_winding[faces[0]];
			const global_order = upright
				? local_order
				: make_conditions_flip_condition$1[local_order];
			const key1 = `${faces[0]} ${faces[1]}`;
			const key2 = `${faces[1]} ${faces[0]}`;
			if (key1 in facePairsHash) { solution[key1] = global_order; }
			if (key2 in facePairsHash) {
				solution[key2] = make_conditions_flip_condition$1[global_order];
			}
		});
		return solution;
	};

	const rangesOverlapExclusive = (a, b, epsilon = 1e-6) => {
		const r1 = a[0] < a[1] ? a : [a[1], a[0]];
		const r2 = b[0] < b[1] ? b : [b[1], b[0]];
		const overlap = Math.min(r1[1], r2[1]) - Math.max(r1[0], r2[0]);
		return overlap > epsilon;
	};
	const doEdgesOverlap = (graph, edgePair, vector, epsilon = 1e-6) => {
		const pairCoords = edgePair
			.map(edge => graph.edges_vertices[edge]
				.map(v => graph.vertices_coords[v]));
		const pairCoordsDots = pairCoords
			.map(edge => edge
				.map(coord => math.core.dot(coord, vector)));
		const result = rangesOverlapExclusive(...pairCoordsDots, epsilon);
		return result;
	};
	const make3DTortillaEdges = (graph, overlapInfo, epsilon = 1e-6) => {
		const edges_groups_lookup = graph.edges_vertices.map(() => ({}));
		overlapInfo.faces_set
			.forEach((set, face) => graph.faces_edges[face]
				.forEach(edge => { edges_groups_lookup[edge][set] = true; }));
		const edges_groups = edges_groups_lookup
			.map(o => Object.keys(o)
				.map(n => parseInt(n, 10)));
		edges_groups.forEach((arr, i) => {
			if (arr.length !== 2) { delete edges_groups[i]; }
		});
		edges_groups.forEach((arr, i) => {
			if (arr[0] > arr[1]) { edges_groups[i].reverse(); }
		});
		const edges_groups_keys = edges_groups.map(arr => arr.join(" "));
		const intersectingGroups_edges = {};
		edges_groups_keys.forEach((key, i) => {
			if (intersectingGroups_edges[key] === undefined) {
				intersectingGroups_edges[key] = [];
			}
			intersectingGroups_edges[key].push(i);
		});
		Object.keys(intersectingGroups_edges)
			.filter(key => intersectingGroups_edges[key].length < 2)
			.forEach(key => delete intersectingGroups_edges[key]);
		const intersectingGroups_pairsAll = {};
		Object.keys(intersectingGroups_edges).forEach(key => {
			intersectingGroups_pairsAll[key] = chooseTwoPairs(intersectingGroups_edges[key]);
		});
		const intersectingGroups_pairsValid = {};
		Object.keys(intersectingGroups_pairsAll).forEach(key => {
			const firstEdge = intersectingGroups_pairsAll[key][0][0];
			const coords = graph.edges_vertices[firstEdge]
				.map(v => graph.vertices_coords[v]);
			const vector = math.core.normalize(math.core.subtract(coords[1], coords[0]));
			intersectingGroups_pairsValid[key] = intersectingGroups_pairsAll[key]
				.map(pair => doEdgesOverlap(graph, pair, vector, epsilon));
		});
		const intersectingGroups_pairs = {};
		Object.keys(intersectingGroups_pairsAll).forEach(key => {
			intersectingGroups_pairs[key] = intersectingGroups_pairsAll[key]
				.filter((_, i) => intersectingGroups_pairsValid[key][i]);
		});
		return Object.keys(intersectingGroups_pairs)
			.flatMap(key => intersectingGroups_pairs[key]);
	};
	const make3DTortillas = (graph, overlapInfo, epsilon = 1e-6) => {
		const tortilla_edges = make3DTortillaEdges(graph, overlapInfo, epsilon);
		const tortilla_faces = tortilla_edges
			.map(pair => pair
				.map(edge => graph.edges_faces[edge]));
		tortilla_faces.forEach((tacos, i) => {
			if (overlapInfo.faces_set[tacos[0][0]] !== overlapInfo.faces_set[tacos[1][0]]) {
				tortilla_faces[i][1].reverse();
			}
		});
		return tortilla_faces;
	};

	const graphGroupCopies = (graph, overlapInfo, groups_faces) => {
		const copies = overlapInfo.sets_transformXY.map(() => ({ ...graph }));
		filterKeysWithPrefix(graph, "vertices")
			.forEach(key => copies.forEach(obj => delete obj[key]));
		copies.forEach(obj => delete obj.edges_edges);
		copies.forEach(obj => delete obj.edges_faces);
		const faceKeys = filterKeysWithPrefix(graph, "faces");
		copies.forEach((obj, i) => faceKeys.forEach(key => {
			obj[key] = [];
			groups_faces[i].forEach(f => { obj[key][f] = graph[key][f]; });
		}));
		const vertices_coords_3d = graph.vertices_coords
			.map(coord => math.core.resize(3, coord));
		const groups_vertices_hash = groups_faces.map(() => ({}));
		groups_faces
			.forEach((faces, i) => faces
				.forEach(face => graph.faces_vertices[face]
					.forEach(v => { groups_vertices_hash[i][v] = true; })));
		const groups_vertices = groups_vertices_hash
			.map(obj => Object.keys(obj).map(n => parseInt(n, 10)));
		copies.forEach(obj => { obj.vertices_coords = []; });
		overlapInfo.sets_transformXY
			.forEach((transform, i) => groups_vertices[i]
				.forEach(v => {
					const res = math.core.multiplyMatrix4Vector3(transform, vertices_coords_3d[v]);
					copies[i].vertices_coords[v] = [res[0], res[1]];
				}));
		const groups_edges_hash = groups_faces.map(() => ({}));
		groups_faces
			.forEach((faces, i) => faces
				.forEach(face => graph.faces_edges[face]
					.forEach(e => { groups_edges_hash[i][e] = true; })));
		const groups_edges = groups_edges_hash
			.map(obj => Object.keys(obj).map(n => parseInt(n, 10)));
		const edgeKeys = filterKeysWithPrefix(graph, "edges");
		copies.forEach((obj, i) => edgeKeys.forEach(key => {
			obj[key] = [];
			groups_edges[i].forEach(e => { obj[key][e] = graph[key][e]; });
		}));
		copies.forEach(obj => { obj.edges_faces = makeEdgesFacesUnsorted(obj); });
		return copies;
	};
	const prepare$1 = (graphInput, epsilon = 1e-6) => {
		const graph = { ...graphInput };
		if (!graph.faces_edges) {
			graph.faces_edges = makeFacesEdgesFromVertices(graph);
		}
		const overlapInfo = coplanarOverlappingFacesGroups(graph, epsilon);
		const groups_faces = invertMap(overlapInfo.faces_set)
			.map(el => (el.constructor === Array ? el : [el]));
		const graphCopies = graphGroupCopies(graph, overlapInfo, groups_faces);
		const faces_polygon = [];
		groups_faces
			.map((faces, g) => faces
				.map(face => graph.faces_vertices[face])
				.map(vertices => vertices.map(v => graphCopies[g].vertices_coords[v]))
				.forEach((polygon, f) => { faces_polygon[faces[f]] = polygon; }));
		const faces_center = faces_polygon
			.map(polygon => polygon
				.reduce((a, b) => math.core.add(a, b), [0, 0])
				.map(el => el / polygon.length));
		graphCopies.forEach(el => {
			el.faces_center = el.faces_vertices.map((_, i) => faces_center[i]);
		});
		const groups_tacos_tortillas = graphCopies
			.map(el => makeTacosTortillas$1(el, epsilon));
		const groups_unfiltered_trios = graphCopies
			.map(el => makeTransitivityTrios$1(
				el,
				overlapInfo.faces_facesOverlap,
				overlapInfo.faces_winding,
				epsilon,
			));
		const groups_transitivity_trios = groups_unfiltered_trios
			.map((trios, i) => filterTransitivity$1(trios, groups_tacos_tortillas[i]));
		const groups_constraints = groups_tacos_tortillas
			.map((tacos_tortillas, i) => makeConstraints$1(
				tacos_tortillas,
				groups_transitivity_trios[i],
			));
		const facePairsInts = selfRelationalUniqueIndexPairs(overlapInfo.faces_facesOverlap);
		const facePairs = facePairsInts.map(pair => pair.join(" "));
		const facePairsIndex_group = facePairsInts
			.map(pair => overlapInfo.faces_set[pair[0]]);
		const groups_facePairsIndex = invertMap(facePairsIndex_group)
			.map(el => (el.constructor === Array ? el : [el]));
		const groups_facePairsWithHoles = groups_facePairsIndex
			.map(indices => indices.map(i => facePairs[i]));
		const groups_facePairs = groups_constraints
			.map((_, i) => (groups_facePairsWithHoles[i] ? groups_facePairsWithHoles[i] : []));
		if (!graph.edges_faces) {
			graph.edges_faces = makeEdgesFacesUnsorted(graph);
		}
		const constraints = {
			taco_taco: [],
			taco_tortilla: [],
			tortilla_tortilla: [],
			transitivity: [],
		};
		groups_constraints.forEach(group => {
			constraints.taco_taco.push(...group.taco_taco);
			constraints.taco_tortilla.push(...group.taco_tortilla);
			constraints.tortilla_tortilla.push(...group.tortilla_tortilla);
			constraints.transitivity.push(...group.transitivity);
		});
		const tortillas3D = make3DTortillas(graph, overlapInfo, epsilon).map(el => [
			...el[0], ...el[1],
		]);
		constraints.tortilla_tortilla.push(...tortillas3D);
		const constraintsLookup = makeConstraintsLookup$1(constraints);
		const facePairsFlat = groups_facePairs.flat();
		const edgeAdjacentOrders = solveEdgeAdjacentFacePairs$1(graph, facePairs, overlapInfo.faces_winding);
		return {
			constraints,
			constraintsLookup,
			facePairs: facePairsFlat,
			edgeAdjacentOrders,
			faces_winding: overlapInfo.faces_winding,
		};
	};

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
	const allSolutions = (n, ...orders) => {
		const ordersSoFar = n.orders ? [...orders, n.orders] : [...orders];
		if (n.partitions) {
			const parts = n.partitions.map(el => allSolutions(el));
			const combinations = matchHolistic(parts);
			return combinations
				.map(indices => indices.flatMap((i, j) => parts[j][i]))
				.map(solution => [...ordersSoFar, ...solution]);
		}
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
	const anySolution = (n) => {
		const nodeOrders = n.orders ? n.orders : [];
		if (n.partitions) {
			return [...nodeOrders, ...n.partitions.flatMap(el => anySolution(el))];
		}
		if (n.leaves) { return [...nodeOrders, ...n.leaves[0]]; }
		if (n.node) { return [...nodeOrders, ...anySolution(n.node[0])]; }
		return nodeOrders;
	};
	const LayerPrototype$1 = {
		anySolution: function () { return anySolution(this); },
		allSolutions: function () {
			if (!this.allSolutionsMemo) {
				this.allSolutionsMemo = allSolutions(this);
			}
			return this.allSolutionsMemo;
		},
		count: function () { return this.allSolutions().length; },
	};

	const solveNonBranchingNode = (
		constraints,
		constraintsLookup,
		unsolvedKeys,
		solvedOrders,
		...orders
	) => {
		if (!unsolvedKeys.length) { return {}; }
		const guessKey = unsolvedKeys[0];
		const completedSolutions = [];
		const unfinishedSolutions = [];
		[1, 2].forEach(b => {
			const result = propagate$1(
				constraints,
				constraintsLookup,
				[guessKey],
				...solvedOrders,
				...orders,
				{ [guessKey]: b },
			);
			if (result === false) { return; }
			result[guessKey] = b;
			const array = Object.keys(result).length === unsolvedKeys.length
				? completedSolutions
				: unfinishedSolutions;
			array.push(result);
		});
		const solution = {
			leaves: completedSolutions,
			node: unfinishedSolutions.map(order => solveNode(
				constraints,
				constraintsLookup,
				unsolvedKeys.filter(key => !(key in order)),
				[...solvedOrders, ...orders],
				order,
			)),
		};
		if (solution.leaves.length === 0) { delete solution.leaves; }
		if (solution.node.length === 0) { delete solution.node; }
		return solution;
	};
	const solveNode = (
		constraints,
		constraintsLookup,
		remainingKeys,
		solvedOrders,
		...orders
	) => {
		if (!remainingKeys.length) { return { orders }; }
		const disjointSets = getDisjointSets(
			remainingKeys,
			constraints,
			constraintsLookup,
		);
		if (disjointSets.length > 1) {
			return {
				orders,
				partitions: disjointSets
					.map(branchKeys => solveNonBranchingNode(
						constraints,
						constraintsLookup,
						branchKeys,
						solvedOrders,
						...orders,
					)),
			};
		}
		return {
			orders,
			...solveNonBranchingNode(
				constraints,
				constraintsLookup,
				disjointSets[0],
				solvedOrders,
				...orders,
			),
		};
	};
	const groupLayerSolver = (
		constraints,
		constraintsLookup,
		facePairs,
		edgeAdjacentOrders,
		faces_winding,
	) => {
		const initialResult = propagate$1(
			constraints,
			constraintsLookup,
			Object.keys(edgeAdjacentOrders),
			edgeAdjacentOrders,
		);
		if (!initialResult) { return undefined; }
		const remainingKeys = facePairs
			.filter(key => !(key in edgeAdjacentOrders))
			.filter(key => !(key in initialResult));
		const solution = solveNode(
			constraints,
			constraintsLookup,
			remainingKeys,
			[],
			edgeAdjacentOrders,
			initialResult,
		);
		return reformatSolution(solution, faces_winding);
	};
	const globalLayerSolver$1 = (graph, epsilon = 1e-6) => {
		const {
			constraints,
			constraintsLookup,
			facePairs,
			edgeAdjacentOrders,
			faces_winding,
		} = prepare$1(graph, epsilon);
		const solution = groupLayerSolver(
			constraints,
			constraintsLookup,
			facePairs,
			edgeAdjacentOrders,
			faces_winding,
		);
		return Object.assign(
			Object.create(LayerPrototype$1),
			solution,
		);
	};

	const topologicalOrder = (facePairOrders, graph) => {
		if (!facePairOrders) { return []; }
		const faces_children = [];
		Object.keys(facePairOrders).forEach(key => {
			const pair = key.split(" ").map(n => parseInt(n, 10));
			if (facePairOrders[key] === -1) { pair.reverse(); }
			if (faces_children[pair[0]] === undefined) {
				faces_children[pair[0]] = [];
			}
			faces_children[pair[0]].push(pair[1]);
		});
		if (graph && graph.faces_vertices) {
			graph.faces_vertices.forEach((_, f) => {
				if (faces_children[f] === undefined) {
					faces_children[f] = [];
				}
			});
		}
		const layers_face = [];
		const faces_visited = [];
		let protection = 0;
		for (let f = 0; f < faces_children.length; f += 1) {
			if (faces_visited[f]) { continue; }
			const stack = [f];
			while (stack.length && protection < faces_children.length * 2) {
				const stack_end = stack[stack.length - 1];
				if (faces_children[stack_end] && faces_children[stack_end].length) {
					const next = faces_children[stack_end].pop();
					if (!faces_visited[next]) { stack.push(next); }
					continue;
				} else {
					layers_face.push(stack_end);
					faces_visited[stack_end] = true;
					stack.pop();
				}
				protection += 1;
			}
		}
		if (protection >= faces_children.length * 2) {
			console.warn("fix protection in topological order");
		}
		return layers_face;
	};

	const taco_taco_valid_states = [
		"111112",
		"111121",
		"111222",
		"112111",
		"121112",
		"121222",
		"122111",
		"122212",
		"211121",
		"211222",
		"212111",
		"212221",
		"221222",
		"222111",
		"222212",
		"222221",
	];
	const taco_tortilla_valid_states = ["112", "121", "212", "221"];
	const tortilla_tortilla_valid_states = ["11", "22"];
	const transitivity_valid_states = [
		"112",
		"121",
		"122",
		"211",
		"212",
		"221",
	];
	const check_state = (states, t, key) => {
		const A = Array.from(key).map(char => parseInt(char, 10));
		if (A.filter(x => x === 0).length !== t) { return; }
		states[t][key] = false;
		let solution = false;
		for (let i = 0; i < A.length; i += 1) {
			const modifications = [];
			if (A[i] !== 0) { continue; }
			for (let x = 1; x <= 2; x += 1) {
				A[i] = x;
				if (states[t - 1][A.join("")] !== false) {
					modifications.push([i, x]);
				}
			}
			A[i] = 0;
			if (modifications.length > 0 && solution === false) {
				solution = [];
			}
			if (modifications.length === 1) {
				solution.push(modifications[0]);
			}
		}
		if (solution !== false && solution.length === 0) {
			solution = true;
		}
		states[t][key] = solution;
	};
	const make_lookup = (valid_states) => {
		const choose_count = valid_states[0].length;
		const states = Array
			.from(Array(choose_count + 1))
			.map(() => ({}));
		Array.from(Array(Math.pow(2, choose_count)))
			.map((_, i) => i.toString(2))
			.map(str => Array.from(str).map(n => parseInt(n, 10) + 1).join(""))
			.map(str => (`11111${str}`).slice(-choose_count))
			.forEach(key => { states[0][key] = false; });
		valid_states.forEach(s => { states[0][s] = true; });
		Array.from(Array(choose_count))
			.map((_, i) => i + 1)
			.map(t => Array.from(Array(Math.pow(3, choose_count)))
				.map((_, i) => i.toString(3))
				.map(str => (`000000${str}`).slice(-choose_count))
				.forEach(key => check_state(states, t, key)));
		let outs = [];
		Array.from(Array(choose_count + 1))
			.map((_, i) => choose_count - i)
			.forEach(t => {
				const A = [];
				Object.keys(states[t]).forEach(key => {
					let out = states[t][key];
					if (out.constructor === Array) { out = out[0]; }
					A.push([key, out]);
				});
				outs = outs.concat(A);
			});
		outs.sort((a, b) => parseInt(a[0], 10) - parseInt(b[0], 10));
		const lookup = {};
		outs.forEach(el => { lookup[el[0]] = Object.freeze(el[1]); });
		return Object.freeze(lookup);
	};
	const layerTable = {
		taco_taco: make_lookup(taco_taco_valid_states),
		taco_tortilla: make_lookup(taco_tortilla_valid_states),
		tortilla_tortilla: make_lookup(tortilla_tortilla_valid_states),
		transitivity: make_lookup(transitivity_valid_states),
	};

	const constraintToFacePairs = ({
		taco_taco: f => [
			[f[0], f[2]],
			[f[1], f[3]],
			[f[1], f[2]],
			[f[0], f[3]],
			[f[0], f[1]],
			[f[2], f[3]],
		],
		taco_tortilla: f => [[f[0], f[2]], [f[0], f[1]], [f[1], f[2]]],
		tortilla_tortilla: f => [[f[0], f[2]], [f[1], f[3]]],
		transitivity: f => [[f[0], f[1]], [f[1], f[2]], [f[2], f[0]]],
	});
	const pairArrayToSortedPairString = pair => (pair[0] < pair[1]
		? `${pair[0]} ${pair[1]}`
		: `${pair[1]} ${pair[0]}`);
	const constraintToFacePairsStrings = ({
		taco_taco: f => [
			pairArrayToSortedPairString([f[0], f[2]]),
			pairArrayToSortedPairString([f[1], f[3]]),
			pairArrayToSortedPairString([f[1], f[2]]),
			pairArrayToSortedPairString([f[0], f[3]]),
			pairArrayToSortedPairString([f[0], f[1]]),
			pairArrayToSortedPairString([f[2], f[3]]),
		],
		taco_tortilla: f => [
			pairArrayToSortedPairString([f[0], f[2]]),
			pairArrayToSortedPairString([f[0], f[1]]),
			pairArrayToSortedPairString([f[1], f[2]]),
		],
		tortilla_tortilla: f => [
			pairArrayToSortedPairString([f[0], f[2]]),
			pairArrayToSortedPairString([f[1], f[3]]),
		],
		transitivity: f => [
			pairArrayToSortedPairString([f[0], f[1]]),
			pairArrayToSortedPairString([f[1], f[2]]),
			pairArrayToSortedPairString([f[2], f[0]]),
		],
	});
	const to_signed_layer_convert = { 0: 0, 1: 1, 2: -1 };
	const keysToFaceOrders = (facePairs, faces_normal, vector) => {
		const faces_normal_match = faces_normal
			.map(normal => math.core.dot(normal, vector) > 0);
		const keys = Object.keys(facePairs);
		const faceOrders = keys.map(string => string.split(" ").map(n => parseInt(n, 10)));
		faceOrders.forEach((faces, i) => {
			const value = to_signed_layer_convert[facePairs[keys[i]]];
			const side = (!faces_normal_match[faces[1]])
				? -value
				: value;
			faces.push(side);
		});
		return faceOrders;
	};

	const taco_types = Object.freeze(Object.keys(layerTable));
	const flipFacePairOrder = { 0: 0, 1: 2, 2: 1 };
	const buildRuleAndLookup = (type, constraint, ...orders) => {
		const facePairsArray = constraintToFacePairs[type](constraint);
		const flipped = facePairsArray.map(pair => pair[1] < pair[0]);
		const facePairs = facePairsArray.map((pair, i) => (flipped[i]
			? `${pair[1]} ${pair[0]}`
			: `${pair[0]} ${pair[1]}`));
		const key = facePairs.map((facePair, i) => {
			for (let o = 0; o < orders.length; o += 1) {
				if (orders[o][facePair]) {
					return flipped[i]
						? flipFacePairOrder[orders[o][facePair]]
						: orders[o][facePair];
				}
			}
			return 0;
		}).join("");
		if (layerTable[type][key] === true) { return true; }
		if (layerTable[type][key] === false) { return false; }
		const implication = layerTable[type][key];
		const implicationFacePair = facePairs[implication[0]];
		const implicationOrder = flipped[implication[0]]
			? flipFacePairOrder[implication[1]]
			: implication[1];
		return [implicationFacePair, implicationOrder];
	};
	const getConstraintIndicesFromFacePairs = (
		constraints,
		constraintsLookup,
		facePairsSubsetArray,
	) => {
		const constraintIndices = {};
		taco_types.forEach(type => {
			const constraintIndicesWithDups = facePairsSubsetArray
				.flatMap(facePair => constraintsLookup[type][facePair]);
			constraintIndices[type] = uniqueElements(constraintIndicesWithDups)
				.filter(i => constraints[type][i]);
		});
		return constraintIndices;
	};
	const propagate = (
		constraints,
		constraintsLookup,
		initiallyModifiedFacePairs,
		...orders
	) => {
		let modifiedFacePairs = initiallyModifiedFacePairs;
		const newOrders = {};
		do {
			const modifiedConstraintIndices = getConstraintIndicesFromFacePairs(
				constraints,
				constraintsLookup,
				modifiedFacePairs,
			);
			const roundModificationsFacePairs = {};
			for (let t = 0; t < taco_types.length; t += 1) {
				const type = taco_types[t];
				const indices = modifiedConstraintIndices[type];
				for (let i = 0; i < indices.length; i += 1) {
					const lookupResult = buildRuleAndLookup(
						type,
						constraints[type][indices[i]],
						...orders,
						newOrders,
					);
					if (lookupResult === true) { continue; }
					if (lookupResult === false) {
						console.warn("invalid state found", type, constraints[type][indices[i]]);
						return false;
					}
					if (newOrders[lookupResult[0]]) {
						if (newOrders[lookupResult[0]] !== lookupResult[1]) {
							console.warn("order conflict", type, constraints[type][indices[i]]);
							return false;
						}
					} else {
						const [key, value] = lookupResult;
						roundModificationsFacePairs[key] = true;
						newOrders[lookupResult[0]] = value;
					}
				}
			}
			modifiedFacePairs = Object.keys(roundModificationsFacePairs);
		} while (modifiedFacePairs.length);
		return newOrders;
	};

	const getBranches = (
		remainingKeys,
		constraints,
		constraintsLookup,
		constraintsNeighborsMemo = {},
	) => {
		const taco_types = Object.keys(constraints);
		const keys = {};
		remainingKeys.forEach(key => { keys[key] = true; });
		let i = 0;
		const groups = [];
		while (i < remainingKeys.length) {
			if (!keys[remainingKeys[i]]) { i += 1; continue; }
			const group = [];
			const stack = [remainingKeys[i]];
			const stackHash = { [remainingKeys[i]]: true };
			do {
				const key = stack.shift();
				delete keys[key];
				group.push(key);
				let neighborsArray;
				if (constraintsNeighborsMemo[key]) {
					neighborsArray = constraintsNeighborsMemo[key];
				} else {
					const neighborsHash = {};
					taco_types.forEach(type => {
						const indices = constraintsLookup[type][key];
						if (!indices) { return; }
						indices
							.map(c => constraints[type][c])
							.map(faces => constraintToFacePairsStrings[type](faces)
								.forEach(facePair => { neighborsHash[facePair] = true; }));
					});
					neighborsArray = Object.keys(neighborsHash);
					constraintsNeighborsMemo[key] = neighborsArray;
				}
				const neighbors = neighborsArray
					.filter(facePair => keys[facePair])
					.filter(facePair => !stackHash[facePair]);
				stack.push(...neighbors);
				neighbors.forEach(facePair => { stackHash[facePair] = true; });
			} while (stack.length);
			i += 1;
			groups.push(group);
		}
		return groups;
	};

	const makeTortillasFacesCrossing = (graph, edges_faces_side, epsilon) => {
		const faces_winding = makeFacesWinding(graph);
		const faces_polygon = makeFacesPolygon(graph, epsilon);
		for (let i = 0; i < faces_polygon.length; i += 1) {
			if (!faces_winding[i]) { faces_polygon[i].reverse(); }
		}
		const tortilla_edge_indices = edges_faces_side
			.map(side => side.length === 2 && side[0] !== side[1])
			.map((bool, i) => (bool ? i : undefined))
			.filter(a => a !== undefined);
		const edges_coords = tortilla_edge_indices
			.map(e => graph.edges_vertices[e])
			.map(edge => edge
				.map(vertex => graph.vertices_coords[vertex]));
		const edges_vector = edges_coords
			.map(coords => math.core.subtract2(coords[1], coords[0]));
		const matrix = [];
		tortilla_edge_indices.forEach(e => { matrix[e] = []; });
		const result = tortilla_edge_indices
			.map((e, ei) => faces_polygon
				.map(poly => math.core.clipLineConvexPolygon(
					poly,
					edges_vector[ei],
					edges_coords[ei][0],
					math.core.exclude,
					math.core.excludeS,
					epsilon,
				))
				.map(res => res !== undefined));
		result.forEach((faces, ei) => faces
			.forEach((overlap, f) => {
				if (overlap) {
					matrix[tortilla_edge_indices[ei]].push(f);
				}
			}));
		return matrix;
	};
	const makeTortillaTortillaFacesCrossing = (graph, edges_faces_side, epsilon) => {
		const tortillas_faces_crossing = makeTortillasFacesCrossing(graph, edges_faces_side, epsilon);
		const tortilla_faces_results = tortillas_faces_crossing
			.map((faces, e) => faces.map(face => [graph.edges_faces[e], [face, face]]))
			.reduce((a, b) => a.concat(b), []);
		return tortilla_faces_results;
	};

	const makeEdgesFacesSide = (graph, faces_center) => {
		const edges_origin = graph.edges_vertices
			.map(vertices => graph.vertices_coords[vertices[0]]);
		const edges_vector = graph.edges_vertices
			.map(vertices => math.core.subtract2(
				graph.vertices_coords[vertices[1]],
				graph.vertices_coords[vertices[0]],
			));
		return graph.edges_faces
			.map((faces, i) => faces
				.map(face => math.core.cross2(
					math.core.subtract2(
						faces_center[face],
						edges_origin[i],
					),
					edges_vector[i],
				))
				.map(cross => Math.sign(cross)));
	};
	const makeTacosFacesSide = (graph, faces_center, tacos_edges, tacos_faces) => {
		const tacos_edge_coords = tacos_edges
			.map(edges => graph.edges_vertices[edges[0]]
				.map(vertex => graph.vertices_coords[vertex]));
		const tacos_edge_origin = tacos_edge_coords
			.map(coords => coords[0]);
		const tacos_edge_vector = tacos_edge_coords
			.map(coords => math.core.subtract2(coords[1], coords[0]));
		const tacos_faces_center = tacos_faces
			.map(faces => faces
				.map(face_pair => face_pair
					.map(face => faces_center[face])));
		return tacos_faces_center
			.map((faces, i) => faces
				.map(pairs => pairs
					.map(center => math.core.cross2(
						math.core.subtract2(
							center,
							tacos_edge_origin[i],
						),
						tacos_edge_vector[i],
					))
					.map(cross => Math.sign(cross))));
	};

	const classify_faces_pair = (pair) => {
		if ((pair[0] === 1 && pair[1] === -1)
			|| (pair[0] === -1 && pair[1] === 1)) {
			return "both";
		}
		if ((pair[0] === 1 && pair[1] === 1)) { return "right"; }
		if ((pair[0] === -1 && pair[1] === -1)) { return "left"; }
		return undefined;
	};
	const is_taco_taco = (classes) => classes[0] === classes[1]
		&& classes[0] !== "both";
	const is_tortilla_tortilla = (classes) => classes[0] === classes[1]
		&& classes[0] === "both";
	const is_taco_tortilla = (classes) => classes[0] !== classes[1]
		&& (classes[0] === "both" || classes[1] === "both");
	const make_taco_tortilla = (face_pairs, types, faces_side) => {
		const direction = types[0] === "left" || types[1] === "left" ? -1 : 1;
		const taco = types[0] === "both" ? [...face_pairs[1]] : [...face_pairs[0]];
		const index = types[0] === "both" ? 0 : 1;
		const tortilla = faces_side[index][0] === direction
			? face_pairs[index][0]
			: face_pairs[index][1];
		return { taco, tortilla };
	};
	const make_tortilla_tortilla = (face_pairs, tortillas_sides) => {
		if (face_pairs === undefined) { return undefined; }
		return (tortillas_sides[0][0] === tortillas_sides[1][0])
			? face_pairs
			: [face_pairs[0], [face_pairs[1][1], face_pairs[1][0]]];
	};
	const indicesToBooleanMatrix = (array_array) => {
		const matrix = Array.from(Array(array_array.length))
			.map(() => Array(array_array.length).fill(false));
		array_array
			.forEach((arr, i) => arr
				.forEach(j => { matrix[i][j] = true; }));
		return matrix;
	};
	const makeTacosTortillas = (graph, epsilon = math.core.EPSILON) => {
		const faces_center = makeFacesConvexCenter(graph);
		const edges_faces_side = makeEdgesFacesSide(graph, faces_center);
		const edge_edge_overlap_matrix = makeEdgesEdgesParallelOverlap(graph, epsilon);
		const boolean_edge_edge_overlap = indicesToBooleanMatrix(edge_edge_overlap_matrix);
		const tacos_edges = booleanMatrixToUniqueIndexPairs(boolean_edge_edge_overlap)
			.filter(pair => pair
				.map(edge => graph.edges_faces[edge].length > 1)
				.reduce((a, b) => a && b, true));
		const tacos_faces = tacos_edges
			.map(pair => pair
				.map(edge => graph.edges_faces[edge]));
		const tacos_faces_side = makeTacosFacesSide(graph, faces_center, tacos_edges, tacos_faces);
		const tacos_types = tacos_faces_side
			.map(faces => faces
				.map(classify_faces_pair));
		const taco_taco = tacos_types
			.map((pair, i) => (is_taco_taco(pair) ? tacos_faces[i] : undefined))
			.filter(a => a !== undefined);
		const tortilla_tortilla_aligned = tacos_types
			.map((pair, i) => (is_tortilla_tortilla(pair) ? tacos_faces[i] : undefined))
			.map((pair, i) => make_tortilla_tortilla(pair, tacos_faces_side[i]))
			.filter(a => a !== undefined);
		const tortilla_tortilla_crossing = makeTortillaTortillaFacesCrossing(
			graph,
			edges_faces_side,
			epsilon,
		);
		const tortilla_tortilla = tortilla_tortilla_aligned
			.concat(tortilla_tortilla_crossing);
		const taco_tortilla_aligned = tacos_types
			.map((pair, i) => (is_taco_tortilla(pair)
				? make_taco_tortilla(tacos_faces[i], tacos_types[i], tacos_faces_side[i])
				: undefined))
			.filter(a => a !== undefined);
		const edges_faces_overlap = makeEdgesFacesOverlap(graph, epsilon);
		const edges_overlap_faces = booleanMatrixToIndexedArray(edges_faces_overlap)
			.map((faces, e) => (edges_faces_side[e].length > 1
				&& edges_faces_side[e][0] === edges_faces_side[e][1]
				? faces
				: []));
		const taco_tortillas_crossing = edges_overlap_faces
			.map((tortillas, edge) => ({ taco: graph.edges_faces[edge], tortillas }))
			.filter(el => el.tortillas.length);
		const taco_tortilla_crossing = taco_tortillas_crossing
			.flatMap(el => el.tortillas
				.map(tortilla => ({ taco: [...el.taco], tortilla })));
		const taco_tortilla = taco_tortilla_aligned.concat(taco_tortilla_crossing);
		return {
			taco_taco,
			tortilla_tortilla,
			taco_tortilla,
		};
	};

	const makeTransitivityTrios = (
		graph,
		overlap_matrix,
		faces_winding,
		epsilon = math.core.EPSILON,
	) => {
		if (!overlap_matrix) {
			overlap_matrix = getFacesFaces2DOverlap(graph, epsilon);
		}
		if (!faces_winding) {
			faces_winding = makeFacesWinding(graph);
		}
		const polygons = graph.faces_vertices
			.map(face => face
				.map(v => graph.vertices_coords[v]));
		polygons.forEach((face, i) => {
			if (!faces_winding[i]) { face.reverse(); }
		});
		const matrix = graph.faces_vertices.map(() => []);
		for (let i = 0; i < matrix.length - 1; i += 1) {
			for (let j = i + 1; j < matrix.length; j += 1) {
				if (!overlap_matrix[i][j]) { continue; }
				const polygon = math.core.clipPolygonPolygon(polygons[i], polygons[j], epsilon);
				if (polygon) { matrix[i][j] = polygon; }
			}
		}
		const trios = [];
		for (let i = 0; i < matrix.length - 1; i += 1) {
			for (let j = i + 1; j < matrix.length; j += 1) {
				if (!matrix[i][j]) { continue; }
				for (let k = j + 1; k < matrix.length; k += 1) {
					if (i === k || j === k) { continue; }
					if (!overlap_matrix[i][k] || !overlap_matrix[j][k]) { continue; }
					const polygon = math.core.clipPolygonPolygon(matrix[i][j], polygons[k], epsilon);
					if (polygon) { trios.push([i, j, k].sort((a, b) => a - b)); }
				}
			}
		}
		return trios;
	};

	const filterTransitivity = (transitivity_trios, tacos_tortillas) => {
		const tacos_trios = {};
		tacos_tortillas.taco_taco
			.map(tacos => [tacos[0][0], tacos[0][1], tacos[1][0], tacos[1][1]]
				.sort((a, b) => a - b))
			.forEach(taco => [
				`${taco[0]} ${taco[1]} ${taco[2]}`,
				`${taco[0]} ${taco[1]} ${taco[3]}`,
				`${taco[0]} ${taco[2]} ${taco[3]}`,
				`${taco[1]} ${taco[2]} ${taco[3]}`,
			].forEach(key => { tacos_trios[key] = true; }));
		tacos_tortillas.taco_tortilla
			.map(el => [el.taco[0], el.taco[1], el.tortilla]
				.sort((a, b) => a - b).join(" "))
			.forEach(key => { tacos_trios[key] = true; });
		return transitivity_trios
			.filter(trio => tacos_trios[trio.join(" ")] === undefined);
	};

	const makeConstraints = (tacos_tortillas, transitivity_trios) => {
		const constraints = {};
		constraints.taco_taco = tacos_tortillas.taco_taco.map(el => [
			el[0][0], el[1][0], el[0][1], el[1][1],
		]);
		constraints.taco_tortilla = tacos_tortillas.taco_tortilla.map(el => [
			el.taco[0], el.tortilla, el.taco[1],
		]);
		constraints.tortilla_tortilla = tacos_tortillas.tortilla_tortilla.map(el => [
			el[0][0], el[0][1], el[1][0], el[1][1],
		]);
		constraints.transitivity = transitivity_trios.map(el => [
			el[0], el[1], el[2],
		]);
		return constraints;
	};
	const makeConstraintsLookup = (constraints) => {
		const lookup = {};
		Object.keys(constraints).forEach(key => { lookup[key] = {}; });
		Object.keys(constraints).forEach(type => {
			constraints[type]
				.forEach((constraint, i) => constraintToFacePairsStrings[type](constraint)
					.forEach(key => {
						if (lookup[type][key] === undefined) {
							lookup[type][key] = [];
						}
						lookup[type][key].push(i);
					}));
		});
		return lookup;
	};

	const make_conditions_flip_condition = { 0: 0, 1: 2, 2: 1 };
	const make_conditions_assignment_direction = {
		M: 1, m: 1, V: 2, v: 2,
	};
	const makeFacePairs = (graph, overlap_matrix) => {
		if (!overlap_matrix) {
			overlap_matrix = getFacesFaces2DOverlap(graph);
		}
		return booleanMatrixToUniqueIndexPairs(overlap_matrix)
			.map(pair => pair.join(" "));
	};
	const solveEdgeAdjacentFacePairs = (graph, facePairs, faces_winding) => {
		if (!faces_winding) {
			faces_winding = makeFacesWinding(graph);
		}
		const facePairsHash = {};
		facePairs.forEach(key => { facePairsHash[key] = true; });
		const soution = {};
		graph.edges_faces.forEach((faces, edge) => {
			const assignment = graph.edges_assignment[edge];
			const local_order = make_conditions_assignment_direction[assignment];
			if (faces.length < 2 || local_order === undefined) { return; }
			const upright = faces_winding[faces[0]];
			const global_order = upright
				? local_order
				: make_conditions_flip_condition[local_order];
			const key1 = `${faces[0]} ${faces[1]}`;
			const key2 = `${faces[1]} ${faces[0]}`;
			if (key1 in facePairsHash) { soution[key1] = global_order; }
			if (key2 in facePairsHash) {
				soution[key2] = make_conditions_flip_condition[global_order];
			}
		});
		return soution;
	};

	const prepare = (graph, epsilon = 1e-6) => {
		const overlap = getFacesFaces2DOverlap(graph, epsilon);
		const facesWinding = makeFacesWinding(graph);
		const tacos_tortillas = makeTacosTortillas(graph, epsilon);
		const unfiltered_trios = makeTransitivityTrios(graph, overlap, facesWinding, epsilon);
		const transitivity_trios = filterTransitivity(unfiltered_trios, tacos_tortillas);
		const constraints = makeConstraints(tacos_tortillas, transitivity_trios);
		const constraintsLookup = makeConstraintsLookup(constraints);
		const facePairs = makeFacePairs(graph, overlap);
		const edgeAdjacentOrders = solveEdgeAdjacentFacePairs(graph, facePairs, facesWinding);
		console.log("overlap", overlap);
		console.log("graph", graph);
		console.log("facesWinding", facesWinding);
		console.log("tacos_tortillas", tacos_tortillas);
		console.log("unfiltered_trios", unfiltered_trios);
		console.log("transitivity_trios", transitivity_trios);
		console.log("facePairs", facePairs);
		console.log("constraints", constraints);
		console.log("constraintsLookup", constraintsLookup);
		console.log("edgeAdjacentOrders", edgeAdjacentOrders);
		return {
			constraints,
			constraintsLookup,
			facePairs,
			edgeAdjacentOrders,
		};
	};

	const match = (listA, listB) => {
		const res = [];
		for (let i = 0; i < listA.length; i += 1) {
			for (let j = 0; j < listB.length; j += 1) {
				res.push([listA[i], listB[j]]);
			}
		}
		return res;
	};
	const linearizeSolutions = (solution) => {
		const recurse = (node, stack = []) => {
			if (node.faceOrders) { stack.push(node.faceOrders); }
			const finished = node.finished
				? node.finished.map(fin => [...stack, fin.faceOrders])
				: undefined;
			if (node.unfinished) {
				const unf = node.unfinished.map(el => recurse(el, JSON.parse(JSON.stringify(stack))));
				const unfinished = (unf.length > 1) ? match(...unf) : unf;
				unfinished.forEach(el => { el.branch = true; });
				finished.forEach(el => el.push(...unfinished));
			}
			finished.finished = true;
			return finished;
		};
		return recurse(solution);
	};
	const LayerPrototype = {
		allSolutions: function () {
			return linearizeSolutions(this);
		},
	};

	const solveBranch = (
		constraints,
		constraintsLookup,
		constraintsNeighborsMemo,
		unsolvedKeys,
		solutionNode,
		...orders
	) => {
		if (!unsolvedKeys.length) { return []; }
		const guessKey = unsolvedKeys[0];
		const completedSolutions = [];
		const unfinishedSolutions = [];
		[1, 2].forEach(b => {
			const result = propagate(
				constraints,
				constraintsLookup,
				[guessKey],
				...orders,
				{ [guessKey]: b },
			);
			if (result === false) { return; }
			result[guessKey] = b;
			if (Object.keys(result).length === unsolvedKeys.length) {
				completedSolutions.push(result);
			} else {
				unfinishedSolutions.push(result);
			}
		});
		const childNodes = unfinishedSolutions.map(order => ({ faceOrders: order }));
		const recursed = unfinishedSolutions
			.map((order, i) => {
				const remainingKeys = unsolvedKeys.filter(key => !(key in order));
				return getBranches(remainingKeys, constraints, constraintsLookup, constraintsNeighborsMemo)
					.map(branchUnsolvedKeys => solveBranch(
						constraints,
						constraintsLookup,
						constraintsNeighborsMemo,
						branchUnsolvedKeys,
						childNodes[i],
						...orders,
						order,
					));
			});
		if (completedSolutions.length) {
			solutionNode.finished = completedSolutions.map(order => ({ faceOrders: order }));
		}
		if (childNodes.length) {
			solutionNode.unfinished = childNodes;
		}
		if (childNodes.length > 1 && completedSolutions.length) { console.log("HAPPENED"); }
		return completedSolutions
			.map(order => ([...orders, order]))
			.concat(...recursed);
	};
	const globalLayerSolver = (graph, epsilon = 1e-6) => {
		const prepareStartDate = new Date();
		const {
			constraints,
			constraintsLookup,
			facePairs,
			edgeAdjacentOrders,
		} = prepare(graph, epsilon);
		const prepareDuration = Date.now() - prepareStartDate;
		const startDate = new Date();
		const initialResult = propagate(
			constraints,
			constraintsLookup,
			Object.keys(edgeAdjacentOrders),
			edgeAdjacentOrders,
		);
		if (!initialResult) { return undefined; }
		console.log("2D initialResult", JSON.parse(JSON.stringify(initialResult)));
		const solution = {};
		const remainingKeys = facePairs
			.filter(key => !(key in edgeAdjacentOrders))
			.filter(key => !(key in initialResult));
		const constraintsNeighborsMemo = {};
		const branches = getBranches(
			remainingKeys,
			constraints,
			constraintsLookup,
			constraintsNeighborsMemo,
		);
		console.log("branches", branches);
		const nextLevel = branches.map(() => ({}));
		const branchResults = branches.map((unsolvedKeys, i) => solveBranch(
			constraints,
			constraintsLookup,
			constraintsNeighborsMemo,
			unsolvedKeys,
			nextLevel[i],
			edgeAdjacentOrders,
			initialResult,
		));
		if (nextLevel.length) {
			solution.unfinished = nextLevel;
		}
		solution.faceOrders = { ...edgeAdjacentOrders, ...initialResult };
		console.log("2D solution", JSON.parse(JSON.stringify(solution.faceOrders)));
		const faces_normal = graph.faces_normal
			? graph.faces_normal
			: makeFacesNormal(graph);
		const z_vector = [0, 0, 1];
		const recurse = (node) => {
			if (node.faceOrders) {
				node.faceOrders = keysToFaceOrders(node.faceOrders, faces_normal, z_vector);
			}
			if (node.finished) { node.finished.forEach(child => recurse(child)); }
			if (node.unfinished) { node.unfinished.forEach(child => recurse(child)); }
		};
		recurse(solution);
		console.log("2D solution final", JSON.parse(JSON.stringify(solution.faceOrders)));
		const duration = Date.now() - startDate;
			console.log(`prep ${prepareDuration}ms solver ${duration}ms`);
		console.log("solution", solution);
		console.log("branches", branchResults);
		return Object.assign(
			Object.create(LayerPrototype),
			solution,
		);
	};

	var layer = Object.assign(
		Object.create(null),
		{
			solver: globalLayerSolver$1,
			solver2d: globalLayerSolver,
			topologicalOrder,
			singleVertexSolver,
			singleVertexAssignmentSolver: assignmentSolver,
			foldStripWithAssignments,
		},
		general,
		nudge,
	);

	const odd_assignment = (assignments) => {
		let ms = 0;
		let vs = 0;
		for (let i = 0; i < assignments.length; i += 1) {
			if (assignments[i] === "M" || assignments[i] === "m") { ms += 1; }
			if (assignments[i] === "V" || assignments[i] === "v") { vs += 1; }
		}
		for (let i = 0; i < assignments.length; i += 1) {
			if (ms > vs && (assignments[i] === "V" || assignments[i] === "v")) { return i; }
			if (vs > ms && (assignments[i] === "M" || assignments[i] === "m")) { return i; }
		}
		return undefined;
	};
	const foldAngles4 = (sectors, assignments, t = 0) => {
		const odd = odd_assignment(assignments);
		if (odd === undefined) { return; }
		const a = sectors[(odd + 1) % sectors.length];
		const b = sectors[(odd + 2) % sectors.length];
		const pbc = Math.PI * t;
		const cosE = -Math.cos(a) * Math.cos(b) + Math.sin(a) * Math.sin(b) * Math.cos(Math.PI - pbc);
		const res = Math.cos(Math.PI - pbc)
			- ((Math.sin(Math.PI - pbc) ** 2) * Math.sin(a) * Math.sin(b))
			/ (1 - cosE);
		const pab = -Math.acos(res) + Math.PI;
		return (odd % 2 === 0
			? [pab, pbc, pab, pbc].map((n, i) => (odd === i ? -n : n))
			: [pbc, pab, pbc, pab].map((n, i) => (odd === i ? -n : n)));
	};

	const kawasakiSolutions = ({ vertices_coords, vertices_edges, edges_vertices, edges_vectors }, vertex) => {
		if (!edges_vectors) {
			edges_vectors = makeEdgesVector({ vertices_coords, edges_vertices });
		}
		if (!vertices_edges) {
			vertices_edges = makeVerticesEdgesUnsorted({ edges_vertices });
		}
		const vectors = vertices_edges[vertex].map(i => edges_vectors[i]);
		const sortedVectors = math.core.counterClockwiseOrder2(vectors)
			.map(i => vectors[i]);
		return kawasakiSolutionsVectors(sortedVectors);
	};

	var kawasakiGraph = /*#__PURE__*/Object.freeze({
		__proto__: null,
		kawasakiSolutions: kawasakiSolutions
	});

	var singleVertex = Object.assign(
		Object.create(null),
		{
			maekawaAssignments,
			foldAngles4,
		},
		kawasakiMath,
		kawasakiGraph,
		validateSingleVertex,
	);

	var ar = [
		null,
		"اصنع خطاً يمر بنقطتين",
		"اصنع خطاً عن طريق طي نقطة واحدة إلى أخرى",
		"اصنع خطاً عن طريق طي خط واحد على آخر",
		"اصنع خطاً يمر عبر نقطة واحدة ويجعل خطاً واحداً فوق نفسه",
		"اصنع خطاً يمر بالنقطة الأولى ويجعل النقطة الثانية على الخط",
		"اصنع خطاً يجلب النقطة الأولى إلى الخط الأول والنقطة الثانية إلى الخط الثاني",
		"اصنع خطاً يجلب نقطة إلى خط ويجعل خط ثاني فوق نفسه"
	];
	var de = [
		null,
		"Falte eine Linie durch zwei Punkte",
		"Falte zwei Punkte aufeinander",
		"Falte zwei Linien aufeinander",
		"Falte eine Linie auf sich selbst, falte dabei durch einen Punkt",
		"Falte einen Punkt auf eine Linie, falte dabei durch einen anderen Punkt",
		"Falte einen Punkt auf eine Linie und einen weiteren Punkt auf eine weitere Linie",
		"Falte einen Punkt auf eine Linie und eine weitere Linie in sich selbst zusammen"
	];
	var en = [
		null,
		"fold a line through two points",
		"fold two points together",
		"fold two lines together",
		"fold a line on top of itself, creasing through a point",
		"fold a point to a line, creasing through another point",
		"fold a point to a line and another point to another line",
		"fold a point to a line and another line onto itself"
	];
	var es = [
		null,
		"dobla una línea entre dos puntos",
		"dobla dos puntos juntos",
		"dobla y une dos líneas",
		"dobla una línea sobre sí misma, doblándola hacia un punto",
		"dobla un punto hasta una línea, doblándola a través de otro punto",
		"dobla un punto hacia una línea y otro punto hacia otra línea",
		"dobla un punto hacia una línea y otra línea sobre sí misma"
	];
	var fr = [
		null,
		"créez un pli passant par deux points",
		"pliez pour superposer deux points",
		"pliez pour superposer deux lignes",
		"rabattez une ligne sur elle-même à l'aide d'un pli qui passe par un point",
		"rabattez un point sur une ligne à l'aide d'un pli qui passe par un autre point",
		"rabattez un point sur une ligne et un autre point sur une autre ligne",
		"rabattez un point sur une ligne et une autre ligne sur elle-même"
	];
	var hi = [
		null,
		"एक क्रीज़ बनाएँ जो दो स्थानों से गुजरता है",
		"एक स्थान को दूसरे स्थान पर मोड़कर एक क्रीज़ बनाएँ",
		"एक रेखा पर दूसरी रेखा को मोड़कर क्रीज़ बनाएँ",
		"एक क्रीज़ बनाएँ जो एक स्थान से गुजरता है और एक रेखा को स्वयं के ऊपर ले आता है",
		"एक क्रीज़ बनाएँ जो पहले स्थान से गुजरता है और दूसरे स्थान को रेखा पर ले आता है",
		"एक क्रीज़ बनाएँ जो पहले स्थान को पहली रेखा पर और दूसरे स्थान को दूसरी रेखा पर ले आता है",
		"एक क्रीज़ बनाएँ जो एक स्थान को एक रेखा पर ले आता है और दूसरी रेखा को स्वयं के ऊपर ले आता है"
	];
	var jp = [
		null,
		"2点に沿って折り目を付けます",
		"2点を合わせて折ります",
		"2つの線を合わせて折ります",
		"点を通過させ、既にある線に沿って折ります",
		"点を線沿いに合わせ別の点を通過させ折ります",
		"線に向かって点を折り、同時にもう一方の線に向かってもう一方の点を折ります",
		"線に向かって点を折り、同時に別の線をその上に折ります"
	];
	var ko = [
		null,
		"두 점을 통과하는 선으로 접으세요",
		"두 점을 함께 접으세요",
		"두 선을 함께 접으세요",
		"그 위에 선을 접으면서 점을 통과하게 접으세요",
		"점을 선으로 접으면서, 다른 점을 지나게 접으세요",
		"점을 선으로 접고 다른 점을 다른 선으로 접으세요",
		"점을 선으로 접고 다른 선을 그 위에 접으세요"
	];
	var ms = [
		null,
		"lipat garisan melalui dua titik",
		"lipat dua titik bersama",
		"lipat dua garisan bersama",
		"lipat satu garisan di atasnya sendiri, melipat melalui satu titik",
		"lipat satu titik ke garisan, melipat melalui titik lain",
		"lipat satu titik ke garisan dan satu lagi titik ke garisan lain",
		"lipat satu titik ke garisan dan satu lagi garisan di atasnya sendiri"
	];
	var pt = [
		null,
		"dobre uma linha entre dois pontos",
		"dobre os dois pontos para uni-los",
		"dobre as duas linhas para uni-las",
		"dobre uma linha sobre si mesma, criando uma dobra ao longo de um ponto",
		"dobre um ponto até uma linha, criando uma dobra ao longo de outro ponto",
		"dobre um ponto até uma linha e outro ponto até outra linha",
		"dobre um ponto até uma linha e outra linha sobre si mesma"
	];
	var ru = [
		null,
		"сложите линию через две точки",
		"сложите две точки вместе",
		"сложите две линии вместе",
		"сверните линию сверху себя, сгибая через точку",
		"сложите точку в линию, сгибая через другую точку",
		"сложите точку в линию и другую точку в другую линию",
		"сложите точку в линию и другую линию на себя"
	];
	var tr = [
		null,
		"iki noktadan geçen bir çizgi boyunca katla",
		"iki noktayı birbirine katla",
		"iki çizgiyi birbirine katla",
		"bir noktadan kıvırarak kendi üzerindeki bir çizgi boyunca katla",
		"başka bir noktadan kıvırarak bir noktayı bir çizgiye katla",
		"bir noktayı bir çizgiye ve başka bir noktayı başka bir çizgiye katla",
		"bir noktayı bir çizgiye ve başka bir çizgiyi kendi üzerine katla"
	];
	var vi = [
		null,
		"tạo một nếp gấp đi qua hai điểm",
		"tạo nếp gấp bằng cách gấp một điểm này sang điểm khác",
		"tạo nếp gấp bằng cách gấp một đường lên một đường khác",
		"tạo một nếp gấp đi qua một điểm và đưa một đường lên trên chính nó",
		"tạo một nếp gấp đi qua điểm đầu tiên và đưa điểm thứ hai lên đường thẳng",
		"tạo một nếp gấp mang điểm đầu tiên đến đường đầu tiên và điểm thứ hai cho đường thứ hai",
		"tạo một nếp gấp mang lại một điểm cho một đường và đưa một đường thứ hai lên trên chính nó"
	];
	var zh = [
		null,
		"通過兩點折一條線",
		"將兩點折疊起來",
		"將兩條線折疊在一起",
		"通過一個點折疊一條線在自身上面",
		"將一個點，通過另一個點折疊成一條線，",
		"將一個點折疊為一條線，再將另一個點折疊到另一條線",
		"將一個點折疊成一條線，另一條線折疊到它自身上"
	];
	var axioms = {
		ar: ar,
		de: de,
		en: en,
		es: es,
		fr: fr,
		hi: hi,
		jp: jp,
		ko: ko,
		ms: ms,
		pt: pt,
		ru: ru,
		tr: tr,
		vi: vi,
		zh: zh
	};

	var fold = {
		es: "doblez"
	};
	var sink = {
	};
	var blintz = {
		zh: "坐墊基"
	};
	var squash = {
		zh: "壓摺"
	};
	var instructions = {
		fold: fold,
		"valley fold": {
		es: "doblez de valle",
		zh: "谷摺"
	},
		"mountain fold": {
		es: "doblez de montaña",
		zh: "山摺"
	},
		"inside reverse fold": {
		zh: "內中割摺"
	},
		"outside reverse fold": {
		zh: "外中割摺"
	},
		sink: sink,
		"open sink": {
		zh: "開放式沉壓摺"
	},
		"closed sink": {
		zh: "封閉式沉壓摺"
	},
		"rabbit ear": {
		zh: "兔耳摺"
	},
		"double rabbit ear": {
		zh: "雙兔耳摺"
	},
		"petal fold": {
		zh: "花瓣摺"
	},
		blintz: blintz,
		squash: squash,
		"flip over": {
		es: "dale la vuelta a tu papel"
	}
	};

	var text = {
		axioms,
		instructions,
	};

	const newFoldFile = () => {
		const graph = {};
		graph.file_spec = file_spec;
		graph.file_creator = file_creator;
		graph.file_classes = ["singleModel"];
		graph.frame_classes = [];
		graph.frame_attributes = [];
		graph.vertices_coords = [];
		graph.faces_vertices = [];
		return graph;
	};
	const updateMetadata = (graph) => {
		if (!graph.edges_foldAngle || !graph.edges_foldAngle.length) { return; }
		let is2D = true;
		for (let i = 0; i < graph.edges_foldAngle.length; i += 1) {
			if (graph.edges_foldAngle[i] !== 0
				&& graph.edges_foldAngle[i] !== -180
				&& graph.edges_foldAngle[i] !== 180) {
				is2D = false;
				break;
			}
		}
		graph.frame_classes.push(is2D ? "creasePattern" : "foldedForm");
		graph.frame_attributes.push(is2D ? "2D" : "3D");
	};
	const pairify = (list) => list.map((val, i, arr) => [val, arr[(i + 1) % arr.length]]);
	const makeEdgesVertices = ({ faces_vertices }) => {
		const edgeExists = {};
		const edges_vertices = [];
		faces_vertices
			.flatMap(pairify)
			.forEach(edge => {
				const keys = [edge.join(" "), `${edge[1]} ${edge[0]}`];
				if (keys[0] in edgeExists || keys[1] in edgeExists) { return; }
				edges_vertices.push(edge);
				edgeExists[keys[0]] = true;
			});
		return edges_vertices;
	};
	const parseFace = (face) => face
		.slice(1)
		.map(str => parseInt(str, 10) - 1);
	const parseVertex = (vertex) => vertex
		.slice(1)
		.map(str => parseFloat(str));
	const objToFold = (file) => {
		const lines = file.split("\n").map(line => line.trim().split(/\s+/));
		const graph = newFoldFile();
		for (let i = 0; i < lines.length; i += 1) {
			switch (lines[i][0].toLowerCase()) {
			case "f": graph.faces_vertices.push(parseFace(lines[i])); break;
			case "v": graph.vertices_coords.push(parseVertex(lines[i])); break;
			}
		}
		graph.faces_normal = makeFacesNormal(graph);
		graph.faces_center = makeFacesConvexCenter(graph);
		graph.edges_vertices = makeEdgesVertices(graph);
		graph.faces_edges = makeFacesEdgesFromVertices(graph);
		graph.edges_faces = makeEdgesFacesUnsorted(graph);
		graph.edges_foldAngle = makeEdgesFoldAngleFromFaces(graph);
		graph.edges_assignment = makeEdgesAssignment(graph);
		graph.vertices_vertices = makeVerticesVerticesFromFaces(graph);
		delete graph.faces_normal;
		delete graph.faces_center;
		delete graph.edges_faces;
		updateMetadata(graph);
		return graph;
	};

	const getContainingValue = (oripa, value) => Array
		.from(oripa.children)
		.filter(el => el.attributes.length && Array.from(el.attributes)
			.filter(attr => attr.nodeValue === value)
			.shift() !== undefined)
		.shift();
	const getMetadataValue = (oripa, value) => {
		const parentNode = getContainingValue(oripa, value);
		const node = parentNode
			? Array.from(parentNode.children).shift()
			: null;
		return node
			? node.textContent
			: undefined;
	};
	const getLines = (oripa) => {
		const linesParent = getContainingValue(oripa, "lines");
		const linesNode = linesParent
			? Array.from(linesParent.children)
				.filter(el => el.className === "oripa.OriLineProxy")
				.shift()
			: undefined;
		return linesNode ? Array.from(linesNode.children) : [];
	};
	const nullXMLValue = { children: [{ textContent: "0" }] };
	const parseLines = (lines) => lines.map(line => {
		const attributes = Array.from(line.children[0].children);
		return ["type", "x0", "x1", "y0", "y1"]
			.map(key => parseFloat((attributes
				.filter(el => el.attributes[0].nodeValue === key)
				.shift() || nullXMLValue)
				.children[0]
				.textContent));
	});
	const opxAssignment = ["F", "B", "M", "V", "U"];
	const makeFOLD = (lines, epsilon) => {
		const fold = {};
		fold.vertices_coords = lines
			.flatMap(line => [[line[1], line[3]], [line[2], line[4]]]);
		fold.edges_vertices = lines.map((_, i) => [i * 2, i * 2 + 1]);
		fold.edges_assignment = lines.map(line => opxAssignment[line[0]]);
		fold.edges_foldAngle = makeEdgesFoldAngle(fold);
		if (epsilon === undefined) {
			const { span } = math.core.boundingBox(fold.vertices_coords);
			epsilon = Math.min(...span) * 1e-6;
		}
		removeDuplicateVertices(fold, epsilon);
		fold.vertices_vertices = makeVerticesVertices(fold);
		const faces = makePlanarFaces(fold);
		fold.faces_vertices = faces.map(el => el.vertices);
		fold.faces_edges = faces.map(el => el.edges);
		return fold;
	};
	const setMetadata = (oripa, fold) => {
		const metadata = {
			file_description: "memo",
			file_author: "originalAuthorName",
			file_title: "title",
		};
		Object.keys(metadata).forEach(key => {
			metadata[key] = getMetadataValue(oripa, metadata[key]);
		});
		Object.keys(metadata)
			.filter(key => metadata[key])
			.forEach(key => { fold[key] = metadata[key]; });
		fold.file_classes = ["singleModel"];
		fold.frame_classes = ["creasePattern"];
	};
	const opxToFOLD = (file, epsilon) => {
		try {
			const parsed = (new (RabbitEarWindow().DOMParser)()).parseFromString(file, "text/xml");
			const oripa = Array.from(parsed.documentElement.children)
				.filter(el => Array.from(el.classList).includes("oripa.DataSet"))
				.shift();
			const fold = makeFOLD(parseLines(getLines(oripa)), epsilon);
			setMetadata(oripa, fold);
			return fold;
		} catch (error) {
			console.error(error);
		}
		return undefined;
	};

	const xmlStringToDOM = (input, mimeType = "text/xml") => (
		new (RabbitEarWindow().DOMParser)()
	).parseFromString(input, mimeType).documentElement;
	const flattenDomTree = (el) => (el.children == null || !el.children.length
		? [el]
		: Array.from(el.children)
			.flatMap(child => flattenDomTree(child)));
	const getRootParent = (el) => {
		let parent = el;
		while (parent.parentNode != null) {
			parent = parent.parentNode;
		}
		return parent;
	};

	const getStylesheetStyle = (key, nodeName, attributes, sheets = []) => {
		const classes = attributes.class
			? attributes.class
				.split(/\s/)
				.filter(Boolean)
				.map(i => i.trim())
				.map(str => `.${str}`)
			: [];
		const id = attributes.id
			? `#${attributes.id}`
			: null;
		if (id) {
			for (let s = 0; s < sheets.length; s += 1) {
				if (sheets[s][id] && sheets[s][id][key]) {
					return sheets[s][id][key];
				}
			}
		}
		for (let s = 0; s < sheets.length; s += 1) {
			for (let c = 0; c < classes.length; c += 1) {
				if (sheets[s][classes[c]] && sheets[s][classes[c]][key]) {
					return sheets[s][classes[c]][key];
				}
			}
			if (sheets[s][nodeName] && sheets[s][nodeName][key]) {
				return sheets[s][nodeName][key];
			}
		}
		return undefined;
	};
	const getAttributeValue = (key, nodeName, attributes, sheets = []) => {
		const inlineStyle = attributes.style
			? attributes.style.match(new RegExp(`${key}[\\s]*:[^;]*;`))
			: null;
		if (inlineStyle) {
			return inlineStyle[0].split(":")[1].replace(";", "");
		}
		const sheetResult = getStylesheetStyle(key, nodeName, attributes, sheets);
		if (sheetResult !== undefined) { return sheetResult; }
		if (attributes[key]) { return attributes[key]; }
		return null;
	};

	var attrs = {
		line: {
			x1: 1,
			y1: 1,
			x2: 1,
			y2: 1
		},
		rect: {
			x: 1,
			y: 1,
			width: 1,
			height: 1
		},
		circle: {
			cx: 1,
			cy: 1,
			r: 1
		},
		ellipse: {
			cx: 1,
			cy: 1,
			rx: 1,
			ry: 1
		},
		polygon: {
			points: 1
		},
		polyline: {
			points: 1
		},
		path: {
			d: 1
		}
	};
	var geometryAttributes = {
		attrs: attrs
	};

	const pointsStringToArray = str => {
		const list = str
			.split(/[\s,]+/)
			.map(n => parseFloat(n));
		return Array
			.from(Array(Math.floor(list.length / 2)))
			.map((_, i) => [list[i * 2 + 0], list[i * 2 + 1]]);
	};
	const getAttributesFloatValue = (element, attributes) => attributes
		.map(attr => element.getAttribute(attr))
		.map(str => (str == null ? "0" : str))
		.map(parseFloat);

	const LineToSegments = (line) => [
		getAttributesFloatValue(line, ["x1", "y1", "x2", "y2"]),
	];

	const RectToSegments = function (rect) {
		const [x, y, w, h] = getAttributesFloatValue(
			rect,
			["x", "y", "width", "height"],
		);
		return [
			[x, y, x + w, y],
			[x + w, y, x + w, y + h],
			[x + w, y + h, x, y + h],
			[x, y + h, x, y],
		];
	};

	const PolygonToSegments = (poly) => (
		pointsStringToArray(poly.getAttribute("points") || "")
			.map((_, i, arr) => [
				arr[i][0],
				arr[i][1],
				arr[(i + 1) % arr.length][0],
				arr[(i + 1) % arr.length][1],
			])
	);

	const PolylineToSegments = function (polyline) {
		const circularPath = PolygonToSegments(polyline);
		circularPath.pop();
		return circularPath;
	};

	const straightPathLines = {
		L: true, V: true, H: true, Z: true,
	};
	const PathToSegments = (path) => root.svg.core
		.parsePathCommandsEndpoints(path.getAttribute("d") || "")
		.filter(command => straightPathLines[command.command.toUpperCase()])
		.map(el => [el.start, el.end])
		.filter(seg => !math.core.fnEpsilonEqualVectors(...seg))
		.map(seg => seg.flat());

	const parsers = {
		line: LineToSegments,
		rect: RectToSegments,
		polygon: PolygonToSegments,
		polyline: PolylineToSegments,
		path: PathToSegments,
	};

	var black = "#000000";
	var silver = "#c0c0c0";
	var gray = "#808080";
	var white = "#ffffff";
	var maroon = "#800000";
	var red = "#ff0000";
	var purple = "#800080";
	var fuchsia = "#ff00ff";
	var green = "#008000";
	var lime = "#00ff00";
	var olive = "#808000";
	var yellow = "#ffff00";
	var navy = "#000080";
	var blue = "#0000ff";
	var teal = "#008080";
	var aqua = "#00ffff";
	var orange = "#ffa500";
	var aliceblue = "#f0f8ff";
	var antiquewhite = "#faebd7";
	var aquamarine = "#7fffd4";
	var azure = "#f0ffff";
	var beige = "#f5f5dc";
	var bisque = "#ffe4c4";
	var blanchedalmond = "#ffebcd";
	var blueviolet = "#8a2be2";
	var brown = "#a52a2a";
	var burlywood = "#deb887";
	var cadetblue = "#5f9ea0";
	var chartreuse = "#7fff00";
	var chocolate = "#d2691e";
	var coral = "#ff7f50";
	var cornflowerblue = "#6495ed";
	var cornsilk = "#fff8dc";
	var crimson = "#dc143c";
	var cyan = "#00ffff";
	var darkblue = "#00008b";
	var darkcyan = "#008b8b";
	var darkgoldenrod = "#b8860b";
	var darkgray = "#a9a9a9";
	var darkgreen = "#006400";
	var darkgrey = "#a9a9a9";
	var darkkhaki = "#bdb76b";
	var darkmagenta = "#8b008b";
	var darkolivegreen = "#556b2f";
	var darkorange = "#ff8c00";
	var darkorchid = "#9932cc";
	var darkred = "#8b0000";
	var darksalmon = "#e9967a";
	var darkseagreen = "#8fbc8f";
	var darkslateblue = "#483d8b";
	var darkslategray = "#2f4f4f";
	var darkslategrey = "#2f4f4f";
	var darkturquoise = "#00ced1";
	var darkviolet = "#9400d3";
	var deeppink = "#ff1493";
	var deepskyblue = "#00bfff";
	var dimgray = "#696969";
	var dimgrey = "#696969";
	var dodgerblue = "#1e90ff";
	var firebrick = "#b22222";
	var floralwhite = "#fffaf0";
	var forestgreen = "#228b22";
	var gainsboro = "#dcdcdc";
	var ghostwhite = "#f8f8ff";
	var gold = "#ffd700";
	var goldenrod = "#daa520";
	var greenyellow = "#adff2f";
	var grey = "#808080";
	var honeydew = "#f0fff0";
	var hotpink = "#ff69b4";
	var indianred = "#cd5c5c";
	var indigo = "#4b0082";
	var ivory = "#fffff0";
	var khaki = "#f0e68c";
	var lavender = "#e6e6fa";
	var lavenderblush = "#fff0f5";
	var lawngreen = "#7cfc00";
	var lemonchiffon = "#fffacd";
	var lightblue = "#add8e6";
	var lightcoral = "#f08080";
	var lightcyan = "#e0ffff";
	var lightgoldenrodyellow = "#fafad2";
	var lightgray = "#d3d3d3";
	var lightgreen = "#90ee90";
	var lightgrey = "#d3d3d3";
	var lightpink = "#ffb6c1";
	var lightsalmon = "#ffa07a";
	var lightseagreen = "#20b2aa";
	var lightskyblue = "#87cefa";
	var lightslategray = "#778899";
	var lightslategrey = "#778899";
	var lightsteelblue = "#b0c4de";
	var lightyellow = "#ffffe0";
	var limegreen = "#32cd32";
	var linen = "#faf0e6";
	var magenta = "#ff00ff";
	var mediumaquamarine = "#66cdaa";
	var mediumblue = "#0000cd";
	var mediumorchid = "#ba55d3";
	var mediumpurple = "#9370db";
	var mediumseagreen = "#3cb371";
	var mediumslateblue = "#7b68ee";
	var mediumspringgreen = "#00fa9a";
	var mediumturquoise = "#48d1cc";
	var mediumvioletred = "#c71585";
	var midnightblue = "#191970";
	var mintcream = "#f5fffa";
	var mistyrose = "#ffe4e1";
	var moccasin = "#ffe4b5";
	var navajowhite = "#ffdead";
	var oldlace = "#fdf5e6";
	var olivedrab = "#6b8e23";
	var orangered = "#ff4500";
	var orchid = "#da70d6";
	var palegoldenrod = "#eee8aa";
	var palegreen = "#98fb98";
	var paleturquoise = "#afeeee";
	var palevioletred = "#db7093";
	var papayawhip = "#ffefd5";
	var peachpuff = "#ffdab9";
	var peru = "#cd853f";
	var pink = "#ffc0cb";
	var plum = "#dda0dd";
	var powderblue = "#b0e0e6";
	var rosybrown = "#bc8f8f";
	var royalblue = "#4169e1";
	var saddlebrown = "#8b4513";
	var salmon = "#fa8072";
	var sandybrown = "#f4a460";
	var seagreen = "#2e8b57";
	var seashell = "#fff5ee";
	var sienna = "#a0522d";
	var skyblue = "#87ceeb";
	var slateblue = "#6a5acd";
	var slategray = "#708090";
	var slategrey = "#708090";
	var snow = "#fffafa";
	var springgreen = "#00ff7f";
	var steelblue = "#4682b4";
	var tan = "#d2b48c";
	var thistle = "#d8bfd8";
	var tomato = "#ff6347";
	var turquoise = "#40e0d0";
	var violet = "#ee82ee";
	var wheat = "#f5deb3";
	var whitesmoke = "#f5f5f5";
	var yellowgreen = "#9acd32";
	var cssColors = {
		black: black,
		silver: silver,
		gray: gray,
		white: white,
		maroon: maroon,
		red: red,
		purple: purple,
		fuchsia: fuchsia,
		green: green,
		lime: lime,
		olive: olive,
		yellow: yellow,
		navy: navy,
		blue: blue,
		teal: teal,
		aqua: aqua,
		orange: orange,
		aliceblue: aliceblue,
		antiquewhite: antiquewhite,
		aquamarine: aquamarine,
		azure: azure,
		beige: beige,
		bisque: bisque,
		blanchedalmond: blanchedalmond,
		blueviolet: blueviolet,
		brown: brown,
		burlywood: burlywood,
		cadetblue: cadetblue,
		chartreuse: chartreuse,
		chocolate: chocolate,
		coral: coral,
		cornflowerblue: cornflowerblue,
		cornsilk: cornsilk,
		crimson: crimson,
		cyan: cyan,
		darkblue: darkblue,
		darkcyan: darkcyan,
		darkgoldenrod: darkgoldenrod,
		darkgray: darkgray,
		darkgreen: darkgreen,
		darkgrey: darkgrey,
		darkkhaki: darkkhaki,
		darkmagenta: darkmagenta,
		darkolivegreen: darkolivegreen,
		darkorange: darkorange,
		darkorchid: darkorchid,
		darkred: darkred,
		darksalmon: darksalmon,
		darkseagreen: darkseagreen,
		darkslateblue: darkslateblue,
		darkslategray: darkslategray,
		darkslategrey: darkslategrey,
		darkturquoise: darkturquoise,
		darkviolet: darkviolet,
		deeppink: deeppink,
		deepskyblue: deepskyblue,
		dimgray: dimgray,
		dimgrey: dimgrey,
		dodgerblue: dodgerblue,
		firebrick: firebrick,
		floralwhite: floralwhite,
		forestgreen: forestgreen,
		gainsboro: gainsboro,
		ghostwhite: ghostwhite,
		gold: gold,
		goldenrod: goldenrod,
		greenyellow: greenyellow,
		grey: grey,
		honeydew: honeydew,
		hotpink: hotpink,
		indianred: indianred,
		indigo: indigo,
		ivory: ivory,
		khaki: khaki,
		lavender: lavender,
		lavenderblush: lavenderblush,
		lawngreen: lawngreen,
		lemonchiffon: lemonchiffon,
		lightblue: lightblue,
		lightcoral: lightcoral,
		lightcyan: lightcyan,
		lightgoldenrodyellow: lightgoldenrodyellow,
		lightgray: lightgray,
		lightgreen: lightgreen,
		lightgrey: lightgrey,
		lightpink: lightpink,
		lightsalmon: lightsalmon,
		lightseagreen: lightseagreen,
		lightskyblue: lightskyblue,
		lightslategray: lightslategray,
		lightslategrey: lightslategrey,
		lightsteelblue: lightsteelblue,
		lightyellow: lightyellow,
		limegreen: limegreen,
		linen: linen,
		magenta: magenta,
		mediumaquamarine: mediumaquamarine,
		mediumblue: mediumblue,
		mediumorchid: mediumorchid,
		mediumpurple: mediumpurple,
		mediumseagreen: mediumseagreen,
		mediumslateblue: mediumslateblue,
		mediumspringgreen: mediumspringgreen,
		mediumturquoise: mediumturquoise,
		mediumvioletred: mediumvioletred,
		midnightblue: midnightblue,
		mintcream: mintcream,
		mistyrose: mistyrose,
		moccasin: moccasin,
		navajowhite: navajowhite,
		oldlace: oldlace,
		olivedrab: olivedrab,
		orangered: orangered,
		orchid: orchid,
		palegoldenrod: palegoldenrod,
		palegreen: palegreen,
		paleturquoise: paleturquoise,
		palevioletred: palevioletred,
		papayawhip: papayawhip,
		peachpuff: peachpuff,
		peru: peru,
		pink: pink,
		plum: plum,
		powderblue: powderblue,
		rosybrown: rosybrown,
		royalblue: royalblue,
		saddlebrown: saddlebrown,
		salmon: salmon,
		sandybrown: sandybrown,
		seagreen: seagreen,
		seashell: seashell,
		sienna: sienna,
		skyblue: skyblue,
		slateblue: slateblue,
		slategray: slategray,
		slategrey: slategrey,
		snow: snow,
		springgreen: springgreen,
		steelblue: steelblue,
		tan: tan,
		thistle: thistle,
		tomato: tomato,
		turquoise: turquoise,
		violet: violet,
		wheat: wheat,
		whitesmoke: whitesmoke,
		yellowgreen: yellowgreen
	};

	const hexToRGB = (string) => {
		const numbersOnly = string.replace(/#(?=\S)/g, "");
		const chars = Array.from(Array(6))
			.map((_, i) => numbersOnly[i] || "0");
		const hexString = numbersOnly.length <= 4
			? [0, 0, 1, 1, 2, 2].map(i => chars[i]).join("")
			: chars.join("");
		const c = parseInt(hexString, 16);
		return [(c >> 16) & 255, (c >> 8) & 255, c & 255]
			.map(n => n / 255);
	};

	const getParenNumbers = str => {
		const match = str.match(/\(([^\)]+)\)/g);
		if (match == null || !match.length) { return undefined; }
		return match[0]
			.substring(1, match[0].length - 1)
			.split(/[\s,]+/)
			.map(parseFloat);
	};
	const parseCSSColor = (string) => {
		if (cssColors[string]) { return hexToRGB(cssColors[string]); }
		if (string[0] === "#") { return hexToRGB(string); }
		if (string.substring(0, 4) === "rgba"
			|| string.substring(0, 3) === "rgb") {
			const colors = getParenNumbers(string);
			[0, 1, 2].forEach((_, i) => { colors[i] /= 255; });
			return colors;
		}
		return [0, 0, 0];
	};

	const assignmentColors = {
		M: [1, 0, 0],
		V: [0, 0, 1],
		F: [1, 1, 0],
		U: [1, 0, 1],
		C: [0, 1, 0],
	};
	const colorToAssignment = (string) => {
		if (string == null || typeof string !== "string") {
			return "U";
		}
		const color = parseCSSColor(string);
		const color3 = color.slice(0, 3);
		const grayscale = color3.reduce((a, b) => a + b, 0) / 3;
		const gray = [grayscale, grayscale, grayscale];
		const grayDistance = {
			key: "F",
			distance: math.core.distance3(color3, gray),
		};
		const colorDistance = Object.keys(assignmentColors)
			.map(key => ({
				key,
				distance: math.core.distance3(color3, assignmentColors[key]),
			}))
			.sort((a, b) => a.distance - b.distance)
			.shift();
		return grayDistance.distance < colorDistance.distance
			? grayDistance.key
			: colorDistance.key;
	};

	const parseCSSStyleSheet = (sheet) => {
		if (!sheet.cssRules) { return {}; }
		const stylesheets = {};
		for (let i = 0; i < sheet.cssRules.length; i += 1) {
			const cssRules = sheet.cssRules[i];
			if (cssRules.type !== 1) { continue; }
			const selectorList = cssRules.selectorText
				.split(/,/gm)
				.filter(Boolean)
				.map(str => str.trim());
			const style = {};
			Object.values(cssRules.style)
				.forEach(key => { style[key] = cssRules.style[key]; });
			selectorList.forEach(selector => {
				stylesheets[selector] = style;
			});
		}
		return stylesheets;
	};
	const parseStyleElement = (style) => {
		if (style.sheet) { return parseCSSStyleSheet(style.sheet); }
		const rootParent = getRootParent(style);
		const isHTMLBound = rootParent.constructor === RabbitEarWindow().HTMLDocument;
		if (!isHTMLBound) {
			const prevParent = style.parentNode;
			if (prevParent != null) {
				prevParent.removeChild(style);
			}
			const body = RabbitEarWindow().document.body != null
				? RabbitEarWindow().document.body
				: RabbitEarWindow().document.createElement("body");
			body.appendChild(style);
			const parsedStyle = parseCSSStyleSheet(style.sheet);
			body.removeChild(style);
			if (prevParent != null) {
				prevParent.appendChild(style);
			}
			return parsedStyle;
		}
		return {};
	};

	const opacityToFoldAngle = (opacity, assignment) => {
		switch (assignment) {
		case "M": case "m": return -180 * opacity;
		case "V": case "v": return 180 * opacity;
		default: return 0;
		}
	};
	const attribute_list = (element) => Array
		.from(element.attributes)
		.filter(a => !geometryAttributes.attrs[element.nodeName][a.nodeName]);
	const objectifyAttributeList = function (list) {
		const obj = {};
		list.forEach((a) => { obj[a.nodeName] = a.value; });
		return obj;
	};
	const segmentize = (elements) => elements
		.filter(el => parsers[el.tagName])
		.flatMap(el => parsers[el.tagName](el)
			.map(segment => ({
				nodeName: el.tagName,
				segment,
				attributes: objectifyAttributeList(attribute_list(el)),
			})));
	const svgToBasicGraph = (svg) => {
		const typeString = typeof svg === "string";
		const xml = typeString ? xmlStringToDOM(svg, "image/svg+xml") : svg;
		const elements = flattenDomTree(xml);
		const stylesheets = elements
			.filter(el => el.nodeName === "style")
			.map(parseStyleElement);
		const result = segmentize(elements);
		const edges_assignment = result
			.map(el => getAttributeValue(
				"stroke",
				el.nodeName,
				el.attributes,
				stylesheets,
			) || "black")
			.map(color => colorToAssignment(color));
		const edges_foldAngle = result
			.map(el => getAttributeValue(
				"opacity",
				el.nodeName,
				el.attributes,
				stylesheets,
			) || "1")
			.map((opacity, i) => opacityToFoldAngle(opacity, edges_assignment[i]));
		const vertices_coords = result
			.map(el => el.segment)
			.flatMap(s => [[s[0], s[1]], [s[2], s[3]]]);
		const edges_vertices = result
			.map((_, i) => [i * 2, i * 2 + 1]);
		return {
			vertices_coords,
			edges_vertices,
			edges_assignment,
			edges_foldAngle,
		};
	};
	const planarizeGraph = (graph) => {
		const planar = { ...graph };
		removeDuplicateVertices(planar);
		fragment(planar);
		planar.vertices_vertices = makeVerticesVertices(planar);
		const faces = makePlanarFaces(planar);
		planar.faces_vertices = faces.map(el => el.vertices);
		planar.faces_edges = faces.map(el => el.edges);
		const { edges } = planarBoundary(planar);
		edges.forEach(e => { planar.edges_assignment[e] = "B"; });
		return planar;
	};
	const svgToFold = (svg) => {
		const graph = svgToBasicGraph(svg);
		const planarGraph = planarizeGraph(graph);
		return {
			file_spec: 1.1,
			file_creator: "Rabbit Ear",
			frame_classes: ["creasePattern"],
			...planarGraph,
		};
	};

	var convert = {
		objToFold,
		opxToFold: opxToFOLD,
		svgToFold,
	};

	const use = function (library) {
		if (library == null || typeof library.linker !== "function") {
			return;
		}
		library.linker(this);
	};

	const verticesCircle = (graph, attributes = {}) => {
		const g = root.svg.g();
		if (!graph || !graph.vertices_coords) { return g; }
		graph.vertices_coords
			.map(v => root.svg.circle(v[0], v[1], 0.01))
			.forEach(v => g.appendChild(v));
		g.setAttributeNS(null, "fill", _none);
		Object.keys(attributes)
			.forEach(attr => g.setAttributeNS(null, attr, attributes[attr]));
		return g;
	};

	const addClassToClassList = (el, ...classes) => {
		if (!el) { return; }
		const hash = {};
		const getClass = el.getAttribute("class");
		const classArray = getClass ? getClass.split(" ") : [];
		classArray.push(...classes);
		classArray.forEach(str => { hash[str] = true; });
		const classString = Object.keys(hash).join(" ");
		el.setAttribute("class", classString);
	};

	const GROUP_FOLDED = {};
	const GROUP_FLAT = {
		stroke: _black,
	};
	const STYLE_FOLDED = {};
	const STYLE_FLAT = {
		M: { stroke: "red" },
		m: { stroke: "red" },
		V: { stroke: "blue" },
		v: { stroke: "blue" },
		F: { stroke: "lightgray" },
		f: { stroke: "lightgray" },
	};
	const edgesAssignmentIndices = (graph) => {
		const assignment_indices = {
			u: [], f: [], v: [], m: [], b: [],
		};
		const lowercase_assignment = graph[_edges_assignment]
			.map(a => a.toLowerCase());
		graph[_edges_vertices]
			.map((_, i) => lowercase_assignment[i] || "u")
			.forEach((a, i) => assignment_indices[a].push(i));
		return assignment_indices;
	};
	const edgesCoords = ({ vertices_coords, edges_vertices }) => {
		if (!vertices_coords || !edges_vertices) { return []; }
		return edges_vertices.map(ev => ev.map(v => vertices_coords[v]));
	};
	const segmentToPath = s => `M${s[0][0]} ${s[0][1]}L${s[1][0]} ${s[1][1]}`;
	const edgesPathData = (graph) => edgesCoords(graph)
		.map(segment => segmentToPath(segment)).join("");
	const edgesPathDataAssign = ({ vertices_coords, edges_vertices, edges_assignment }) => {
		if (!vertices_coords || !edges_vertices) { return {}; }
		if (!edges_assignment) {
			return ({ u: edgesPathData({ vertices_coords, edges_vertices }) });
		}
		const data = edgesAssignmentIndices({ vertices_coords, edges_vertices, edges_assignment });
		Object.keys(data).forEach(key => {
			data[key] = edgesPathData({
				vertices_coords,
				edges_vertices: data[key].map(i => edges_vertices[i]),
			});
		});
		Object.keys(data).forEach(key => {
			if (data[key] === "") { delete data[key]; }
		});
		return data;
	};
	const edgesPathsAssign = ({ vertices_coords, edges_vertices, edges_assignment }) => {
		const data = edgesPathDataAssign({ vertices_coords, edges_vertices, edges_assignment });
		Object.keys(data).forEach(assignment => {
			const path = root.svg.path(data[assignment]);
			addClassToClassList(path, edgesAssignmentNames[assignment]);
			data[assignment] = path;
		});
		return data;
	};
	const applyEdgesStyle = (el, attributes = {}) => Object.keys(attributes)
		.forEach(key => el.setAttributeNS(null, key, attributes[key]));
	const edgesPaths = (graph, attributes = {}) => {
		const group = root.svg.g();
		if (!graph) { return group; }
		const isFolded = isFoldedForm(graph);
		const paths = edgesPathsAssign(graph);
		Object.keys(paths).forEach(key => {
			addClassToClassList(paths[key], edgesAssignmentNames[key]);
			applyEdgesStyle(paths[key], isFolded ? STYLE_FOLDED[key] : STYLE_FLAT[key]);
			applyEdgesStyle(paths[key], attributes[key]);
			applyEdgesStyle(paths[key], attributes[edgesAssignmentNames[key]]);
			group.appendChild(paths[key]);
			Object.defineProperty(group, edgesAssignmentNames[key], { get: () => paths[key] });
		});
		applyEdgesStyle(group, isFolded ? GROUP_FOLDED : GROUP_FLAT);
		applyEdgesStyle(group, attributes.stroke ? { stroke: attributes.stroke } : {});
		return group;
	};
	const angleToOpacity = (foldAngle) => (Math.abs(foldAngle) / 180);
	const edgesLines = (graph, attributes = {}) => {
		const group = root.svg.g();
		if (!graph) { return group; }
		const isFolded = isFoldedForm(graph);
		const edges_assignment = (graph.edges_assignment
			? graph.edges_assignment
			: makeEdgesAssignment(graph))
			.map(assign => assign.toLowerCase());
		const groups_by_key = {};
		["b", "m", "v", "f", "u"].forEach(k => {
			const child_group = root.svg.g();
			group.appendChild(child_group);
			addClassToClassList(child_group, edgesAssignmentNames[k]);
			applyEdgesStyle(child_group, isFolded ? STYLE_FOLDED[k] : STYLE_FLAT[k]);
			applyEdgesStyle(child_group, attributes[edgesAssignmentNames[k]]);
			Object.defineProperty(group, edgesAssignmentNames[k], {
				get: () => child_group,
			});
			groups_by_key[k] = child_group;
		});
		const lines = graph.edges_vertices
			.map(ev => ev.map(v => graph.vertices_coords[v]))
			.map(l => root.svg.line(l[0][0], l[0][1], l[1][0], l[1][1]));
		if (graph.edges_foldAngle) {
			lines.forEach((line, i) => {
				const angle = graph.edges_foldAngle[i];
				if (angle === 0 || angle === 180 || angle === -180) { return; }
				line.setAttributeNS(null, "opacity", angleToOpacity(angle));
			});
		}
		lines.forEach((line, i) => groups_by_key[edges_assignment[i]]
			.appendChild(line));
		applyEdgesStyle(group, isFolded ? GROUP_FOLDED : GROUP_FLAT);
		applyEdgesStyle(group, attributes.stroke ? { stroke: attributes.stroke } : {});
		return group;
	};
	const drawEdges = (graph, attributes) => (
		edgesFoldAngleAreAllFlat(graph)
			? edgesPaths(graph, attributes)
			: edgesLines(graph, attributes)
	);

	const FACE_STYLE_FOLDED_ORDERED = {
		back: { fill: _white },
		front: { fill: "#ddd" },
	};
	const FACE_STYLE_FOLDED_UNORDERED = {
		back: { opacity: 0.1 },
		front: { opacity: 0.1 },
	};
	const FACE_STYLE_FLAT = {
	};
	const GROUP_STYLE_FOLDED_ORDERED = {
		stroke: _black,
		"stroke-linejoin": "bevel",
	};
	const GROUP_STYLE_FOLDED_UNORDERED = {
		stroke: _none,
		fill: _black,
		"stroke-linejoin": "bevel",
	};
	const GROUP_STYLE_FLAT = {
		fill: _none,
	};
	const faces_sorted_by_layer = function (faces_layer, graph) {
		const faceCount = graph.faces_vertices.length || graph.faces_edges.length;
		const missingFaces = Array.from(Array(faceCount))
			.map((_, i) => i)
			.filter(i => faces_layer[i] == null);
		return missingFaces.concat(invertMap(faces_layer));
	};
	const applyFacesStyle = (el, attributes = {}) => Object.keys(attributes)
		.forEach(key => el.setAttributeNS(null, key, attributes[key]));
	const finalize_faces = (graph, svg_faces, group, attributes) => {
		const isFolded = isFoldedForm(graph);
		const orderIsCertain = graph[_faces_layer] != null;
		const classNames = [[_front], [_back]];
		const faces_winding = makeFacesWinding(graph);
		faces_winding.map(w => (w ? classNames[0] : classNames[1]))
			.forEach((className, i) => {
				addClassToClassList(svg_faces[i], className);
				applyFacesStyle(svg_faces[i], (isFolded
					? (orderIsCertain
						? FACE_STYLE_FOLDED_ORDERED[className]
						: FACE_STYLE_FOLDED_UNORDERED[className])
					: FACE_STYLE_FLAT[className]));
				applyFacesStyle(svg_faces[i], attributes[className]);
			});
		const facesInOrder = (orderIsCertain
			? faces_sorted_by_layer(graph[_faces_layer], graph).map(i => svg_faces[i])
			: svg_faces);
		facesInOrder.forEach(face => group.appendChild(face));
		Object.defineProperty(group, _front, {
			get: () => svg_faces.filter((_, i) => faces_winding[i]),
		});
		Object.defineProperty(group, _back, {
			get: () => svg_faces.filter((_, i) => !faces_winding[i]),
		});
		applyFacesStyle(group, (isFolded
			? (orderIsCertain
				? GROUP_STYLE_FOLDED_ORDERED
				: GROUP_STYLE_FOLDED_UNORDERED)
			: GROUP_STYLE_FLAT));
		return group;
	};
	const facesVerticesPolygon = (graph, attributes = {}) => {
		const g = root.svg.g();
		if (!graph || !graph.vertices_coords || !graph.faces_vertices) { return g; }
		const svg_faces = graph.faces_vertices
			.map(fv => fv.map(v => [0, 1].map(i => graph.vertices_coords[v][i])))
			.map(face => root.svg.polygon(face));
		svg_faces.forEach((face, i) => face.setAttributeNS(null, _index, i));
		g.setAttributeNS(null, "fill", _white);
		return finalize_faces(graph, svg_faces, g, attributes);
	};
	const facesEdgesPolygon = function (graph, attributes = {}) {
		const g = root.svg.g();
		if (!graph
			|| _faces_edges in graph === false
			|| _edges_vertices in graph === false
			|| _vertices_coords in graph === false) {
			return g;
		}
		const svg_faces = graph[_faces_edges]
			.map(face_edges => face_edges
				.map(edge => graph[_edges_vertices][edge])
				.map((vi, i, arr) => {
					const next = arr[(i + 1) % arr.length];
					return (vi[1] === next[0] || vi[1] === next[1] ? vi[0] : vi[1]);
				}).map(v => [0, 1].map(i => graph[_vertices_coords][v][i])))
			.map(face => root.svg.polygon(face));
		svg_faces.forEach((face, i) => face.setAttributeNS(null, _index, i));
		g.setAttributeNS(null, "fill", "white");
		return finalize_faces(graph, svg_faces, g, attributes);
	};

	const FOLDED = {
		fill: _none,
	};
	const FLAT = {
		stroke: _black,
		fill: _white,
	};
	const applyBoundariesStyle = (el, attributes = {}) => Object.keys(attributes)
		.forEach(key => el.setAttributeNS(null, key, attributes[key]));
	const boundariesPolygon = (graph, attributes = {}) => {
		const g = root.svg.g();
		if (!graph
			|| !graph.vertices_coords
			|| !graph.edges_vertices
			|| !graph.edges_assignment) {
			return g;
		}
		const b = boundary(graph)
			.vertices
			.map(v => [0, 1].map(i => graph.vertices_coords[v][i]));
		if (b.length === 0) { return g; }
		const poly = root.svg.polygon(b);
		addClassToClassList(poly, _boundary);
		g.appendChild(poly);
		applyBoundariesStyle(g, isFoldedForm(graph) ? FOLDED : FLAT);
		Object.keys(attributes)
			.forEach(attr => g.setAttributeNS(null, attr, attributes[attr]));
		return g;
	};

	const facesDrawFunction = (graph, options) => {
		if (graph && graph[_faces_vertices]) {
			return facesVerticesPolygon(graph, options);
		}
		if (graph && graph[_faces_edges]) {
			return facesEdgesPolygon(graph, options);
		}
		return root.svg.g();
	};
	const svg_draw_func = {
		vertices: verticesCircle,
		edges: drawEdges,
		faces: facesDrawFunction,
		boundaries: boundariesPolygon,
	};
	const drawGroup = (key, graph, options) => {
		const group = options === false ? (root.svg.g()) : svg_draw_func[key](graph, options);
		addClassToClassList(group, key);
		return group;
	};
	const DrawGroups = (graph, options = {}) => [
		_boundaries,
		_faces,
		_edges,
		_vertices].map(key => drawGroup(key, graph, options[key]));
	[_boundaries,
		_faces,
		_edges,
		_vertices,
	].forEach(key => {
		DrawGroups[key] = function (graph, options = {}) {
			return drawGroup(key, graph, options[key]);
		};
	});

	const linker = function (library) {
		library.graph.svg = this;
		const graphProtoMethods = {
			svg: this,
		};
		Object.keys(graphProtoMethods).forEach(key => {
			library.graph.prototype[key] = function () {
				return graphProtoMethods[key](this, ...arguments);
			};
		});
	};

	const DEFAULT_STROKE_WIDTH = 1 / 100;
	const DEFAULT_CIRCLE_RADIUS = 1 / 50;
	const getBoundingRect = ({ vertices_coords }) => {
		if (vertices_coords == null || vertices_coords.length === 0) {
			return undefined;
		}
		const min = Array(2).fill(Infinity);
		const max = Array(2).fill(-Infinity);
		vertices_coords.forEach(v => {
			if (v[0] < min[0]) { min[0] = v[0]; }
			if (v[0] > max[0]) { max[0] = v[0]; }
			if (v[1] < min[1]) { min[1] = v[1]; }
			if (v[1] > max[1]) { max[1] = v[1]; }
		});
		const invalid = Number.isNaN(min[0])
			|| Number.isNaN(min[1])
			|| Number.isNaN(max[0])
			|| Number.isNaN(max[1]);
		return (invalid
			? undefined
			: [min[0], min[1], max[0] - min[0], max[1] - min[1]]);
	};
	const getViewBox$1 = (graph) => {
		const viewBox = getBoundingRect(graph);
		return viewBox === undefined
			? ""
			: viewBox.join(" ");
	};
	const setR = (group, radius) => {
		for (let i = 0; i < group.childNodes.length; i += 1) {
			group.childNodes[i].setAttributeNS(null, "r", radius);
		}
	};
	const getTenthPercentLength = ({ vertices_coords, edges_vertices, edges_length }) => {
		if (!vertices_coords || !edges_vertices) {
			return undefined;
		}
		if (!edges_length) {
			edges_length = makeEdgesLength({ vertices_coords, edges_vertices });
		}
		const sortedLengths = edges_length
			.slice()
			.sort((a, b) => a - b);
		const index_tenth_percent = Math.floor(sortedLengths.length * 0.1);
		return sortedLengths[index_tenth_percent];
	};
	const findSVGInParents = (element) => {
		if ((element.nodeName || "").toUpperCase() === "SVG") { return element; }
		return element.parentNode ? findSVGInParents(element.parentNode) : undefined;
	};
	const applyTopLevelOptions = (element, groups, graph, options) => {
		const hasVertices = groups[3] && groups[3].childNodes.length;
		if (!(options.strokeWidth || options.viewBox || hasVertices)) { return; }
		const bounds = getBoundingRect(graph);
		const vmax = bounds ? Math.max(bounds[2], bounds[3]) : 1;
		const svgElement = findSVGInParents(element);
		if (svgElement && options.viewBox) {
			const viewBoxValue = bounds ? bounds.join(" ") : "0 0 1 1";
			svgElement.setAttributeNS(null, "viewBox", viewBoxValue);
		}
		if (svgElement && options.padding) {
			const viewBoxString = svgElement.getAttribute("viewBox");
			if (viewBoxString != null) {
				const pad = options.padding * vmax;
				const viewBox = viewBoxString.split(" ").map(n => parseFloat(n));
				const newViewBox = [-pad, -pad, pad * 2, pad * 2]
					.map((nudge, i) => viewBox[i] + nudge)
					.join(" ");
				svgElement.setAttributeNS(null, "viewBox", newViewBox);
			}
		}
		if (options.strokeWidth || options["stroke-width"]) {
			const strokeWidth = options.strokeWidth
				? options.strokeWidth
				: options["stroke-width"];
			const lengthBased = getTenthPercentLength(graph);
			let strokeWidthValue;
			if (lengthBased) {
				strokeWidthValue = typeof strokeWidth === "number"
					? 10 * lengthBased * strokeWidth
					: 10 * lengthBased * DEFAULT_STROKE_WIDTH;
			} else {
				strokeWidthValue = typeof strokeWidth === "number"
					? vmax * strokeWidth
					: vmax * DEFAULT_STROKE_WIDTH;
			}
			element.setAttributeNS(null, "stroke-width", strokeWidthValue);
		}
		if (hasVertices) {
			const userRadius = options.vertices && options.vertices.radius != null
				? options.vertices.radius
				: options.radius;
			const radius = typeof userRadius === "string" ? parseFloat(userRadius) : userRadius;
			const r = typeof radius === "number" && !Number.isNaN(radius)
				? vmax * radius
				: vmax * DEFAULT_CIRCLE_RADIUS;
			setR(groups[3], r);
		}
	};
	const applyTopLevelClasses = (element, graph) => {
		const newClasses = [
			graph.file_classes || [],
			graph.frame_classes || [],
		].flat();
		if (newClasses.length) {
			addClassToClassList(element, ...newClasses);
		}
	};
	const drawInto = (element, graph, options = {}) => {
		const groups = DrawGroups(graph, options);
		groups.filter(group => group.childNodes.length > 0)
			.forEach(group => element.appendChild(group));
		applyTopLevelOptions(element, groups, graph, options);
		applyTopLevelClasses(element, graph);
		Object.keys(DrawGroups)
			.map((key, i) => ({ key, i }))
			.filter(el => element[el.key] == null)
			.forEach(el => Object.defineProperty(element, el.key, { get: () => groups[el.i] }));
		return element;
	};
	const FOLDtoSVG = (graph, options) => drawInto(root.svg(), graph, options);
	Object.keys(DrawGroups).forEach(key => { FOLDtoSVG[key] = DrawGroups[key]; });
	FOLDtoSVG.drawInto = drawInto;
	FOLDtoSVG.getViewBox = getViewBox$1;
	Object.defineProperty(FOLDtoSVG, "linker", {
		enumerable: false,
		value: linker.bind(FOLDtoSVG),
	});

	const SVG_Constructor = {
		init: () => {},
	};
	function SVG () {
		return SVG_Constructor.init(...arguments);
	}
	const str_class = "class";
	const str_function = "function";
	const str_undefined = "undefined";
	const str_boolean = "boolean";
	const str_number = "number";
	const str_string = "string";
	const str_object = "object";
	const str_svg = "svg";
	const str_path = "path";
	const str_id = "id";
	const str_style = "style";
	const str_viewBox = "viewBox";
	const str_transform = "transform";
	const str_points = "points";
	const str_stroke = "stroke";
	const str_fill = "fill";
	const str_none = "none";
	const str_arrow = "arrow";
	const str_head = "head";
	const str_tail = "tail";
	const isBrowser = typeof window !== str_undefined
		&& typeof window.document !== str_undefined;
	const isNode = typeof process !== str_undefined
		&& process.versions != null
		&& process.versions.node != null;
	const svgErrors = [];
	svgErrors[10] = "\"error 010: window\" not set. if using node/deno, include package @xmldom/xmldom, set to the main export ( ear.window = xmldom; )";
	const svgWindowContainer = { window: undefined };
	const buildHTMLDocument = (newWindow) => new newWindow.DOMParser()
		.parseFromString("<!DOCTYPE html><title>.</title>", "text/html");
	const setWindow = (newWindow) => {
		if (!newWindow.document) { newWindow.document = buildHTMLDocument(newWindow); }
		svgWindowContainer.window = newWindow;
		return svgWindowContainer.window;
	};
	if (isBrowser) { svgWindowContainer.window = window; }
	const SVGWindow = () => {
		if (svgWindowContainer.window === undefined) {
			throw svgErrors[10];
		}
		return svgWindowContainer.window;
	};
	var NS = "http://www.w3.org/2000/svg";
	var NodeNames = {
		s: [
			"svg",
		],
		d: [
			"defs",
		],
		h: [
			"desc",
			"filter",
			"metadata",
			"style",
			"script",
			"title",
			"view",
		],
		c: [
			"cdata",
		],
		g: [
			"g",
		],
		v: [
			"circle",
			"ellipse",
			"line",
			"path",
			"polygon",
			"polyline",
			"rect",
		],
		t: [
			"text",
		],
		i: [
			"marker",
			"symbol",
			"clipPath",
			"mask",
		],
		p: [
			"linearGradient",
			"radialGradient",
			"pattern",
		],
		cT: [
			"textPath",
			"tspan",
		],
		cG: [
			"stop",
		],
		cF: [
			"feBlend",
			"feColorMatrix",
			"feComponentTransfer",
			"feComposite",
			"feConvolveMatrix",
			"feDiffuseLighting",
			"feDisplacementMap",
			"feDistantLight",
			"feDropShadow",
			"feFlood",
			"feFuncA",
			"feFuncB",
			"feFuncG",
			"feFuncR",
			"feGaussianBlur",
			"feImage",
			"feMerge",
			"feMergeNode",
			"feMorphology",
			"feOffset",
			"fePointLight",
			"feSpecularLighting",
			"feSpotLight",
			"feTile",
			"feTurbulence",
		],
	};
	const svg_add2 = (a, b) => [a[0] + b[0], a[1] + b[1]];
	const svg_sub2 = (a, b) => [a[0] - b[0], a[1] - b[1]];
	const svg_scale2 = (a, s) => [a[0] * s, a[1] * s];
	const svg_magnitudeSq2 = (a) => (a[0] ** 2) + (a[1] ** 2);
	const svg_magnitude2 = (a) => Math.sqrt(svg_magnitudeSq2(a));
	const svg_distanceSq2 = (a, b) => svg_magnitudeSq2(svg_sub2(a, b));
	const svg_distance2 = (a, b) => Math.sqrt(svg_distanceSq2(a, b));
	const svg_polar_to_cart = (a, d) => [Math.cos(a) * d, Math.sin(a) * d];
	var svg_algebra = Object.freeze({
		__proto__: null,
		svg_add2: svg_add2,
		svg_sub2: svg_sub2,
		svg_scale2: svg_scale2,
		svg_magnitudeSq2: svg_magnitudeSq2,
		svg_magnitude2: svg_magnitude2,
		svg_distanceSq2: svg_distanceSq2,
		svg_distance2: svg_distance2,
		svg_polar_to_cart: svg_polar_to_cart
	});
	const arcPath = (x, y, radius, startAngle, endAngle, includeCenter = false) => {
		if (endAngle == null) { return ""; }
		const start = svg_polar_to_cart(startAngle, radius);
		const end = svg_polar_to_cart(endAngle, radius);
		const arcVec = [end[0] - start[0], end[1] - start[1]];
		const py = start[0] * end[1] - start[1] * end[0];
		const px = start[0] * end[0] + start[1] * end[1];
		const arcdir = (Math.atan2(py, px) > 0 ? 0 : 1);
		let d = (includeCenter
			? `M ${x},${y} l ${start[0]},${start[1]} `
			: `M ${x + start[0]},${y + start[1]} `);
		d += ["a ", radius, radius, 0, arcdir, 1, arcVec[0], arcVec[1]].join(" ");
		if (includeCenter) { d += " Z"; }
		return d;
	};
	const arcArguments = (a, b, c, d, e) => [arcPath(a, b, c, d, e, false)];
	var Arc = {
		arc: {
			nodeName: str_path,
			attributes: ["d"],
			args: arcArguments,
			methods: {
				setArc: (el, ...args) => el.setAttribute("d", arcArguments(...args)),
			},
		},
	};
	const wedgeArguments = (a, b, c, d, e) => [arcPath(a, b, c, d, e, true)];
	var Wedge = {
		wedge: {
			nodeName: str_path,
			args: wedgeArguments,
			attributes: ["d"],
			methods: {
				setArc: (el, ...args) => el.setAttribute("d", wedgeArguments(...args)),
			},
		},
	};
	const COUNT = 128;
	const parabolaArguments = (x = -1, y = 0, width = 2, height = 1) => Array
		.from(Array(COUNT + 1))
		.map((_, i) => ((i - (COUNT)) / COUNT) * 2 + 1)
		.map(i => [
			x + (i + 1) * width * 0.5,
			y + (i ** 2) * height,
		]);
	const parabolaPathString = (a, b, c, d) => [
		parabolaArguments(a, b, c, d).map(n => `${n[0]},${n[1]}`).join(" "),
	];
	var Parabola = {
		parabola: {
			nodeName: "polyline",
			attributes: [str_points],
			args: parabolaPathString
		}
	};
	const regularPolygonArguments = (sides, cX, cY, radius) => {
		const origin = [cX, cY];
		return Array.from(Array(sides))
			.map((el, i) => 2 * Math.PI * (i / sides))
			.map(a => [Math.cos(a), Math.sin(a)])
			.map(pts => origin.map((o, i) => o + radius * pts[i]));
	};
	const polygonPathString = (sides, cX = 0, cY = 0, radius = 1) => [
		regularPolygonArguments(sides, cX, cY, radius)
			.map(a => `${a[0]},${a[1]}`).join(" "),
	];
	var RegularPolygon = {
		regularPolygon: {
			nodeName: "polygon",
			attributes: [str_points],
			args: polygonPathString,
		},
	};
	const roundRectArguments = (x, y, width, height, cornerRadius = 0) => {
		if (cornerRadius > width / 2) { cornerRadius = width / 2; }
		if (cornerRadius > height / 2) { cornerRadius = height / 2; }
		const w = width - cornerRadius * 2;
		const h = height - cornerRadius * 2;
		const s = `A${cornerRadius} ${cornerRadius} 0 0 1`;
		return [[`M${x + (width - w) / 2},${y}`, `h${w}`, s, `${x + width},${y + (height - h) / 2}`, `v${h}`, s, `${x + width - cornerRadius},${y + height}`, `h${-w}`, s, `${x},${y + height - cornerRadius}`, `v${-h}`, s, `${x + cornerRadius},${y}`].join(" ")];
	};
	var RoundRect = {
		roundRect: {
			nodeName: str_path,
			attributes: ["d"],
			args: roundRectArguments,
		},
	};
	var Case = {
		toCamel: s => s
			.replace(/([-_][a-z])/ig, $1 => $1
				.toUpperCase()
				.replace("-", "")
				.replace("_", "")),
		toKebab: s => s
			.replace(/([a-z0-9])([A-Z])/g, "$1-$2")
			.replace(/([A-Z])([A-Z])(?=[a-z])/g, "$1-$2")
			.toLowerCase(),
		capitalized: s => s
			.charAt(0).toUpperCase() + s.slice(1),
	};
	const svg_is_iterable = (obj) => obj != null && typeof obj[Symbol.iterator] === str_function;
	const svg_semi_flatten_arrays = function () {
		switch (arguments.length) {
		case undefined:
		case 0: return Array.from(arguments);
		case 1: return svg_is_iterable(arguments[0]) && typeof arguments[0] !== str_string
			? svg_semi_flatten_arrays(...arguments[0])
			: [arguments[0]];
		default:
			return Array.from(arguments).map(a => (svg_is_iterable(a)
				? [...svg_semi_flatten_arrays(a)]
				: a));
		}
	};
	var coordinates = (...args) => args
		.filter(a => typeof a === str_number)
		.concat(args
			.filter(a => typeof a === str_object && a !== null)
			.map((el) => {
				if (typeof el.x === str_number) { return [el.x, el.y]; }
				if (typeof el[0] === str_number) { return [el[0], el[1]]; }
				return undefined;
			}).filter(a => a !== undefined)
			.reduce((a, b) => a.concat(b), []));
	const ends = [str_tail, str_head];
	const stringifyPoint = p => p.join(",");
	const pointsToPath = (points) => "M" + points.map(pt => pt.join(",")).join("L") + "Z";
	const makeArrowPaths = function (options) {
		let pts = [[0,1], [2,3]].map(pt => pt.map(i => options.points[i] || 0));
		let vector = svg_sub2(pts[1], pts[0]);
		let midpoint = svg_add2(pts[0], svg_scale2(vector, 0.5));
		const len = svg_magnitude2(vector);
		const minLength = ends
			.map(s => (options[s].visible
				? (1 + options[s].padding) * options[s].height * 2.5
				: 0))
			.reduce((a, b) => a + b, 0);
		if (len < minLength) {
			const minVec = len === 0 ? [minLength, 0] : svg_scale2(vector, minLength / len);
			pts = [svg_sub2, svg_add2].map(f => f(midpoint, svg_scale2(minVec, 0.5)));
			vector = svg_sub2(pts[1], pts[0]);
		}
		let perpendicular = [vector[1], -vector[0]];
		let bezPoint = svg_add2(midpoint, svg_scale2(perpendicular, options.bend));
		const bezs = pts.map(pt => svg_sub2(bezPoint, pt));
		const bezsLen = bezs.map(v => svg_magnitude2(v));
		const bezsNorm = bezs.map((bez, i) => bezsLen[i] === 0
			? bez
			: svg_scale2(bez, 1 / bezsLen[i]));
		const vectors = bezsNorm.map(norm => svg_scale2(norm, -1));
		const normals = vectors.map(vec => [vec[1], -vec[0]]);
		const pad = ends.map((s, i) => options[s].padding
			? options[s].padding
			: (options.padding ? options.padding : 0.0));
		const scales = ends
			.map((s, i) => options[s].height * (options[s].visible ? 1 : 0))
			.map((n, i) => n + pad[i]);
		const arcs = pts.map((pt, i) => svg_add2(pt, svg_scale2(bezsNorm[i], scales[i])));
		vector = svg_sub2(arcs[1], arcs[0]);
		perpendicular = [vector[1], -vector[0]];
		midpoint = svg_add2(arcs[0], svg_scale2(vector, 0.5));
		bezPoint = svg_add2(midpoint, svg_scale2(perpendicular, options.bend));
		const controls = arcs
			.map((arc, i) => svg_add2(arc, svg_scale2(svg_sub2(bezPoint, arc), options.pinch)));
		const polyPoints = ends.map((s, i) => [
			svg_add2(arcs[i], svg_scale2(vectors[i], options[s].height)),
			svg_add2(arcs[i], svg_scale2(normals[i], options[s].width / 2)),
			svg_add2(arcs[i], svg_scale2(normals[i], -options[s].width / 2)),
		]);
		return {
			line: `M${stringifyPoint(arcs[0])}C${stringifyPoint(controls[0])},${stringifyPoint(controls[1])},${stringifyPoint(arcs[1])}`,
			tail: pointsToPath(polyPoints[0]),
			head: pointsToPath(polyPoints[1]),
		};
	};
	const setArrowheadOptions = (element, options, which) => {
		if (typeof options === str_boolean) {
			element.options[which].visible = options;
		} else if (typeof options === str_object) {
			Object.assign(element.options[which], options);
			if (options.visible == null) {
				element.options[which].visible = true;
			}
		} else if (options == null) {
			element.options[which].visible = true;
		}
	};
	const setArrowStyle = (element, options = {}, which = str_head) => {
		const path = element.getElementsByClassName(`${str_arrow}-${which}`)[0];
		Object.keys(options)
			.map(key => ({ key, fn: path[Case.toCamel(key)] }))
			.filter(el => typeof el.fn === str_function && el.key !== "class")
			.forEach(el => el.fn(options[el.key]));
		Object.keys(options)
			.filter(key => key === "class")
			.forEach(key => path.classList.add(options[key]));
	};
	const redraw = (element) => {
		const paths = makeArrowPaths(element.options);
		Object.keys(paths)
			.map(path => ({
				path,
				element: element.getElementsByClassName(`${str_arrow}-${path}`)[0],
			}))
			.filter(el => el.element)
			.map(el => { el.element.setAttribute("d", paths[el.path]); return el; })
			.filter(el => element.options[el.path])
			.forEach(el => el.element.setAttribute(
				"visibility",
				element.options[el.path].visible
					? "visible"
					: "hidden",
			));
		return element;
	};
	const setPoints$3 = (element, ...args) => {
		element.options.points = coordinates(...svg_semi_flatten_arrays(...args)).slice(0, 4);
		return redraw(element);
	};
	const bend$1 = (element, amount) => {
		element.options.bend = amount;
		return redraw(element);
	};
	const pinch$1 = (element, amount) => {
		element.options.pinch = amount;
		return redraw(element);
	};
	const padding = (element, amount) => {
		element.options.padding = amount;
		return redraw(element);
	};
	const head = (element, options) => {
		setArrowheadOptions(element, options, str_head);
		setArrowStyle(element, options, str_head);
		return redraw(element);
	};
	const tail = (element, options) => {
		setArrowheadOptions(element, options, str_tail);
		setArrowStyle(element, options, str_tail);
		return redraw(element);
	};
	const getLine = element => element.getElementsByClassName(`${str_arrow}-line`)[0];
	const getHead = element => element.getElementsByClassName(`${str_arrow}-${str_head}`)[0];
	const getTail = element => element.getElementsByClassName(`${str_arrow}-${str_tail}`)[0];
	var ArrowMethods = {
		setPoints: setPoints$3,
		points: setPoints$3,
		bend: bend$1,
		pinch: pinch$1,
		padding,
		head,
		tail,
		getLine,
		getHead,
		getTail,
	};
	const endOptions = () => ({
		visible: false,
		width: 8,
		height: 10,
		padding: 0.0,
	});
	const makeArrowOptions = () => ({
		head: endOptions(),
		tail: endOptions(),
		bend: 0.0,
		padding: 0.0,
		pinch: 0.618,
		points: [],
	});
	const arrowKeys = Object.keys(makeArrowOptions());
	const matchingOptions = (...args) => {
		for (let a = 0; a < args.length; a += 1) {
			if (typeof args[a] !== str_object) { continue; }
			const keys = Object.keys(args[a]);
			for (let i = 0; i < keys.length; i += 1) {
				if (arrowKeys.includes(keys[i])) {
					return args[a];
				}
			}
		}
		return undefined;
	};
	const init = function (element, ...args) {
		element.classList.add(str_arrow);
		const paths = ["line", str_tail, str_head]
			.map(key => SVG.path().addClass(`${str_arrow}-${key}`).appendTo(element));
		paths[0].setAttribute(str_style, "fill:none;");
		paths[1].setAttribute(str_stroke, str_none);
		paths[2].setAttribute(str_stroke, str_none);
		element.options = makeArrowOptions();
		ArrowMethods.setPoints(element, ...args);
		const options = matchingOptions(...args);
		if (options) {
			Object.keys(options)
				.filter(key => ArrowMethods[key])
				.forEach(key => ArrowMethods[key](element, options[key]));
		}
		return element;
	};
	var Arrow = {
		arrow: {
			nodeName: "g",
			attributes: [],
			args: () => [],
			methods: ArrowMethods,
			init,
		},
	};
	const svg_flatten_arrays = function () {
		return svg_semi_flatten_arrays(arguments).reduce((a, b) => a.concat(b), []);
	};
	const makeCurvePath = (endpoints = [], bend = 0, pinch = 0.5) => {
		const tailPt = [endpoints[0] || 0, endpoints[1] || 0];
		const headPt = [endpoints[2] || 0, endpoints[3] || 0];
		const vector = svg_sub2(headPt, tailPt);
		const midpoint = svg_add2(tailPt, svg_scale2(vector, 0.5));
		const perpendicular = [vector[1], -vector[0]];
		const bezPoint = svg_add2(midpoint, svg_scale2(perpendicular, bend));
		const tailControl = svg_add2(tailPt, svg_scale2(svg_sub2(bezPoint, tailPt), pinch));
		const headControl = svg_add2(headPt, svg_scale2(svg_sub2(bezPoint, headPt), pinch));
		return `M${tailPt[0]},${tailPt[1]}C${tailControl[0]},${tailControl[1]} ${headControl[0]},${headControl[1]} ${headPt[0]},${headPt[1]}`;
	};
	const curveArguments = (...args) => [
		makeCurvePath(coordinates(...svg_flatten_arrays(...args))),
	];
	const getNumbersFromPathCommand = str => str
		.slice(1)
		.split(/[, ]+/)
		.map(s => parseFloat(s));
	const getCurveTos = d => d
		.match(/[Cc][(0-9), .-]+/)
		.map(curve => getNumbersFromPathCommand(curve));
	const getMoveTos = d => d
		.match(/[Mm][(0-9), .-]+/)
		.map(curve => getNumbersFromPathCommand(curve));
	const getCurveEndpoints = (d) => {
		const move = getMoveTos(d).shift();
		const curve = getCurveTos(d).shift();
		const start = move
			? [move[move.length - 2], move[move.length - 1]]
			: [0, 0];
		const end = curve
			? [curve[curve.length - 2], curve[curve.length - 1]]
			: [0, 0];
		return [...start, ...end];
	};
	const setPoints$2 = (element, ...args) => {
		const coords = coordinates(...svg_flatten_arrays(...args)).slice(0, 4);
		element.setAttribute("d", makeCurvePath(coords, element._bend, element._pinch));
		return element;
	};
	const bend = (element, amount) => {
		element._bend = amount;
		return setPoints$2(element, ...getCurveEndpoints(element.getAttribute("d")));
	};
	const pinch = (element, amount) => {
		element._pinch = amount;
		return setPoints$2(element, ...getCurveEndpoints(element.getAttribute("d")));
	};
	var curve_methods = {
		setPoints: setPoints$2,
		bend,
		pinch,
	};
	var Curve = {
		curve: {
			nodeName: str_path,
			attributes: ["d"],
			args: curveArguments,
			methods: curve_methods,
		},
	};
	const nodes = {};
	Object.assign(
		nodes,
		Arc,
		Wedge,
		Parabola,
		RegularPolygon,
		RoundRect,
		Arrow,
		Curve,
	);
	const customPrimitives = Object.keys(nodes);
	const headerStuff = [NodeNames.h, NodeNames.p, NodeNames.i];
	const drawingShapes = [NodeNames.g, NodeNames.v, NodeNames.t, customPrimitives];
	const folders = {
		svg: [NodeNames.s, NodeNames.d].concat(headerStuff).concat(drawingShapes),
		g: drawingShapes,
		text: [NodeNames.cT],
		linearGradient: [NodeNames.cG],
		radialGradient: [NodeNames.cG],
		defs: headerStuff,
		filter: [NodeNames.cF],
		marker: drawingShapes,
		symbol: drawingShapes,
		clipPath: drawingShapes,
		mask: drawingShapes,
	};
	const nodesAndChildren = Object.create(null);
	Object.keys(folders).forEach((key) => {
		nodesAndChildren[key] = folders[key].reduce((a, b) => a.concat(b), []);
	});
	const viewBoxValue = function (x, y, width, height, padding = 0) {
		const scale = 1.0;
		const d = (width / scale) - width;
		const X = (x - d) - padding;
		const Y = (y - d) - padding;
		const W = (width + d * 2) + padding * 2;
		const H = (height + d * 2) + padding * 2;
		return [X, Y, W, H].join(" ");
	};
	function viewBox$1 () {
		const numbers = coordinates(...svg_flatten_arrays(arguments));
		if (numbers.length === 2) { numbers.unshift(0, 0); }
		return numbers.length === 4 ? viewBoxValue(...numbers) : undefined;
	}
	const cdata = (textContent) => (new (SVGWindow()).DOMParser())
		.parseFromString("<root></root>", "text/xml")
		.createCDATASection(`${textContent}`);
	const removeChildren = (element) => {
		while (element.lastChild) {
			element.removeChild(element.lastChild);
		}
		return element;
	};
	const appendTo = (element, parent) => {
		if (parent != null) {
			parent.appendChild(element);
		}
		return element;
	};
	const setAttributes = (element, attrs) => Object.keys(attrs)
		.forEach(key => element.setAttribute(Case.toKebab(key), attrs[key]));
	const moveChildren = (target, source) => {
		while (source.childNodes.length > 0) {
			const node = source.childNodes[0];
			source.removeChild(node);
			target.appendChild(node);
		}
		return target;
	};
	const clearSVG = (element) => {
		Array.from(element.attributes)
			.filter(a => a !== "xmlns")
			.forEach(attr => element.removeAttribute(attr.name));
		return removeChildren(element);
	};
	const assignSVG = (target, source) => {
		Array.from(source.attributes)
			.forEach(attr => target.setAttribute(attr.name, attr.value));
		return moveChildren(target, source);
	};
	var dom = {
		removeChildren,
		appendTo,
		setAttributes,
	};
	const filterWhitespaceNodes = (node) => {
		if (node === null) { return node; }
		for (let i = node.childNodes.length - 1; i >= 0; i -= 1) {
			const child = node.childNodes[i];
			if (child.nodeType === 3 && child.data.match(/^\s*$/)) {
				node.removeChild(child);
			}
			if (child.nodeType === 1) {
				filterWhitespaceNodes(child);
			}
		}
		return node;
	};
	const parse = string => (new (SVGWindow()).DOMParser())
		.parseFromString(string, "text/xml");
	const checkParseError = xml => {
		const parserErrors = xml.getElementsByTagName("parsererror");
		if (parserErrors.length > 0) {
			throw new Error(parserErrors[0]);
		}
		return filterWhitespaceNodes(xml.documentElement);
	};
	const async = function (input) {
		return new Promise((resolve, reject) => {
			if (typeof input === str_string || input instanceof String) {
				fetch(input)
					.then(response => response.text())
					.then(str => checkParseError(parse(str)))
					.then(xml => (xml.nodeName === str_svg
						? xml
						: xml.getElementsByTagName(str_svg)[0]))
					.then(svg => (svg == null
						? reject(new Error("valid XML found, but no SVG element"))
						: resolve(svg)))
					.catch(err => reject(err));
			} else if (input instanceof SVGWindow().Document) {
				return asyncDone(input);
			}
		});
	};
	const sync = function (input) {
		if (typeof input === str_string || input instanceof String) {
			try {
				return checkParseError(parse(input));
			} catch (error) {
				return error;
			}
		}
		if (input.childNodes != null) {
			return input;
		}
	};
	const isFilename = input => typeof input === str_string
		&& /^[\w,\s-]+\.[A-Za-z]{3}$/.test(input)
		&& input.length < 10000;
	const Load = input => (isFilename(input)
		&& isBrowser
		&& typeof SVGWindow().fetch === str_function
		? async(input)
		: sync(input));
	function vkXML (text, step) {
	  const ar = text.replace(/>\s{0,}</g, "><")
	    .replace(/</g, "~::~<")
	    .replace(/\s*xmlns\:/g, "~::~xmlns:")
	    .split("~::~");
	  const len = ar.length;
	  let inComment = false;
	  let deep = 0;
	  let str = "";
	  const space = (step != null && typeof step === "string" ? step : "\t");
	  const shift = ["\n"];
	  for (let si = 0; si < 100; si += 1) {
	    shift.push(shift[si] + space);
	  }
	  for (let ix = 0; ix < len; ix += 1) {
	    if (ar[ix].search(/<!/) > -1) {
	      str += shift[deep] + ar[ix];
	      inComment = true;
	      if (ar[ix].search(/-->/) > -1 || ar[ix].search(/\]>/) > -1
	        || ar[ix].search(/!DOCTYPE/) > -1) {
	        inComment = false;
	      }
	    } else if (ar[ix].search(/-->/) > -1 || ar[ix].search(/\]>/) > -1) {
	      str += ar[ix];
	      inComment = false;
	    } else if (/^<\w/.exec(ar[ix - 1]) && /^<\/\w/.exec(ar[ix])
	      && /^<[\w:\-\.\,]+/.exec(ar[ix - 1])
	      == /^<\/[\w:\-\.\,]+/.exec(ar[ix])[0].replace("/", "")) {
	      str += ar[ix];
	      if (!inComment) { deep -= 1; }
	    } else if (ar[ix].search(/<\w/) > -1 && ar[ix].search(/<\//) === -1
	      && ar[ix].search(/\/>/) === -1) {
	      str = !inComment ? str += shift[deep++] + ar[ix] : str += ar[ix];
	    } else if (ar[ix].search(/<\w/) > -1 && ar[ix].search(/<\//) > -1) {
	      str = !inComment ? str += shift[deep] + ar[ix] : str += ar[ix];
	    } else if (ar[ix].search(/<\//) > -1) {
	      str = !inComment ? str += shift[--deep] + ar[ix] : str += ar[ix];
	    } else if (ar[ix].search(/\/>/) > -1) {
	      str = !inComment ? str += shift[deep] + ar[ix] : str += ar[ix];
	    } else if (ar[ix].search(/<\?/) > -1) {
	      str += shift[deep] + ar[ix];
	    } else if (ar[ix].search(/xmlns\:/) > -1 || ar[ix].search(/xmlns\=/) > -1) {
	      str += shift[deep] + ar[ix];
	    } else {
	      str += ar[ix];
	    }
	  }
	  return (str[0] === "\n") ? str.slice(1) : str;
	}
	const SAVE_OPTIONS = () => ({
		download: false,
		output: str_string,
		windowStyle: false,
		filename: "image.svg",
	});
	const getWindowStylesheets = function () {
		const css = [];
		if (SVGWindow().document.styleSheets) {
			for (let s = 0; s < SVGWindow().document.styleSheets.length; s += 1) {
				const sheet = SVGWindow().document.styleSheets[s];
				try {
					const rules = ("cssRules" in sheet) ? sheet.cssRules : sheet.rules;
					for (let r = 0; r < rules.length; r += 1) {
						const rule = rules[r];
						if ("cssText" in rule) {
							css.push(rule.cssText);
						} else {
							css.push(`${rule.selectorText} {\n${rule.style.cssText}\n}\n`);
						}
					}
				} catch (error) {
					console.warn(error);
				}
			}
		}
		return css.join("\n");
	};
	const downloadInBrowser = function (filename, contentsAsString) {
		const blob = new (SVGWindow()).Blob([contentsAsString], { type: "text/plain" });
		const a = SVGWindow().document.createElement("a");
		a.setAttribute("href", SVGWindow().URL.createObjectURL(blob));
		a.setAttribute("download", filename);
		SVGWindow().document.body.appendChild(a);
		a.click();
		SVGWindow().document.body.removeChild(a);
	};
	const save = function (svg, options) {
		options = Object.assign(SAVE_OPTIONS(), options);
		if (options.windowStyle) {
			const styleContainer = SVGWindow().document.createElementNS(NS, str_style);
			styleContainer.setAttribute("type", "text/css");
			styleContainer.innerHTML = getWindowStylesheets();
			svg.appendChild(styleContainer);
		}
		const source = (new (SVGWindow()).XMLSerializer()).serializeToString(svg);
		const formattedString = vkXML(source);
		if (options.download && isBrowser && !isNode) {
			downloadInBrowser(options.filename, formattedString);
		}
		return (options.output === str_svg ? svg : formattedString);
	};
	const setViewBox = (element, ...args) => {
		const viewBox = args.length === 1 && typeof args[0] === str_string
			? args[0]
			: viewBox$1(...args);
		if (viewBox) {
			element.setAttribute(str_viewBox, viewBox);
		}
		return element;
	};
	const getViewBox = function (element) {
		const vb = element.getAttribute(str_viewBox);
		return (vb == null
			? undefined
			: vb.split(" ").map(n => parseFloat(n)));
	};
	const convertToViewBox = function (svg, x, y) {
		const pt = svg.createSVGPoint();
		pt.x = x;
		pt.y = y;
		const svgPoint = pt.matrixTransform(svg.getScreenCTM().inverse());
		return [svgPoint.x, svgPoint.y];
	};
	var viewBox = Object.freeze({
		__proto__: null,
		setViewBox: setViewBox,
		getViewBox: getViewBox,
		convertToViewBox: convertToViewBox
	});
	const loadSVG = (target, data) => {
		const result = Load(data);
		if (result == null) { return; }
		return (typeof result.then === str_function)
			? result.then(svg => assignSVG(target, svg))
			: assignSVG(target, result);
	};
	const getFrame = function (element) {
		const viewBox = getViewBox(element);
		if (viewBox !== undefined) {
			return viewBox;
		}
		if (typeof element.getBoundingClientRect === str_function) {
			const rr = element.getBoundingClientRect();
			return [rr.x, rr.y, rr.width, rr.height];
		}
		return [];
	};
	const setPadding = function (element, padding) {
		const viewBox = getViewBox(element);
		if (viewBox !== undefined) {
			setViewBox(element, ...[-padding, -padding, padding * 2, padding * 2]
				.map((nudge, i) => viewBox[i] + nudge));
		}
		return element;
	};
	const bgClass = "svg-background-rectangle";
	const background = function (element, color) {
		let backRect = Array.from(element.childNodes)
			.filter(child => child.getAttribute(str_class) === bgClass)
			.shift();
		if (backRect == null) {
			backRect = this.Constructor("rect", null, ...getFrame(element));
			backRect.setAttribute(str_class, bgClass);
			backRect.setAttribute(str_stroke, str_none);
			element.insertBefore(backRect, element.firstChild);
		}
		backRect.setAttribute(str_fill, color);
		return element;
	};
	const findStyleSheet = function (element) {
		const styles = element.getElementsByTagName(str_style);
		return styles.length === 0 ? undefined : styles[0];
	};
	const stylesheet = function (element, textContent) {
		let styleSection = findStyleSheet(element);
		if (styleSection == null) {
			styleSection = this.Constructor(str_style);
			element.insertBefore(styleSection, element.firstChild);
		}
		styleSection.textContent = "";
		styleSection.appendChild(cdata(textContent));
		return styleSection;
	};
	var methods$1 = {
		clear: clearSVG,
		size: setViewBox,
		setViewBox,
		getViewBox,
		padding: setPadding,
		background,
		getWidth: el => getFrame(el)[2],
		getHeight: el => getFrame(el)[3],
		stylesheet: function (el, text) { return stylesheet.call(this, el, text); },
		load: loadSVG,
		save: save,
	};
	const libraries = {
		math: {
			vector: (...args) => [...args],
		},
	};
	const categories = {
		move: ["mousemove", "touchmove"],
		press: ["mousedown", "touchstart"],
		release: ["mouseup", "touchend"],
		leave: ["mouseleave", "touchcancel"],
	};
	const handlerNames = Object.values(categories)
		.reduce((a, b) => a.concat(b), []);
	const off = (element, handlers) => handlerNames.forEach((handlerName) => {
		handlers[handlerName].forEach(func => element.removeEventListener(handlerName, func));
		handlers[handlerName] = [];
	});
	const defineGetter = (obj, prop, value) => Object.defineProperty(obj, prop, {
		get: () => value,
		enumerable: true,
		configurable: true,
	});
	const assignPress = (e, startPoint) => {
		["pressX", "pressY"].filter(prop => !Object.prototype.hasOwnProperty.call(e, prop))
			.forEach((prop, i) => defineGetter(e, prop, startPoint[i]));
		if (!Object.prototype.hasOwnProperty.call(e, "press")) {
			defineGetter(e, "press", libraries.math.vector(...startPoint));
		}
	};
	const TouchEvents = function (element) {
		let startPoint = [];
		const handlers = [];
		Object.keys(categories).forEach((key) => {
			categories[key].forEach((handler) => {
				handlers[handler] = [];
			});
		});
		const removeHandler = category => categories[category]
			.forEach(handlerName => handlers[handlerName]
				.forEach(func => element.removeEventListener(handlerName, func)));
		const categoryUpdate = {
			press: (e, viewPoint) => {
				startPoint = viewPoint;
				assignPress(e, startPoint);
			},
			release: () => {},
			leave: () => {},
			move: (e, viewPoint) => {
				if (e.buttons > 0 && startPoint[0] === undefined) {
					startPoint = viewPoint;
				} else if (e.buttons === 0 && startPoint[0] !== undefined) {
					startPoint = [];
				}
				assignPress(e, startPoint);
			},
		};
		Object.keys(categories).forEach((category) => {
			const propName = `on${Case.capitalized(category)}`;
			Object.defineProperty(element, propName, {
				set: (handler) => {
					if (handler == null) {
						removeHandler(category);
						return;
					}
					categories[category].forEach((handlerName) => {
						const handlerFunc = (e) => {
							const pointer = (e.touches != null
								? e.touches[0]
								: e);
							if (pointer !== undefined) {
								const viewPoint = convertToViewBox(element, pointer.clientX, pointer.clientY)
									.map(n => (Number.isNaN(n) ? undefined : n));
								["x", "y"]
									.filter(prop => !Object.prototype.hasOwnProperty.call(e, prop))
									.forEach((prop, i) => defineGetter(e, prop, viewPoint[i]));
								if (!Object.prototype.hasOwnProperty.call(e, "position")) {
									defineGetter(e, "position", libraries.math.vector(...viewPoint));
								}
								categoryUpdate[category](e, viewPoint);
							}
							handler(e);
						};
						if (element.addEventListener) {
							handlers[handlerName].push(handlerFunc);
							element.addEventListener(handlerName, handlerFunc);
						}
					});
				},
				enumerable: true,
			});
		});
		Object.defineProperty(element, "off", { value: () => off(element, handlers) });
	};
	var UUID = () => Math.random()
		.toString(36)
		.replace(/[^a-z]+/g, "")
		.concat("aaaaa")
		.substr(0, 5);
	const Animation = function (element) {
		let start;
		const handlers = {};
		let frame = 0;
		let requestId;
		const removeHandlers = () => {
			if (SVGWindow().cancelAnimationFrame) {
				SVGWindow().cancelAnimationFrame(requestId);
			}
			Object.keys(handlers)
				.forEach(uuid => delete handlers[uuid]);
			start = undefined;
			frame = 0;
		};
		Object.defineProperty(element, "play", {
			set: (handler) => {
				removeHandlers();
				if (handler == null) { return; }
				const uuid = UUID();
				const handlerFunc = (e) => {
					if (!start) {
						start = e;
						frame = 0;
					}
					const progress = (e - start) * 0.001;
					handler({ time: progress, frame });
					frame += 1;
					if (handlers[uuid]) {
						requestId = SVGWindow().requestAnimationFrame(handlers[uuid]);
					}
				};
				handlers[uuid] = handlerFunc;
				if (SVGWindow().requestAnimationFrame) {
					requestId = SVGWindow().requestAnimationFrame(handlers[uuid]);
				}
			},
			enumerable: true,
		});
		Object.defineProperty(element, "stop", { value: removeHandlers, enumerable: true });
	};
	const removeFromParent = svg => (svg && svg.parentNode
		? svg.parentNode.removeChild(svg)
		: undefined);
	const possiblePositionAttributes = [["cx", "cy"], ["x", "y"]];
	const controlPoint = function (parent, options = {}) {
		const position = [0, 0];
		const cp = {
			selected: false,
			svg: undefined,
			updatePosition: input => input,
		};
		const updateSVG = () => {
			if (!cp.svg) { return; }
			if (!cp.svg.parentNode) {
				parent.appendChild(cp.svg);
			}
			possiblePositionAttributes
				.filter(coords => cp.svg[coords[0]] != null)
				.forEach(coords => coords.forEach((attr, i) => {
					cp.svg.setAttribute(attr, position[i]);
				}));
		};
		const proxy = new Proxy(position, {
			set: (target, property, value) => {
				target[property] = value;
				updateSVG();
				return true;
			},
		});
		const setPosition = function (...args) {
			coordinates(...svg_flatten_arrays(...args))
				.forEach((n, i) => { position[i] = n; });
			updateSVG();
			if (typeof position.delegate === str_function) {
				position.delegate.apply(position.pointsContainer, [proxy, position.pointsContainer]);
			}
		};
		position.delegate = undefined;
		position.setPosition = setPosition;
		position.onMouseMove = mouse => (cp.selected
			? setPosition(cp.updatePosition(mouse))
			: undefined);
		position.onMouseUp = () => { cp.selected = false; };
		position.distance = mouse => Math.sqrt(svg_distanceSq2(mouse, position));
		["x", "y"].forEach((prop, i) => Object.defineProperty(position, prop, {
			get: () => position[i],
			set: (v) => { position[i] = v; }
		}));
		[str_svg, "updatePosition", "selected"].forEach(key => Object
			.defineProperty(position, key, {
				get: () => cp[key],
				set: (v) => { cp[key] = v; },
			}));
		Object.defineProperty(position, "remove", {
			value: () => {
				removeFromParent(cp.svg);
				position.delegate = undefined;
			},
		});
		return proxy;
	};
	const controls = function (svg, number, options) {
		let selected;
		let delegate;
		const points = Array.from(Array(number))
			.map(() => controlPoint(svg, options));
		const protocol = point => (typeof delegate === str_function
			? delegate.call(points, point, selected, points)
			: undefined);
		points.forEach((p) => {
			p.delegate = protocol;
			p.pointsContainer = points;
		});
		const mousePressedHandler = function (mouse) {
			if (!(points.length > 0)) { return; }
			selected = points
				.map((p, i) => ({ i, d: svg_distanceSq2(p, [mouse.x, mouse.y]) }))
				.sort((a, b) => a.d - b.d)
				.shift()
				.i;
			points[selected].selected = true;
		};
		const mouseMovedHandler = function (mouse) {
			points.forEach(p => p.onMouseMove(mouse));
		};
		const mouseReleasedHandler = function () {
			points.forEach(p => p.onMouseUp());
			selected = undefined;
		};
		svg.onPress = mousePressedHandler;
		svg.onMove = mouseMovedHandler;
		svg.onRelease = mouseReleasedHandler;
		Object.defineProperty(points, "selectedIndex", { get: () => selected });
		Object.defineProperty(points, "selected", { get: () => points[selected] });
		Object.defineProperty(points, "add", {
			value: (opt) => {
				points.push(controlPoint(svg, opt));
			},
		});
		points.removeAll = () => {
			while (points.length > 0) {
				points.pop().remove();
			}
		};
		const functionalMethods = {
			onChange: (func, runOnceAtStart) => {
				delegate = func;
				if (runOnceAtStart === true) {
					const index = points.length - 1;
					func.call(points, points[index], index, points);
				}
			},
			position: func => points.forEach((p, i) => p.setPosition(func.call(points, p, i, points))),
			svg: func => points.forEach((p, i) => { p.svg = func.call(points, p, i, points); }),
		};
		Object.keys(functionalMethods).forEach((key) => {
			points[key] = function () {
				if (typeof arguments[0] === str_function) {
					functionalMethods[key](...arguments);
				}
				return points;
			};
		});
		points.parent = function (parent) {
			if (parent != null && parent.appendChild != null) {
				points.forEach((p) => { parent.appendChild(p.svg); });
			}
			return points;
		};
		return points;
	};
	const applyControlsToSVG = (svg) => {
		svg.controls = (...args) => controls.call(svg, svg, ...args);
	};
	var svgDef = {
		svg: {
			args: (...args) => [viewBox$1(coordinates(...args))].filter(a => a != null),
			methods: methods$1,
			init: (element, ...args) => {
				args.filter(a => typeof a === str_string)
					.forEach(string => loadSVG(element, string));
				args.filter(a => a != null)
					.filter(el => typeof el.appendChild === str_function)
					.forEach(parent => parent.appendChild(element));
				TouchEvents(element);
				Animation(element);
				applyControlsToSVG(element);
			},
		},
	};
	const loadGroup = (group, ...sources) => {
		const elements = sources.map(source => sync(source))
			.filter(a => a !== undefined);
		elements.filter(element => element.tagName === str_svg)
			.forEach(element => moveChildren(group, element));
		elements.filter(element => element.tagName !== str_svg)
			.forEach(element => group.appendChild(element));
		return group;
	};
	var gDef = {
		g: {
			init: loadGroup,
			methods: {
				load: loadGroup,
			},
		},
	};
	var attributes = Object.assign(Object.create(null), {
		svg: [str_viewBox],
		line: ["x1", "y1", "x2", "y2"],
		rect: ["x", "y", "width", "height"],
		circle: ["cx", "cy", "r"],
		ellipse: ["cx", "cy", "rx", "ry"],
		polygon: [str_points],
		polyline: [str_points],
		path: ["d"],
		text: ["x", "y"],
		mask: [str_id],
		symbol: [str_id],
		clipPath: [
			str_id,
			"clip-rule",
		],
		marker: [
			str_id,
			"markerHeight",
			"markerUnits",
			"markerWidth",
			"orient",
			"refX",
			"refY",
		],
		linearGradient: [
			"x1",
			"x2",
			"y1",
			"y2",
		],
		radialGradient: [
			"cx",
			"cy",
			"r",
			"fr",
			"fx",
			"fy",
		],
		stop: [
			"offset",
			"stop-color",
			"stop-opacity",
		],
		pattern: [
			"patternContentUnits",
			"patternTransform",
			"patternUnits",
		],
	});
	const setRadius = (el, r) => {
		el.setAttribute(attributes.circle[2], r);
		return el;
	};
	const setOrigin = (el, a, b) => {
		[...coordinates(...svg_flatten_arrays(a, b)).slice(0, 2)]
			.forEach((value, i) => el.setAttribute(attributes.circle[i], value));
		return el;
	};
	const fromPoints = (a, b, c, d) => [a, b, svg_distance2([a, b], [c, d])];
	var circleDef = {
		circle: {
			args: (a, b, c, d) => {
				const coords = coordinates(...svg_flatten_arrays(a, b, c, d));
				switch (coords.length) {
				case 0: case 1: return [, , ...coords];
				case 2: case 3: return coords;
				default: return fromPoints(...coords);
				}
			},
			methods: {
				radius: setRadius,
				setRadius,
				origin: setOrigin,
				setOrigin,
				center: setOrigin,
				setCenter: setOrigin,
				position: setOrigin,
				setPosition: setOrigin,
			},
		},
	};
	const setRadii = (el, rx, ry) => {
		[, , rx, ry].forEach((value, i) => el.setAttribute(attributes.ellipse[i], value));
		return el;
	};
	const setCenter = (el, a, b) => {
		[...coordinates(...svg_flatten_arrays(a, b)).slice(0, 2)]
			.forEach((value, i) => el.setAttribute(attributes.ellipse[i], value));
		return el;
	};
	var ellipseDef = {
		ellipse: {
			args: (a, b, c, d) => {
				const coords = coordinates(...svg_flatten_arrays(a, b, c, d)).slice(0, 4);
				switch (coords.length) {
				case 0: case 1: case 2: return [, , ...coords];
				default: return coords;
				}
			},
			methods: {
				radius: setRadii,
				setRadius: setRadii,
				origin: setCenter,
				setOrigin: setCenter,
				center: setCenter,
				setCenter,
				position: setCenter,
				setPosition: setCenter,
			},
		},
	};
	const Args$1 = (...args) => coordinates(...svg_semi_flatten_arrays(...args)).slice(0, 4);
	const setPoints$1 = (element, ...args) => {
		Args$1(...args).forEach((value, i) => element.setAttribute(attributes.line[i], value));
		return element;
	};
	var lineDef = {
		line: {
			args: Args$1,
			methods: {
				setPoints: setPoints$1,
			},
		},
	};
	const pathCommandNames = {
		m: "move",
		l: "line",
		v: "vertical",
		h: "horizontal",
		a: "ellipse",
		c: "curve",
		s: "smoothCurve",
		q: "quadCurve",
		t: "smoothQuadCurve",
		z: "close",
	};
	const add2path = (a, b) => [a[0] + (b[0] || 0), a[1] + (b[1] || 0)];
	const getEndpoint = (command, values, offset = [0, 0]) => {
		const upper = command.toUpperCase();
		const origin = command === upper ? [0, 0] : offset;
		switch (upper) {
		case "M":
		case "L":
		case "V":
		case "H":
		case "T": return add2path(origin, values);
		case "A": return add2path(origin, [values[5], values[6]]);
		case "C": return add2path(origin, [values[4], values[5]]);
		case "S":
		case "Q": return add2path(origin, [values[2], values[3]]);
		case "Z": return undefined;
		default: return origin;
		}
	};
	Object.keys(pathCommandNames).forEach((key) => {
		const s = pathCommandNames[key];
		pathCommandNames[key.toUpperCase()] = s.charAt(0).toUpperCase() + s.slice(1);
	});
	const markerRegEx = /[MmLlSsQqLlHhVvCcSsQqTtAaZz]/g;
	const digitRegEx = /-?[0-9]*\.?\d+/g;
	const parsePathCommands = (d) => {
		const results = [];
		let match;
		while ((match = markerRegEx.exec(d)) !== null) {
			results.push(match);
		}
		return results
			.map((result, i, arr) => [
				result[0],
				result.index,
				i === arr.length - 1
					? d.length - 1
					: arr[(i + 1) % arr.length].index - 1,
			])
			.map(el => {
				const command = el[0];
				const valueString = d.substring(el[1] + 1, el[2]);
				const strings = valueString.match(digitRegEx);
				const values = strings ? strings.map(parseFloat) : [];
				return { command, values };
			});
	};
	const parsePathCommandsEndpoints = (d) => {
		let pen = [0, 0];
		const commands = parsePathCommands(d);
		if (!commands.length) { return commands; }
		commands.forEach((command, i) => {
			commands[i].end = getEndpoint(command.command, command.values, pen);
			commands[i].start = i === 0 ? pen : commands[i - 1].end;
			pen = commands[i].end;
		});
		const last = commands[commands.length - 1];
		const firstDrawCommand = commands
			.filter(el => el.command.toUpperCase() !== "M"
				&& el.command.toUpperCase() !== "Z")
			.shift();
		if (last.command.toUpperCase() === "Z") {
			last.end = [...firstDrawCommand.start];
		}
		return commands;
	};
	var path_methods$1 = Object.freeze({
		__proto__: null,
		pathCommandNames: pathCommandNames,
		parsePathCommands: parsePathCommands,
		parsePathCommandsEndpoints: parsePathCommandsEndpoints
	});
	const getD = (el) => {
		const attr = el.getAttribute("d");
		return (attr == null) ? "" : attr;
	};
	const clear = element => {
		element.removeAttribute("d");
		return element;
	};
	const appendPathCommand = (el, command, ...args) => {
		el.setAttribute("d", `${getD(el)}${command}${svg_flatten_arrays(...args).join(" ")}`);
		return el;
	};
	const getCommands = element => parsePathCommands(getD(element));
	const path_methods = {
		addCommand: appendPathCommand,
		appendCommand: appendPathCommand,
		clear,
		getCommands: getCommands,
		get: getCommands,
		getD: el => el.getAttribute("d"),
	};
	Object.keys(pathCommandNames).forEach((key) => {
		path_methods[pathCommandNames[key]] = (el, ...args) => appendPathCommand(el, key, ...args);
	});
	var pathDef = {
		path: {
			methods: path_methods,
		},
	};
	const setRectSize = (el, rx, ry) => {
		[, , rx, ry]
			.forEach((value, i) => el.setAttribute(attributes.rect[i], value));
		return el;
	};
	const setRectOrigin = (el, a, b) => {
		[...coordinates(...svg_flatten_arrays(a, b)).slice(0, 2)]
			.forEach((value, i) => el.setAttribute(attributes.rect[i], value));
		return el;
	};
	const fixNegatives = function (arr) {
		[0, 1].forEach(i => {
			if (arr[2 + i] < 0) {
				if (arr[0 + i] === undefined) { arr[0 + i] = 0; }
				arr[0 + i] += arr[2 + i];
				arr[2 + i] = -arr[2 + i];
			}
		});
		return arr;
	};
	var rectDef = {
		rect: {
			args: (a, b, c, d) => {
				const coords = coordinates(...svg_flatten_arrays(a, b, c, d)).slice(0, 4);
				switch (coords.length) {
				case 0: case 1: case 2: case 3: return fixNegatives([, , ...coords]);
				default: return fixNegatives(coords);
				}
			},
			methods: {
				origin: setRectOrigin,
				setOrigin: setRectOrigin,
				center: setRectOrigin,
				setCenter: setRectOrigin,
				size: setRectSize,
				setSize: setRectSize,
			},
		},
	};
	var styleDef = {
		style: {
			init: (el, text) => {
				el.textContent = "";
				el.appendChild(cdata(text));
			},
			methods: {
				setTextContent: (el, text) => {
					el.textContent = "";
					el.appendChild(cdata(text));
					return el;
				},
			},
		},
	};
	var textDef = {
		text: {
			args: (a, b, c) => coordinates(...svg_flatten_arrays(a, b, c)).slice(0, 2),
			init: (element, a, b, c, d) => {
				const text = [a, b, c, d].filter(el => typeof el === str_string).shift();
				if (text) {
					element.appendChild(SVGWindow().document.createTextNode(text));
				}
			},
		},
	};
	const makeIDString = function () {
		return Array.from(arguments)
			.filter(a => typeof a === str_string || a instanceof String)
			.shift() || UUID();
	};
	const maskArgs = (...args) => [makeIDString(...args)];
	var maskTypes = {
		mask: { args: maskArgs },
		clipPath: { args: maskArgs },
		symbol: { args: maskArgs },
		marker: {
			args: maskArgs,
			methods: {
				size: setViewBox,
				setViewBox: setViewBox,
			},
		},
	};
	const getPoints = (el) => {
		const attr = el.getAttribute(str_points);
		return (attr == null) ? "" : attr;
	};
	const polyString = function () {
		return Array
			.from(Array(Math.floor(arguments.length / 2)))
			.map((_, i) => `${arguments[i * 2 + 0]},${arguments[i * 2 + 1]}`)
			.join(" ");
	};
	const stringifyArgs = (...args) => [
		polyString(...coordinates(...svg_semi_flatten_arrays(...args))),
	];
	const setPoints = (element, ...args) => {
		element.setAttribute(str_points, stringifyArgs(...args)[0]);
		return element;
	};
	const addPoint = (element, ...args) => {
		element.setAttribute(str_points, [getPoints(element), stringifyArgs(...args)[0]]
			.filter(a => a !== "")
			.join(" "));
		return element;
	};
	const Args = function (...args) {
		return args.length === 1 && typeof args[0] === str_string
			? [args[0]]
			: stringifyArgs(...args);
	};
	var polyDefs = {
		polyline: {
			args: Args,
			methods: {
				setPoints,
				addPoint,
			},
		},
		polygon: {
			args: Args,
			methods: {
				setPoints,
				addPoint,
			},
		},
	};
	var Spec = Object.assign(
		{},
		svgDef,
		gDef,
		circleDef,
		ellipseDef,
		lineDef,
		pathDef,
		rectDef,
		styleDef,
		textDef,
		maskTypes,
		polyDefs,
	);
	var ManyElements = {
		presentation: [
			"color",
			"color-interpolation",
			"cursor",
			"direction",
			"display",
			"fill",
			"fill-opacity",
			"fill-rule",
			"font-family",
			"font-size",
			"font-size-adjust",
			"font-stretch",
			"font-style",
			"font-variant",
			"font-weight",
			"image-rendering",
			"letter-spacing",
			"opacity",
			"overflow",
			"paint-order",
			"pointer-events",
			"preserveAspectRatio",
			"shape-rendering",
			"stroke",
			"stroke-dasharray",
			"stroke-dashoffset",
			"stroke-linecap",
			"stroke-linejoin",
			"stroke-miterlimit",
			"stroke-opacity",
			"stroke-width",
			"tabindex",
			"transform-origin",
			"user-select",
			"vector-effect",
			"visibility",
		],
		animation: [
			"accumulate",
			"additive",
			"attributeName",
			"begin",
			"by",
			"calcMode",
			"dur",
			"end",
			"from",
			"keyPoints",
			"keySplines",
			"keyTimes",
			"max",
			"min",
			"repeatCount",
			"repeatDur",
			"restart",
			"to",
			"values",
		],
		effects: [
			"azimuth",
			"baseFrequency",
			"bias",
			"color-interpolation-filters",
			"diffuseConstant",
			"divisor",
			"edgeMode",
			"elevation",
			"exponent",
			"filter",
			"filterRes",
			"filterUnits",
			"flood-color",
			"flood-opacity",
			"in",
			"in2",
			"intercept",
			"k1",
			"k2",
			"k3",
			"k4",
			"kernelMatrix",
			"lighting-color",
			"limitingConeAngle",
			"mode",
			"numOctaves",
			"operator",
			"order",
			"pointsAtX",
			"pointsAtY",
			"pointsAtZ",
			"preserveAlpha",
			"primitiveUnits",
			"radius",
			"result",
			"seed",
			"specularConstant",
			"specularExponent",
			"stdDeviation",
			"stitchTiles",
			"surfaceScale",
			"targetX",
			"targetY",
			"type",
			"xChannelSelector",
			"yChannelSelector",
		],
		text: [
			"dx",
			"dy",
			"alignment-baseline",
			"baseline-shift",
			"dominant-baseline",
			"lengthAdjust",
			"method",
			"overline-position",
			"overline-thickness",
			"rotate",
			"spacing",
			"startOffset",
			"strikethrough-position",
			"strikethrough-thickness",
			"text-anchor",
			"text-decoration",
			"text-rendering",
			"textLength",
			"underline-position",
			"underline-thickness",
			"word-spacing",
			"writing-mode",
		],
		gradient: [
			"gradientTransform",
			"gradientUnits",
			"spreadMethod",
		],
	};
	Object.values(NodeNames)
		.reduce((a, b) => a.concat(b), [])
		.filter(nodeName => attributes[nodeName] === undefined)
		.forEach(nodeName => { attributes[nodeName] = []; });
	[[[str_svg, "defs", "g"].concat(NodeNames.v, NodeNames.t), ManyElements.presentation],
		[["filter"], ManyElements.effects],
		[NodeNames.cT.concat("text"), ManyElements.text],
		[NodeNames.cF, ManyElements.effects],
		[NodeNames.cG, ManyElements.gradient],
	].forEach(pair => pair[0].forEach(key => {
		attributes[key] = attributes[key].concat(pair[1]);
	}));
	const getClassList = (element) => {
		if (element == null) { return []; }
		const currentClass = element.getAttribute(str_class);
		return (currentClass == null
			? []
			: currentClass.split(" ").filter(s => s !== ""));
	};
	var classMethods = {
		addClass: (element, newClass) => {
			const classes = getClassList(element)
				.filter(c => c !== newClass);
			classes.push(newClass);
			element.setAttributeNS(null, str_class, classes.join(" "));
		},
		removeClass: (element, removedClass) => {
			const classes = getClassList(element)
				.filter(c => c !== removedClass);
			element.setAttributeNS(null, str_class, classes.join(" "));
		},
		setClass: (element, className) => {
			element.setAttributeNS(null, str_class, className);
		},
		setId: (element, idName) => {
			element.setAttributeNS(null, str_id, idName);
		},
	};
	const getAttr = (element) => {
		const t = element.getAttribute(str_transform);
		return (t == null || t === "") ? undefined : t;
	};
	const TransformMethods = {
		clearTransform: (el) => { el.removeAttribute(str_transform); return el; },
	};
	["translate", "rotate", "scale", "matrix"].forEach(key => {
		TransformMethods[key] = (element, ...args) => element.setAttribute(
			str_transform,
			[getAttr(element), `${key}(${args.join(" ")})`]
				.filter(a => a !== undefined)
				.join(" "),
		);
	});
	const findIdURL = function (arg) {
		if (arg == null) { return ""; }
		if (typeof arg === str_string) {
			return arg.slice(0, 3) === "url"
				? arg
				: `url(#${arg})`;
		}
		if (arg.getAttribute != null) {
			const idString = arg.getAttribute(str_id);
			return `url(#${idString})`;
		}
		return "";
	};
	const methods = {};
	["clip-path",
		"mask",
		"symbol",
		"marker-end",
		"marker-mid",
		"marker-start",
	].forEach(attr => {
		methods[Case.toCamel(attr)] = (element, parent) => element.setAttribute(attr, findIdURL(parent));
	});
	const Nodes = {};
	NodeNames.v.push(...Object.keys(nodes));
	Object.keys(nodes).forEach((node) => {
		nodes[node].attributes = (nodes[node].attributes === undefined
			? [...ManyElements.presentation]
			: nodes[node].attributes.concat(ManyElements.presentation));
	});
	Object.assign(Nodes, Spec, nodes);
	Object.keys(NodeNames)
		.forEach(key => NodeNames[key]
			.filter(nodeName => Nodes[nodeName] === undefined)
			.forEach((nodeName) => {
				Nodes[nodeName] = {};
			}));
	const passthrough = function () { return Array.from(arguments); };
	Object.keys(Nodes).forEach((key) => {
		if (!Nodes[key].nodeName) { Nodes[key].nodeName = key; }
		if (!Nodes[key].init) { Nodes[key].init = passthrough; }
		if (!Nodes[key].args) { Nodes[key].args = passthrough; }
		if (!Nodes[key].methods) { Nodes[key].methods = {}; }
		if (!Nodes[key].attributes) {
			Nodes[key].attributes = attributes[key] || [];
		}
	});
	const assignMethods = (groups, Methods) => {
		groups.forEach(n => Object
			.keys(Methods).forEach((method) => {
				Nodes[n].methods[method] = function () {
					Methods[method](...arguments);
					return arguments[0];
				};
			}));
	};
	assignMethods(svg_flatten_arrays(NodeNames.t, NodeNames.v, NodeNames.g, NodeNames.s, NodeNames.p, NodeNames.i, NodeNames.h, NodeNames.d), classMethods);
	assignMethods(svg_flatten_arrays(NodeNames.t, NodeNames.v, NodeNames.g, NodeNames.s, NodeNames.p, NodeNames.i, NodeNames.h, NodeNames.d), dom);
	assignMethods(svg_flatten_arrays(NodeNames.v, NodeNames.g, NodeNames.s), TransformMethods);
	assignMethods(svg_flatten_arrays(NodeNames.t, NodeNames.v, NodeNames.g), methods);
	const RequiredAttrMap = {
		svg: {
			version: "1.1",
			xmlns: NS,
		},
		style: {
			type: "text/css",
		},
	};
	const RequiredAttributes = (element, nodeName) => {
		if (RequiredAttrMap[nodeName]) {
			Object.keys(RequiredAttrMap[nodeName])
				.forEach(key => element.setAttribute(key, RequiredAttrMap[nodeName][key]));
		}
	};
	const bound = {};
	const constructor = (nodeName, parent, ...args) => {
		const element = SVGWindow().document.createElementNS(NS, Nodes[nodeName].nodeName);
		if (parent) { parent.appendChild(element); }
		RequiredAttributes(element, nodeName);
		Nodes[nodeName].init(element, ...args);
		Nodes[nodeName].args(...args).forEach((v, i) => {
			if (Nodes[nodeName].attributes[i] != null) {
				element.setAttribute(Nodes[nodeName].attributes[i], v);
			}
		});
		Nodes[nodeName].attributes.forEach((attribute) => {
			Object.defineProperty(element, Case.toCamel(attribute), {
				value: function () {
					element.setAttribute(attribute, ...arguments);
					return element;
				}
			});
		});
		Object.keys(Nodes[nodeName].methods).forEach(methodName => Object
			.defineProperty(element, methodName, {
				value: function () {
					return Nodes[nodeName].methods[methodName].call(bound, element, ...arguments);
				},
			}));
		if (nodesAndChildren[nodeName]) {
			nodesAndChildren[nodeName].forEach((childNode) => {
				const value = function () { return constructor(childNode, element, ...arguments); };
				if (Nodes[childNode].static) {
					Object.keys(Nodes[childNode].static).forEach(key => {
						value[key] = function () {
							return Nodes[childNode].static[key](element, ...arguments);
						};
					});
				}
				Object.defineProperty(element, childNode, { value });
			});
		}
		return element;
	};
	bound.Constructor = constructor;
	const elements = {};
	Object.keys(NodeNames).forEach(key => NodeNames[key]
		.forEach((nodeName) => {
			elements[nodeName] = (...args) => constructor(nodeName, null, ...args);
		}));
	const link_rabbitear_math = (svg, ear) => {
		["segment",
			"circle",
			"ellipse",
			"rect",
			"polygon",
		].filter(key => ear[key] && ear[key].prototype)
			.forEach((key) => {
				ear[key].prototype.svg = function () { return svg.path(this.svgPath()); };
			});
		libraries.math.vector = ear.vector;
	};
	const link_rabbitear_graph = (svg, ear) => {
		const NODE_NAME = "origami";
		Nodes[NODE_NAME] = {
			nodeName: "g",
			init: function (element, ...args) {
				return ear.graph.svg.drawInto(element, ...args);
			},
			args: () => [],
			methods: Nodes.g.methods,
			attributes: Nodes.g.attributes,
			static: {},
		};
		Object.keys(ear.graph.svg).forEach(key => {
			Nodes[NODE_NAME].static[key] = (element, ...args) => {
				const child = ear.graph.svg[key](...args);
				element.appendChild(child);
				return child;
			};
		});
		nodesAndChildren[NODE_NAME] = [...nodesAndChildren.g];
		nodesAndChildren.svg.push(NODE_NAME);
		nodesAndChildren.g.push(NODE_NAME);
		svg[NODE_NAME] = (...args) => constructor(NODE_NAME, null, ...args);
		Object.keys(ear.graph.svg).forEach(key => {
			svg[NODE_NAME][key] = ear.graph.svg[key];
		});
	};
	const Linker = function (lib) {
		if (lib.graph && lib.origami) {
			lib.svg = this;
			link_rabbitear_math(this, lib);
			link_rabbitear_graph(this, lib);
		}
	};
	const initialize = function (svg, ...args) {
		args.filter(arg => typeof arg === str_function)
			.forEach(func => func.call(svg, svg));
	};
	SVG_Constructor.init = function () {
		const svg = constructor(str_svg, null, ...arguments);
		if (SVGWindow().document.readyState === "loading") {
			SVGWindow().document.addEventListener("DOMContentLoaded", () => initialize(svg, ...arguments));
		} else {
			initialize(svg, ...arguments);
		}
		return svg;
	};
	SVG.NS = NS;
	SVG.linker = Linker.bind(SVG);
	Object.assign(SVG, elements);
	SVG.core = Object.assign(
		Object.create(null),
		{
			load: Load,
			save,
			coordinates,
			flatten: svg_flatten_arrays,
			attributes,
			children: nodesAndChildren,
			cdata,
		},
		Case,
		classMethods,
		dom,
		svg_algebra,
		path_methods$1,
		TransformMethods,
		viewBox,
	);
	Object.defineProperty(SVG, "window", {
		enumerable: false,
		set: value => { setWindow(value); },
	});

	const compileShader = (gl, shaderSource, shaderType) => {
		const shader = gl.createShader(shaderType);
		gl.shaderSource(shader, shaderSource);
		gl.compileShader(shader);
		if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
			throw new Error(gl.getShaderInfoLog(shader));
		}
		return shader;
	};
	const createProgramAndAttachShaders = (gl, vertexShader, fragmentShader) => {
		const program = gl.createProgram();
		gl.attachShader(program, vertexShader);
		gl.attachShader(program, fragmentShader);
		gl.linkProgram(program);
		if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
			throw new Error(gl.getProgramInfoLog(program));
		}
		gl.deleteShader(vertexShader);
		gl.deleteShader(fragmentShader);
		return program;
	};
	const createProgram = (gl, vertexSource, fragmentSource) => {
		const vertexShader = compileShader(gl, vertexSource, gl.VERTEX_SHADER);
		const fragmentShader = compileShader(gl, fragmentSource, gl.FRAGMENT_SHADER);
		return createProgramAndAttachShaders(gl, vertexShader, fragmentShader);
	};

	const initializeWebGL = (canvasElement, preferredVersion) => {
		const contextName = [null, "webgl", "webgl2"];
		const devicePixelRatio = window.devicePixelRatio || 1;
		canvasElement.width = canvasElement.clientWidth * devicePixelRatio;
		canvasElement.height = canvasElement.clientHeight * devicePixelRatio;
		if (preferredVersion) {
			return ({
				gl: canvasElement.getContext(contextName[preferredVersion]),
				version: preferredVersion,
			});
		}
		const gl2 = canvasElement.getContext(contextName[2]);
		if (gl2) { return { gl: gl2, version: 2 }; }
		const gl1 = canvasElement.getContext(contextName[1]);
		if (gl1) { return { gl: gl1, version: 1 }; }
		throw new Error(Messages.noWebGL);
	};

	const rebuildViewport = (gl, canvas) => {
		if (!gl) { return; }
		const devicePixelRatio = window.devicePixelRatio || 1;
		const size = [canvas.clientWidth, canvas.clientHeight]
			.map(n => n * devicePixelRatio);
		if (canvas.width !== size[0] || canvas.height !== size[1]) {
			canvas.width = size[0];
			canvas.height = size[1];
		}
		gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
	};
	const makeProjectionMatrix = (canvas, perspective = "perspective", fov = 45) => {
		if (!canvas) { return math.core.identity4x4; }
		const Z_NEAR = 0.1;
		const Z_FAR = 20;
		const ORTHO_FAR = -100;
		const ORTHO_NEAR = 100;
		const bounds = [canvas.clientWidth, canvas.clientHeight];
		const vmin = Math.min(...bounds);
		const padding = [0, 1].map(i => ((bounds[i] - vmin) / vmin) / 2);
		const side = padding.map(p => p + 0.5);
		return perspective === "orthographic"
			? math.core.makeOrthographicMatrix4(side[1], side[0], -side[1], -side[0], ORTHO_FAR, ORTHO_NEAR)
			: math.core.makePerspectiveMatrix4(fov * (Math.PI / 180), bounds[0] / bounds[1], Z_NEAR, Z_FAR);
	};
	const makeModelMatrix = (graph) => {
		if (!graph) { return math.core.identity4x4; }
		const bounds = boundingBox(graph);
		if (!bounds) { return math.core.identity4x4; }
		const scale = Math.max(...bounds.span);
		const center = math.core.resize(3, math.core.midpoint(bounds.min, bounds.max));
		const scalePositionMatrix = [scale, 0, 0, 0, 0, scale, 0, 0, 0, 0, scale, 0, ...center, 1];
		return math.core.invertMatrix4(scalePositionMatrix);
	};

	var view = /*#__PURE__*/Object.freeze({
		__proto__: null,
		rebuildViewport: rebuildViewport,
		makeProjectionMatrix: makeProjectionMatrix,
		makeModelMatrix: makeModelMatrix
	});

	const uniformFunc = (gl, i, func, value) => {
		switch (func) {
		case "uniformMatrix4fv": gl[func](i, false, value); break;
		default: gl[func](i, value); break;
		}
	};
	const drawProgram = (gl, version, bundle, uniforms = {}) => {
		gl.useProgram(bundle.program);
		bundle.flags.forEach(flag => gl.enable(flag));
		const uniformCount = gl.getProgramParameter(bundle.program, gl.ACTIVE_UNIFORMS);
		for (let i = 0; i < uniformCount; i += 1) {
			const uniformName = gl.getActiveUniform(bundle.program, i).name;
			const uniform = uniforms[uniformName];
			if (uniform) {
				const index = gl.getUniformLocation(bundle.program, uniformName);
				uniformFunc(gl, index, uniform.func, uniform.value);
			}
		}
		bundle.vertexArrays.forEach(el => {
			gl.bindBuffer(gl.ARRAY_BUFFER, el.buffer);
			gl.bufferData(gl.ARRAY_BUFFER, el.data, gl.STATIC_DRAW);
			gl.vertexAttribPointer(el.location, el.length, el.type, false, 0, 0);
			gl.enableVertexAttribArray(el.location);
		});
		bundle.elementArrays.forEach(el => {
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, el.buffer);
			gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, el.data, gl.STATIC_DRAW);
			gl.drawElements(
				el.mode,
				el.data.length,
				version === 2 ? gl.UNSIGNED_INT : gl.UNSIGNED_SHORT,
				el.buffer,
			);
		});
		bundle.flags.forEach(flag => gl.disable(flag));
	};
	const deallocProgram = (gl, bundle) => {
		bundle.vertexArrays.forEach(vert => gl.disableVertexAttribArray(vert.location));
		bundle.vertexArrays.forEach(vert => gl.deleteBuffer(vert.buffer));
		bundle.elementArrays.forEach(elements => gl.deleteBuffer(elements.buffer));
		gl.deleteProgram(bundle.program);
	};

	var program = /*#__PURE__*/Object.freeze({
		__proto__: null,
		drawProgram: drawProgram,
		deallocProgram: deallocProgram
	});

	const makeFacesVertexData = (graph, options = {}) => {
		const vertices_coords = graph.vertices_coords
			.map(coord => [...coord].concat(Array(3 - coord.length).fill(0)));
		const vertices_normal = makeVerticesNormal(graph);
		const vertices_barycentric = vertices_coords
			.map((_, i) => i % 3)
			.map(n => [n === 0 ? 1 : 0, n === 1 ? 1 : 0, n === 2 ? 1 : 0]);
		const facesEdgesIsJoined = graph.faces_edges
			.map(edges => edges
				.map(e => graph.edges_assignment[e])
				.map(a => a === "J" || a === "j"));
		if (!options.showTrianglulation) {
			for (let i = 0; i < facesEdgesIsJoined.length; i += 1) {
				if (facesEdgesIsJoined[i][0]) {
					vertices_barycentric[i * 3 + 0][2] = vertices_barycentric[i * 3 + 1][2] = 100;
				}
				if (facesEdgesIsJoined[i][1]) {
					vertices_barycentric[i * 3 + 1][0] = vertices_barycentric[i * 3 + 2][0] = 100;
				}
				if (facesEdgesIsJoined[i][2]) {
					vertices_barycentric[i * 3 + 0][1] = vertices_barycentric[i * 3 + 2][1] = 100;
				}
			}
		}
		return {
			vertices_coords,
			vertices_normal,
			vertices_barycentric,
		};
	};
	const ASSIGNMENT_COLOR$1 = {
		B: [0.3, 0.3, 0.3],
		b: [0.3, 0.3, 0.3],
		V: [0.2, 0.4, 0.6],
		v: [0.2, 0.4, 0.6],
		M: [0.75, 0.25, 0.15],
		m: [0.75, 0.25, 0.15],
		F: [0.2, 0.2, 0.2],
		f: [0.2, 0.2, 0.2],
		C: [1.0, 0.75, 0.25],
		c: [1.0, 0.75, 0.25],
		U: [0.2, 0.2, 0.2],
		u: [0.2, 0.2, 0.2],
	};
	const makeThickEdgesVertexData = (graph, assignment_color = ASSIGNMENT_COLOR$1) => {
		if (!graph || !graph.vertices_coords || !graph.edges_vertices) { return []; }
		const vertices_coords3D = graph.vertices_coords
			.map(coord => [...coord].concat(Array(3 - coord.length).fill(0)));
		const vertices_coords = graph.edges_vertices
			.flatMap(edge => edge
				.map(v => vertices_coords3D[v]))
			.flatMap(coord => [coord, coord, coord, coord]);
		const edgesVector = makeEdgesVector(graph);
		const vertices_color = graph.edges_assignment
			? graph.edges_assignment
				.flatMap(a => Array(8).fill(assignment_color[a]))
			: graph.edges_vertices
				.flatMap(() => Array(8).fill(assignment_color.U));
		const verticesEdgesVector = edgesVector
			.flatMap(el => [el, el, el, el, el, el, el, el]);
		const vertices_vector = graph.edges_vertices
			.flatMap(() => [
				[1, 0],
				[0, 1],
				[-1, 0],
				[0, -1],
				[1, 0],
				[0, 1],
				[-1, 0],
				[0, -1],
			]);
		return {
			vertices_coords,
			vertices_color,
			verticesEdgesVector,
			vertices_vector,
		};
	};

	var foldedData = /*#__PURE__*/Object.freeze({
		__proto__: null,
		makeFacesVertexData: makeFacesVertexData,
		makeThickEdgesVertexData: makeThickEdgesVertexData
	});

	const makeFoldedVertexArrays = (gl, program, graph, options = {}) => {
		if (!graph || !graph.vertices_coords || !graph.faces_vertices) {
			return [];
		}
		const {
			vertices_coords,
			vertices_normal,
			vertices_barycentric,
		} = makeFacesVertexData(graph, options);
		return [{
			location: gl.getAttribLocation(program, "v_position"),
			buffer: gl.createBuffer(),
			type: gl.FLOAT,
			length: vertices_coords[0].length,
			data: new Float32Array(vertices_coords.flat()),
		}, {
			location: gl.getAttribLocation(program, "v_normal"),
			buffer: gl.createBuffer(),
			type: gl.FLOAT,
			length: vertices_normal[0].length,
			data: new Float32Array(vertices_normal.flat()),
		}, {
			location: gl.getAttribLocation(program, "v_barycentric"),
			buffer: gl.createBuffer(),
			type: gl.FLOAT,
			length: 3,
			data: new Float32Array(vertices_barycentric.flat()),
		},
		].filter(el => el.location !== -1);
	};
	const makeFoldedElementArrays = (gl, version = 1, graph = {}) => {
		if (!graph || !graph.vertices_coords || !graph.faces_vertices) { return []; }
		return [{
			mode: gl.TRIANGLES,
			buffer: gl.createBuffer(),
			data: version === 2
				? new Uint32Array(graph.faces_vertices.flat())
				: new Uint16Array(graph.faces_vertices.flat()),
		}];
	};
	const makeThickEdgesVertexArrays = (gl, program, graph, options = {}) => {
		if (!graph || !graph.vertices_coords || !graph.edges_vertices) {
			return [];
		}
		const {
			vertices_coords,
			vertices_color,
			verticesEdgesVector,
			vertices_vector,
		} = makeThickEdgesVertexData(graph, options.assignment_color);
		return [{
			location: gl.getAttribLocation(program, "v_position"),
			buffer: gl.createBuffer(),
			type: gl.FLOAT,
			length: vertices_coords[0].length,
			data: new Float32Array(vertices_coords.flat()),
		}, {
			location: gl.getAttribLocation(program, "v_color"),
			buffer: gl.createBuffer(),
			type: gl.FLOAT,
			length: vertices_color[0].length,
			data: new Float32Array(vertices_color.flat()),
		}, {
			location: gl.getAttribLocation(program, "edge_vector"),
			buffer: gl.createBuffer(),
			type: gl.FLOAT,
			length: verticesEdgesVector[0].length,
			data: new Float32Array(verticesEdgesVector.flat()),
		}, {
			location: gl.getAttribLocation(program, "vertex_vector"),
			buffer: gl.createBuffer(),
			type: gl.FLOAT,
			length: vertices_vector[0].length,
			data: new Float32Array(vertices_vector.flat()),
		}].filter(el => el.location !== -1);
	};
	const makeThickEdgesElementArrays = (gl, version = 1, graph = {}) => {
		if (!graph || !graph.edges_vertices) { return []; }
		const edgesTriangles = graph.edges_vertices
			.map((_, i) => i * 8)
			.flatMap(i => [
				i + 0, i + 1, i + 4,
				i + 4, i + 1, i + 5,
				i + 1, i + 2, i + 5,
				i + 5, i + 2, i + 6,
				i + 2, i + 3, i + 6,
				i + 6, i + 3, i + 7,
				i + 3, i + 0, i + 7,
				i + 7, i + 0, i + 4,
			]);
		return [{
			mode: gl.TRIANGLES,
			buffer: gl.createBuffer(),
			data: version === 2
				? new Uint32Array(edgesTriangles)
				: new Uint16Array(edgesTriangles),
		}];
	};

	var foldedArrays = /*#__PURE__*/Object.freeze({
		__proto__: null,
		makeFoldedVertexArrays: makeFoldedVertexArrays,
		makeFoldedElementArrays: makeFoldedElementArrays,
		makeThickEdgesVertexArrays: makeThickEdgesVertexArrays,
		makeThickEdgesElementArrays: makeThickEdgesElementArrays
	});

	const LAYER_NUDGE = 1e-5;
	const makeExplodedGraph = (graph, layerNudge = LAYER_NUDGE) => {
		const exploded = JSON.parse(JSON.stringify(graph));
		if (!exploded.edges_assignment) {
			const edgeCount = count.edges(graph) || countImplied.edges(graph);
			exploded.edges_assignment = Array(edgeCount).fill("U");
		}
		let faces_nudge = [];
		if (exploded.faceOrders) {
			faces_nudge = nudgeFacesWithFaceOrders(exploded);
		} else if (exploded.faces_layer) {
			faces_nudge = nudgeFacesWithFacesLayer(exploded);
		}
		const change = triangulate(exploded);
		explode(exploded);
		if (change.faces) {
			const backmap = invertMap(change.faces.map);
			backmap.forEach((oldFace, face) => {
				const nudge = faces_nudge[oldFace];
				if (!nudge) { return; }
				exploded.faces_vertices[face].forEach(v => {
					const vec = math.core.scale(nudge.vector, nudge.layer * layerNudge);
					exploded.vertices_coords[v] = math.core.add(
						math.core.resize(3, exploded.vertices_coords[v]),
						vec,
					);
				});
			});
		}
		return exploded;
	};

	const makeUniforms$1 = (gl, {
		projectionMatrix, viewMatrix, modelMatrix, canvas,
		opacity, touchPoint, frontColor, backColor, strokeWidth,
	}) => ({
		u_matrix: {
			func: "uniformMatrix4fv",
			value: math.core.multiplyMatrices4(math.core
				.multiplyMatrices4(projectionMatrix, viewMatrix), modelMatrix),
		},
		u_projection: {
			func: "uniformMatrix4fv",
			value: projectionMatrix,
		},
		u_modelView: {
			func: "uniformMatrix4fv",
			value: math.core.multiplyMatrices4(viewMatrix, modelMatrix),
		},
		u_opacity: {
			func: "uniform1f",
			value: opacity,
		},
		u_touch: {
			func: "uniform2fv",
			value: touchPoint,
		},
		u_resolution: {
			func: "uniform2fv",
			value: [canvas.clientWidth, canvas.clientHeight]
				.map(n => n * window.devicePixelRatio || 1),
		},
		u_frontColor: {
			func: "uniform3fv",
			value: hexToRGB(frontColor),
		},
		u_backColor: {
			func: "uniform3fv",
			value: hexToRGB(backColor),
		},
		u_strokeWidth: {
			func: "uniform1f",
			value: strokeWidth,
		},
	});

	var vertexV1 = "#version 100\n\nattribute vec3 v_position;\nattribute vec3 v_normal;\n\nuniform mat4 u_projection;\nuniform mat4 u_modelView;\nuniform mat4 u_matrix;\nuniform vec3 u_frontColor;\nuniform vec3 u_backColor;\nvarying vec3 normal_color;\nvarying vec3 front_color;\nvarying vec3 back_color;\n\nvoid main () {\n\tgl_Position = u_matrix * vec4(v_position, 1);\n\n\tnormal_color = vec3(\n\t\tdot(v_normal, normalize(u_modelView * vec4(1, 0, 0, 0)).xyz),\n\t\tdot(v_normal, normalize(u_modelView * vec4(0, 1, 0, 0)).xyz),\n\t\tdot(v_normal, normalize(u_modelView * vec4(0, 0, 1, 0)).xyz)\n\t);\n\tfloat grayX = abs(normal_color.x);\n\tfloat grayY = abs(normal_color.y);\n\tfloat grayZ = abs(normal_color.z);\n\tfloat gray = 0.25 + clamp(grayY, 1.0, 0.25) * 0.5 + grayX * 0.25 + grayZ * 0.25;\n\tfloat c = clamp(gray, 0.0, 1.0);\n\tfront_color = u_frontColor * c;\n\tback_color = u_backColor * c;\n}\n";

	var fragmentV1 = "#version 100\n\nprecision mediump float;\nuniform float u_opacity;\nvarying vec3 front_color;\nvarying vec3 back_color;\n\nvoid main () {\n\tvec3 color = gl_FrontFacing ? front_color : back_color;\n\tgl_FragColor = vec4(color, u_opacity)\n}\n";

	var vertexV2 = "#version 300 es\n\nuniform mat4 u_modelView;\nuniform mat4 u_matrix;\nuniform vec3 u_frontColor;\nuniform vec3 u_backColor;\n\nin vec3 v_position;\nin vec3 v_normal;\nout vec3 front_color;\nout vec3 back_color;\n\nvoid main () {\n\tgl_Position = u_matrix * vec4(v_position, 1);\n\tvec3 normal_color = vec3(\n\t\tdot(v_normal, normalize(u_modelView * vec4(1, 0, 0, 0)).xyz),\n\t\tdot(v_normal, normalize(u_modelView * vec4(0, 1, 0, 0)).xyz),\n\t\tdot(v_normal, normalize(u_modelView * vec4(0, 0, 1, 0)).xyz)\n\t);\n\tfloat grayX = abs(normal_color.x);\n\tfloat grayY = abs(normal_color.y);\n\tfloat grayZ = abs(normal_color.z);\n\tfloat gray = 0.25 + clamp(grayY, 1.0, 0.25) * 0.5 + grayX * 0.25 + grayZ * 0.25;\n\tfloat c = clamp(gray, 0.0, 1.0);\n\tfront_color = u_frontColor * c;\n\tback_color = u_backColor * c;\n}\n";

	var fragmentV2 = "#version 300 es\nprecision highp float;\n\nuniform float u_opacity;\nin vec3 front_color;\nin vec3 back_color;\nout vec4 outColor;\n\nvoid main () {\n\tgl_FragDepth = gl_FragCoord.z;\n\tvec3 color = gl_FrontFacing ? front_color : back_color;\n\toutColor = vec4(color, u_opacity);\n}\n";

	var vertexOutlinedV1 = "#version 100\n\nattribute vec3 v_position;\nattribute vec3 v_normal;\nattribute vec3 v_barycentric;\n\nuniform mat4 u_projection;\nuniform mat4 u_modelView;\nuniform mat4 u_matrix;\nuniform vec3 u_frontColor;\nuniform vec3 u_backColor;\nvarying vec3 normal_color;\nvarying vec3 barycentric;\nvarying vec3 front_color;\nvarying vec3 back_color;\n\nvoid main () {\n\tgl_Position = u_matrix * vec4(v_position, 1);\n\tbarycentric = v_barycentric;\n\n\tnormal_color = vec3(\n\t\tdot(v_normal, normalize(u_modelView * vec4(1, 0, 0, 0)).xyz),\n\t\tdot(v_normal, normalize(u_modelView * vec4(0, 1, 0, 0)).xyz),\n\t\tdot(v_normal, normalize(u_modelView * vec4(0, 0, 1, 0)).xyz)\n\t);\n\t// normal_color = vec3(\n\t// \tdot(v_normal, vec4(1, 0, 0, 0).xyz),\n\t// \tdot(v_normal, vec4(0, 1, 0, 0).xyz),\n\t// \tdot(v_normal, vec4(0, 0, 1, 0).xyz)\n\t// );\n\n\tfloat grayX = abs(normal_color.x);\n\tfloat grayY = abs(normal_color.y);\n\tfloat grayZ = abs(normal_color.z);\n\tfloat gray = 0.25 + clamp(grayY, 1.0, 0.25) * 0.5 + grayX * 0.25 + grayZ * 0.25;\n\tfloat c = clamp(gray, 0.0, 1.0);\n\tfront_color = u_frontColor * c;\n\tback_color = u_backColor * c;\n}\n";

	var fragmentOutlinedV1 = "#version 100\n\nprecision mediump float;\nuniform float u_opacity;\nvarying vec3 barycentric;\nvarying vec3 front_color;\nvarying vec3 back_color;\n\n// float edgeFactor(vec3 barycenter) {\n// \tvec3 d = fwidth(barycenter);\n// \tvec3 a3 = smoothstep(vec3(0.0), d*3.5, barycenter);\n// \treturn min(min(a3.x, a3.y), a3.z);\n// }\n\nvoid main () {\n\tvec3 color = gl_FrontFacing ? front_color : back_color;\n\t// gl_FragColor = vec4(blend_color.rgb, u_opacity);\n\t// gl_FragDepth = 0.5;\n\n\t// barycentric #1\n\tgl_FragColor = any(lessThan(barycentric, vec3(0.02)))\n\t\t? vec4(0.0, 0.0, 0.0, 1.0)\n\t\t: vec4(color, u_opacity);\n\t// barycentric #2\n\t// gl_FragColor = vec4(mix(vec3(0.0), color, edgeFactor(barycentric)), u_opacity);\n}\n";

	var vertexOutlinedV2 = "#version 300 es\n\n// uniform mat4 u_projection;\nuniform mat4 u_modelView;\nuniform mat4 u_matrix;\nuniform vec3 u_frontColor;\nuniform vec3 u_backColor;\n\nin vec3 v_position;\nin vec3 v_normal;\nin vec3 v_barycentric;\nin float v_rawEdge;\n// in uint8_t \nout vec3 front_color;\nout vec3 back_color;\nout vec3 barycentric;\n// flat out int rawEdge;\nflat out int provokedVertex;\n\nvoid main () {\n\tgl_Position = u_matrix * vec4(v_position, 1);\n\tprovokedVertex = gl_VertexID;\n\tbarycentric = v_barycentric;\n\t// rawEdge = int(v_rawEdge);\n\n\tvec3 normal_color = vec3(\n\t\tdot(v_normal, normalize(u_modelView * vec4(1, 0, 0, 0)).xyz),\n\t\tdot(v_normal, normalize(u_modelView * vec4(0, 1, 0, 0)).xyz),\n\t\tdot(v_normal, normalize(u_modelView * vec4(0, 0, 1, 0)).xyz)\n\t);\n\t// normal_color = vec3(\n\t// \tdot(v_normal, vec4(1, 0, 0, 0).xyz),\n\t// \tdot(v_normal, vec4(0, 1, 0, 0).xyz),\n\t// \tdot(v_normal, vec4(0, 0, 1, 0).xyz)\n\t// );\n\n\tfloat grayX = abs(normal_color.x);\n\tfloat grayY = abs(normal_color.y);\n\tfloat grayZ = abs(normal_color.z);\n\tfloat gray = 0.25 + clamp(grayY, 1.0, 0.25) * 0.5 + grayX * 0.25 + grayZ * 0.25;\n\tfloat c = clamp(gray, 0.0, 1.0);\n\tfront_color = u_frontColor * c;\n\tback_color = u_backColor * c;\n}\n";

	var fragmentOutlinedV2 = "#version 300 es\n// precision mediump float;\nprecision highp float;\n\nuniform float u_opacity;\n\nuniform vec2 u_touch;\nuniform vec2 u_resolution;\n\n// in int gl_PrimitiveID;\n// in highp vec4 gl_FragCoord;\n// in mediump vec2 gl_PointCoord; // 0.0 to 1.0, location on the screen\n// in bool gl_FrontFacing;\n// out highp float gl_FragDepth;\n\nflat in int provokedVertex;\n\nin vec3 front_color;\nin vec3 back_color;\nin vec3 barycentric;\n// flat in int rawEdge;\nout vec4 outColor;\n\nfloat hue2rgb (float p, float q, float t) {\n\twhile (t < 0.0) t += 1.0;\n\twhile (t > 1.0) t -= 1.0;\n\tif (t < 1.0 / 6.0) return p + (q - p) * 6.0 * t;\n\tif (t < 1.0 / 2.0) return q;\n\tif (t < 2.0 / 3.0) return p + (q - p) * (2.0 / 3.0 - t) * 6.0;\n\treturn p;\n}\nvec3 hslToRgb (float h, float s, float l) {\n\tif (s == 0.0) { return vec3(l, l, l); }\n\tfloat q = l < 0.5 ? l * (1.0 + s) : l + s - l * s;\n\tfloat p = 2.0 * l - q;\n\tfloat r = hue2rgb(p, q, h + 1.0 / 3.0);\n\tfloat g = hue2rgb(p, q, h);\n\tfloat b = hue2rgb(p, q, h - 1.0 / 3.0);\n\treturn vec3(r, g, b);\n}\n\nfloat edgeFactor(vec3 barycenter) {\n\tvec3 d = fwidth(barycenter);\n\tvec3 a3 = smoothstep(vec3(0.0), d*3.5, barycenter);\n\treturn min(min(a3.x, a3.y), a3.z);\n}\n\nvoid main () {\n\tgl_FragDepth = gl_FragCoord.z;\n\tvec3 color = gl_FrontFacing ? front_color : back_color;\n\t// vec3 color = hslToRgb(float(gl_PrimitiveID) / 57.0, 0.5, 0.8);\n\t// vec3 color = hslToRgb(float(provokedVertex) * 1.618, 1.0, 0.45);\n\n\t// original output\n\t// outColor = vec4(color, u_opacity);\n\n\t// barycentric #1\n\t// outColor = any(lessThan(barycentric, vec3(0.02)))\n\t// \t? vec4(0.0, 0.0, 0.0, 1.0)\n\t// \t: vec4(color, u_opacity);\n\n\t// barycentric #2\n\toutColor = vec4(mix(vec3(0.0), color, edgeFactor(barycentric)), u_opacity);\n\t// barycentric #2, transparent faces (kindof. bug)\n\t// outColor = vec4(1.0, 1.0, 1.0, (1.0-edgeFactor(barycentric))*0.95);\n\n\t// // barycentric #3 with raw edge\n\t// bool side2 = bool(rawEdge & 1);\n\t// bool side0 = bool(rawEdge & 2);\n\t// bool side1 = bool(rawEdge & 4);\n\t// if ((barycentric.x < 0.02 && side0)\n\t// \t|| (barycentric.y < 0.02 && side1)\n\t// \t|| (barycentric.z < 0.02 && side2)) {\n\t// \toutColor = vec4(0.0, 0.0, 0.0, 1.0);\n\t// }\n\t// else {\n\t// \toutColor = vec4(color, u_opacity);\n\t// }\n\n\t\n\t// if (provokedVertex == 8) {\n\t// \toutColor = vec4(1, 1, 0, 1);\n\t// }\n\n\t// vec2 fragScale = vec2(gl_FragCoord.x / u_resolution.x, gl_FragCoord.y / u_resolution.y);\n\t// vec2 touchScale = vec2(u_touch.x / u_resolution.x, u_touch.y / u_resolution.y);\n\t// // fix. invert.\n\t// touchScale.y = 1.0 - touchScale.y;\n\t// float dist = distance(touchScale, fragScale);\n\t// if (dist < 0.1) {\n\t// \tfloat t = dist / 0.1;\n\t// \toutColor.r = outColor.r * t + 1.0 * (1.0 - t);\n\t// }\n}\n";

	var vertexThickEdgesV1$1 = "#version 100\n\nattribute vec3 v_position;\nattribute vec3 v_color;\nattribute vec3 edge_vector;\nattribute vec2 vertex_vector;\n\nuniform mat4 u_matrix;\nuniform mat4 u_projection;\nuniform mat4 u_modelView;\nuniform float u_strokeWidth;\nvarying vec3 blend_color;\n\nvoid main () {\n\tvec3 edge_norm = normalize(edge_vector);\n\t// find an axis with which to compute the cross product\n\t// we want the axis which is most unlike the edge_vector\n\tfloat xdot = abs(dot(vec3(1,0,0), edge_norm));\n\tfloat ydot = abs(dot(vec3(0,1,0), edge_norm));\n\tfloat zdot = abs(dot(vec3(0,0,1), edge_norm));\n\tvec3 xory = xdot < ydot ? vec3(1,0,0) : vec3(0,1,0);\n\tvec3 axis = xdot > zdot && ydot > zdot ? vec3(0,0,1) : xory;\n\t// these are two perpendicular vectors to the edge_vector\n\t// together all three of them are the basis vectors\n\tvec3 one = cross(axis, edge_norm);\n\tvec3 two = cross(one, edge_norm);\n\t// displace the point along a vector from its original spot\n\tvec3 displace = normalize(\n\t\tone * vertex_vector.x +\n\t\ttwo * vertex_vector.y) * u_strokeWidth;\n\t// gl_Position = u_matrix * vec4(vec3(side, 0) + v_position, 1);\n\tgl_Position = u_matrix * vec4(v_position + displace, 1);\n\t// gl_Position = u_matrix * vec4(v_position, 1);\n\tblend_color = v_color;\n}\n";

	var vertexThickEdgesV2$1 = "#version 300 es\n\nuniform mat4 u_matrix;\nuniform mat4 u_projection;\nuniform mat4 u_modelView;\nuniform float u_strokeWidth;\n\nin vec3 v_position;\nin vec3 v_color;\nin vec3 edge_vector;\nin vec2 vertex_vector;\nout vec3 blend_color;\n\nvoid main () {\n\tvec3 edge_norm = normalize(edge_vector);\n\t// find an axis with which to compute the cross product\n\t// we want the axis which is most unlike the edge_vector\n\tfloat xdot = abs(dot(vec3(1,0,0), edge_norm));\n\tfloat ydot = abs(dot(vec3(0,1,0), edge_norm));\n\tfloat zdot = abs(dot(vec3(0,0,1), edge_norm));\n\tvec3 xory = xdot < ydot ? vec3(1,0,0) : vec3(0,1,0);\n\tvec3 axis = xdot > zdot && ydot > zdot ? vec3(0,0,1) : xory;\n\t// these are two perpendicular vectors to the edge_vector\n\t// together all three of them are the basis vectors\n\tvec3 one = cross(axis, edge_norm);\n\tvec3 two = cross(one, edge_norm);\n\t// displace the point along a vector from its original spot\n\tvec3 displace = normalize(\n\t\tone * vertex_vector.x +\n\t\ttwo * vertex_vector.y) * u_strokeWidth;\n\t// gl_Position = u_matrix * vec4(vec3(side, 0) + v_position, 1);\n\tgl_Position = u_matrix * vec4(v_position + displace, 1);\n\t// gl_Position = u_matrix * vec4(v_position, 1);\n\tblend_color = v_color;\n}\n";

	var fragmentSimpleV1$1 = "#version 100\n\nprecision mediump float;\nvarying vec3 blend_color;\n\nvoid main () {\n\tgl_FragColor = vec4(blend_color.rgb, 1);\n}\n";

	var fragmentSimpleV2$1 = "#version 300 es\n\nprecision mediump float;\nin vec3 blend_color;\nout vec4 outColor;\n \nvoid main() {\n\toutColor = vec4(blend_color.rgb, 1);\n}\n";

	const foldedFormFaces = (gl, version = 1, graph = {}, options = {}) => {
		const exploded = makeExplodedGraph(graph, options.layerNudge);
		const program = version === 1
			? createProgram(gl, vertexV1, fragmentV1)
			: createProgram(gl, vertexV2, fragmentV2);
		return {
			program,
			vertexArrays: makeFoldedVertexArrays(gl, program, exploded, options),
			elementArrays: makeFoldedElementArrays(gl, version, exploded),
			flags: [gl.DEPTH_TEST],
			makeUniforms: makeUniforms$1,
		};
	};
	const foldedFormEdges = (gl, version = 1, graph = {}, options = {}) => {
		const program = version === 1
			? createProgram(gl, vertexThickEdgesV1$1, fragmentSimpleV1$1)
			: createProgram(gl, vertexThickEdgesV2$1, fragmentSimpleV2$1);
		return {
			program,
			vertexArrays: makeThickEdgesVertexArrays(gl, program, graph, options),
			elementArrays: makeThickEdgesElementArrays(gl, version, graph),
			flags: [gl.DEPTH_TEST],
			makeUniforms: makeUniforms$1,
		};
	};
	const foldedFormFacesOutlined = (gl, version = 1, graph = {}, options = {}) => {
		const exploded = makeExplodedGraph(graph, options.layerNudge);
		const program = version === 1
			? createProgram(gl, vertexOutlinedV1, fragmentOutlinedV1)
			: createProgram(gl, vertexOutlinedV2, fragmentOutlinedV2);
		return {
			program,
			vertexArrays: makeFoldedVertexArrays(gl, program, exploded, options),
			elementArrays: makeFoldedElementArrays(gl, version, exploded),
			flags: [gl.DEPTH_TEST],
			makeUniforms: makeUniforms$1,
		};
	};

	var foldedPrograms = /*#__PURE__*/Object.freeze({
		__proto__: null,
		foldedFormFaces: foldedFormFaces,
		foldedFormEdges: foldedFormEdges,
		foldedFormFacesOutlined: foldedFormFacesOutlined
	});

	const WebGLFoldedForm = (gl, version = 1, graph = {}, options = {}) => {
		const programs = [];
		if (options.faces !== false) {
			if (options.outlines === false) {
				programs.push(foldedFormFaces(gl, version, graph, options));
			} else {
				programs.push(foldedFormFacesOutlined(gl, version, graph, options));
			}
		}
		if (options.edges === true) {
			programs.push(foldedFormEdges(gl, version, graph, options));
		}
		return programs;
	};

	const ASSIGNMENT_COLOR = {
		B: [0.3, 0.3, 0.3],
		b: [0.3, 0.3, 0.3],
		V: [0.2, 0.4, 0.6],
		v: [0.2, 0.4, 0.6],
		M: [0.75, 0.25, 0.15],
		m: [0.75, 0.25, 0.15],
		F: [0.2, 0.2, 0.2],
		f: [0.2, 0.2, 0.2],
		U: [0.2, 0.2, 0.2],
		u: [0.2, 0.2, 0.2],
	};
	const make2D$1 = (coords) => coords
		.map(coord => [0, 1]
			.map(i => coord[i] || 0));
	const makeCPEdgesVertexData = (graph, assignment_color = ASSIGNMENT_COLOR) => {
		if (!graph || !graph.vertices_coords || !graph.edges_vertices) { return []; }
		const vertices_coords = make2D$1(graph.edges_vertices
			.flatMap(edge => edge
				.map(v => graph.vertices_coords[v]))
			.flatMap(coord => [coord, coord]));
		const edgesVector = make2D$1(makeEdgesVector(graph));
		const vertices_color = graph.edges_assignment
			? graph.edges_assignment.flatMap(a => [
				assignment_color[a],
				assignment_color[a],
				assignment_color[a],
				assignment_color[a],
			])
			: graph.edges_vertices.flatMap(() => [
				assignment_color.U,
				assignment_color.U,
				assignment_color.U,
				assignment_color.U,
			]);
		const verticesEdgesVector = edgesVector
			.flatMap(el => [el, el, el, el]);
		const vertices_vector = graph.edges_vertices
			.flatMap(() => [[1, 0], [-1, 0], [-1, 0], [1, 0]]);
		return {
			vertices_coords,
			vertices_color,
			verticesEdgesVector,
			vertices_vector,
		};
	};

	var cpData = /*#__PURE__*/Object.freeze({
		__proto__: null,
		makeCPEdgesVertexData: makeCPEdgesVertexData
	});

	const makeCPEdgesVertexArrays = (gl, program, graph) => {
		if (!graph || !graph.vertices_coords || !graph.edges_vertices) {
			return [];
		}
		const {
			vertices_coords,
			vertices_color,
			verticesEdgesVector,
			vertices_vector,
		} = makeCPEdgesVertexData(graph);
		return [{
			location: gl.getAttribLocation(program, "v_position"),
			buffer: gl.createBuffer(),
			type: gl.FLOAT,
			length: 2,
			data: new Float32Array(vertices_coords.flat()),
		}, {
			location: gl.getAttribLocation(program, "v_color"),
			buffer: gl.createBuffer(),
			type: gl.FLOAT,
			length: vertices_color[0].length,
			data: new Float32Array(vertices_color.flat()),
		}, {
			location: gl.getAttribLocation(program, "edge_vector"),
			buffer: gl.createBuffer(),
			type: gl.FLOAT,
			length: verticesEdgesVector[0].length,
			data: new Float32Array(verticesEdgesVector.flat()),
		}, {
			location: gl.getAttribLocation(program, "vertex_vector"),
			buffer: gl.createBuffer(),
			type: gl.FLOAT,
			length: vertices_vector[0].length,
			data: new Float32Array(vertices_vector.flat()),
		}].filter(el => el.location !== -1);
	};
	const makeCPEdgesElementArrays = (gl, version = 1, graph = {}) => {
		if (!graph || !graph.edges_vertices) { return []; }
		const edgesTriangles = graph.edges_vertices
			.map((_, i) => i * 4)
			.flatMap(i => [i + 0, i + 1, i + 2, i + 2, i + 3, i + 0]);
		return [{
			mode: gl.TRIANGLES,
			buffer: gl.createBuffer(),
			data: version === 2
				? new Uint32Array(edgesTriangles)
				: new Uint16Array(edgesTriangles),
		}];
	};
	const make2D = (coords) => coords
		.map(coord => [0, 1]
			.map(i => coord[i] || 0));
	const makeCPFacesVertexArrays = (gl, program, graph) => {
		if (!graph || !graph.vertices_coords) { return []; }
		const vertices_color = graph.vertices_coords.map(() => [0.11, 0.11, 0.11]);
		return [{
			location: gl.getAttribLocation(program, "v_position"),
			buffer: gl.createBuffer(),
			type: gl.FLOAT,
			length: 2,
			data: new Float32Array(make2D(graph.vertices_coords).flat()),
		}, {
			location: gl.getAttribLocation(program, "v_color"),
			buffer: gl.createBuffer(),
			type: gl.FLOAT,
			length: vertices_color[0].length,
			data: new Float32Array(vertices_color.flat()),
		}].filter(el => el.location !== -1);
	};
	const makeCPFacesElementArrays = (gl, version = 1, graph = {}) => {
		if (!graph || !graph.vertices_coords || !graph.faces_vertices) { return []; }
		return [{
			mode: gl.TRIANGLES,
			buffer: gl.createBuffer(),
			data: version === 2
				? new Uint32Array(triangulateConvexFacesVertices(graph).flat())
				: new Uint16Array(triangulateConvexFacesVertices(graph).flat()),
		}];
	};

	var cpArrays = /*#__PURE__*/Object.freeze({
		__proto__: null,
		makeCPEdgesVertexArrays: makeCPEdgesVertexArrays,
		makeCPEdgesElementArrays: makeCPEdgesElementArrays,
		makeCPFacesVertexArrays: makeCPFacesVertexArrays,
		makeCPFacesElementArrays: makeCPFacesElementArrays
	});

	const makeUniforms = (gl, {
		projectionMatrix, viewMatrix, modelMatrix, strokeWidth,
	}) => ({
		u_matrix: {
			func: "uniformMatrix4fv",
			value: math.core.multiplyMatrices4(math.core
				.multiplyMatrices4(projectionMatrix, viewMatrix), modelMatrix),
		},
		u_projection: {
			func: "uniformMatrix4fv",
			value: projectionMatrix,
		},
		u_modelView: {
			func: "uniformMatrix4fv",
			value: math.core.multiplyMatrices4(viewMatrix, modelMatrix),
		},
		u_strokeWidth: {
			func: "uniform1f",
			value: strokeWidth / 2,
		},
	});

	var vertexSimpleV1 = "#version 100\n\nuniform mat4 u_matrix;\n\nattribute vec2 v_position;\nattribute vec3 v_color;\nvarying vec3 blend_color;\n\nvoid main () {\n\tgl_Position = u_matrix * vec4(v_position, 0, 1);\n\tblend_color = v_color;\n}\n";

	var vertexThickEdgesV1 = "#version 100\n\nattribute vec2 v_position;\nattribute vec3 v_color;\nattribute vec2 edge_vector;\nattribute vec2 vertex_vector;\n\nuniform mat4 u_matrix;\nuniform mat4 u_projection;\nuniform mat4 u_modelView;\nuniform float u_strokeWidth;\nvarying vec3 blend_color;\n\nvoid main () {\n\t// dot(normal, (u_modelView * vec4(1, 0, 0, 0)).xyz),\n\t// this one works\n\tfloat sign = vertex_vector[0];\n\tvec2 side = normalize(vec2(edge_vector.y * sign, -edge_vector.x * sign)) * u_strokeWidth;\n\tgl_Position = u_matrix * vec4(side + v_position, 0, 1);\n\n\t// vec3 forward = (u_modelView * vec4(0, 0, 1, 0)).xyz;\n\t// float sign = vertex_vector[0];\n\t// vec2 side = normalize(vec2(edge_vector.y * sign, -edge_vector.x * sign));\n\t// vec3 side3d = (u_modelView * vec4(side, 0, 1)).xyz;\n\t// vec3 c = normalize(cross(side3d, forward)) * u_strokeWidth;\n\t// // gl_Position = u_matrix * vec4(v_position.x + c.x, v_position.y + c.y, c.z, 1);\n\t// gl_Position = u_matrix * vec4(v_position, 0, 1) + u_projection * vec4(c, 1);\n\t\n\t// vec3 forward = (u_modelView * vec4(0, 0, 1, 0)).xyz;\n\t// vec3 edgeVec3d = (u_modelView * vec4(edge_vector, 0, 0)).xyz;\n\t// vec3 thick = normalize(cross(edgeVec3d, forward)) * sign * u_strokeWidth;\n\t// vec2 side = normalize(vec2(edge_vector.y * sign, -edge_vector.x * sign)) * u_strokeWidth;\n\t// vec4 projected_vector = u_matrix * vec4(normalize(vec2(edge_vector.y * sign, -edge_vector.x * sign)), 0, 1);\n\t// gl_Position = u_matrix * vec4(v_position, 0, 1) + vec4(thick.xyz, 0);\n\t// gl_Position = u_matrix * vec4(v_position, 0, 1) + vec4(0, u_strokeWidth * sign, 0, 0);\n\tblend_color = v_color;\n}\n";

	var fragmentSimpleV1 = "#version 100\n\nprecision mediump float;\nvarying vec3 blend_color;\n\nvoid main () {\n\tgl_FragColor = vec4(blend_color.rgb, 1);\n}\n";

	var vertexSimpleV2 = "#version 300 es\n\nuniform mat4 u_matrix;\n\nin vec2 v_position;\nin vec3 v_color;\nout vec3 blend_color;\n// flat out vec3 blend_color;\n\nvoid main () {\n\tgl_Position = u_matrix * vec4(v_position, 0, 1);\n\tblend_color = v_color;\n}\n";

	var vertexThickEdgesV2 = "#version 300 es\n\nuniform mat4 u_matrix;\nuniform mat4 u_projection;\nuniform mat4 u_modelView;\nuniform float u_strokeWidth;\n\nin vec2 v_position;\nin vec3 v_color;\nin vec2 edge_vector;\nin vec2 vertex_vector;\nout vec3 blend_color;\n\nvoid main () {\n\t// dot(normal, (u_modelView * vec4(1, 0, 0, 0)).xyz),\n\t// this one works\n\tfloat sign = vertex_vector[0];\n\tvec2 side = normalize(vec2(edge_vector.y * sign, -edge_vector.x * sign)) * u_strokeWidth;\n\tgl_Position = u_matrix * vec4(side + v_position, 0, 1);\n\tblend_color = v_color;\n}\n";

	var fragmentSimpleV2 = "#version 300 es\nprecision mediump float;\n// precision highp float;\n\n// flat in vec4 blend_color;\nin vec3 blend_color;\nout vec4 outColor;\n \nvoid main() {\n\toutColor = vec4(blend_color.rgb, 1);\n}\n";

	const cpFacesV1 = (gl, version = 1, graph = {}) => {
		const program = createProgram(gl, vertexSimpleV1, fragmentSimpleV1);
		return {
			program,
			vertexArrays: makeCPFacesVertexArrays(gl, program, graph),
			elementArrays: makeCPFacesElementArrays(gl, version, graph),
			flags: [],
			makeUniforms,
		};
	};
	const cpEdgesV1 = (gl, version = 1, graph = {}) => {
		const program = createProgram(gl, vertexThickEdgesV1, fragmentSimpleV1);
		return {
			program,
			vertexArrays: makeCPEdgesVertexArrays(gl, program, graph),
			elementArrays: makeCPEdgesElementArrays(gl, version, graph),
			flags: [],
			makeUniforms,
		};
	};
	const cpFacesV2 = (gl, version = 2, graph = {}) => {
		const program = createProgram(gl, vertexSimpleV2, fragmentSimpleV2);
		return {
			program,
			vertexArrays: makeCPFacesVertexArrays(gl, program, graph),
			elementArrays: makeCPFacesElementArrays(gl, version, graph),
			flags: [],
			makeUniforms,
		};
	};
	const cpEdgesV2 = (gl, version = 2, graph = {}) => {
		const program = createProgram(gl, vertexThickEdgesV2, fragmentSimpleV2);
		return {
			program,
			vertexArrays: makeCPEdgesVertexArrays(gl, program, graph),
			elementArrays: makeCPEdgesElementArrays(gl, version, graph),
			flags: [],
			makeUniforms,
		};
	};

	var cpPrograms = /*#__PURE__*/Object.freeze({
		__proto__: null,
		cpFacesV1: cpFacesV1,
		cpEdgesV1: cpEdgesV1,
		cpFacesV2: cpFacesV2,
		cpEdgesV2: cpEdgesV2
	});

	const WebGLCreasePattern = (gl, version = 1, graph = {}) => {
		switch (version) {
		case 1:
			return [cpFacesV1(gl, version, graph), cpEdgesV1(gl, version, graph)];
		case 2:
		default:
			return [cpFacesV2(gl, version, graph), cpEdgesV2(gl, version, graph)];
		}
	};

	var webgl = Object.assign(
		Object.create(null),
		{
			createProgram,
			initialize: initializeWebGL,
			foldedForm: WebGLFoldedForm,
			creasePattern: WebGLCreasePattern,
		},
		view,
		program,
		foldedArrays,
		foldedData,
		foldedPrograms,
		cpArrays,
		cpData,
		cpPrograms,
	);

	const ear = Object.assign(root, ObjectConstructors, {
		math: math.core,
		axiom,
		diagram,
		layer,
		singleVertex,
		text,
		convert,
		webgl,
	});
	Object.keys(math)
		.filter(key => key !== "core")
		.forEach((key) => { ear[key] = math[key]; });
	Object.defineProperty(ear, "use", {
		enumerable: false,
		value: use.bind(ear),
	});
	if (!isWebWorker) {
		ear.use(FOLDtoSVG);
		ear.use(SVG);
	}
	Object.defineProperty(ear, "window", {
		enumerable: false,
		set: value => {
			setWindow$1(value);
			SVG.window = value;
		},
	});

	return ear;

}));
