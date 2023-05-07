/* svg (c) Kraft, MIT License */
import SVGWindow from '../environment/window.js';
import { transformStringToMatrix } from './transforms.js';
import { svg_multiplyMatrices2 } from './algebra.js';

const xmlStringToElement = (input, mimeType = "text/xml") => {
	const result = (new (SVGWindow().DOMParser)()).parseFromString(input, mimeType);
	return result ? result.documentElement : null;
};
const getRootParent = (el) => {
	let parent = el;
	while (parent.parentNode != null) {
		parent = parent.parentNode;
	}
	return parent;
};
const findElementTypeInParents = (element, nodeName) => {
	if ((element.nodeName || "") === nodeName) {
		return element;
	}
	return element.parentNode
		? findElementTypeInParents(element.parentNode, nodeName)
		: undefined;
};
const polyfillClassListAdd = (el, ...classes) => {
	const hash = {};
	const getClass = el.getAttribute("class");
	const classArray = getClass ? getClass.split(" ") : [];
	classArray.push(...classes);
	classArray.forEach(str => { hash[str] = true; });
	const classString = Object.keys(hash).join(" ");
	el.setAttribute("class", classString);
};
const addClass = (el, ...classes) => {
	if (!el || !classes.length) { return undefined; }
	return el.classList
		? el.classList.add(...classes)
		: polyfillClassListAdd(el, ...classes);
};
const flattenDomTree = (el) => (
	el.childNodes == null || !el.childNodes.length
		? [el]
		: Array.from(el.childNodes).flatMap(child => flattenDomTree(child))
);
const nodeSpecificAttrs = {
	svg: ["viewBox", "xmlns", "version"],
	line: ["x1", "y1", "x2", "y2"],
	rect: ["x", "y", "width", "height"],
	circle: ["cx", "cy", "r"],
	ellipse: ["cx", "cy", "rx", "ry"],
	polygon: ["points"],
	polyline: ["points"],
	path: ["d"],
};
const getAttributes = element => {
	const attributeValue = element.attributes;
	if (attributeValue == null) { return []; }
	const attributes = Array.from(attributeValue);
	return nodeSpecificAttrs[element.nodeName]
		? attributes
			.filter(a => !nodeSpecificAttrs[element.nodeName].includes(a.name))
		: attributes;
};
const objectifyAttributes = (list) => {
	const obj = {};
	list.forEach((a) => { obj[a.nodeName] = a.value; });
	return obj;
};
const attrAssign = (parentAttrs, element) => {
	const attrs = objectifyAttributes(getAttributes(element));
	if (!attrs.transform && !parentAttrs.transform) {
		return { ...parentAttrs, ...attrs };
	}
	const elemTransform = attrs.transform || "";
	const parentTransform = parentAttrs.transform || "";
	const elemMatrix = transformStringToMatrix(elemTransform);
	const parentMatrix = transformStringToMatrix(parentTransform);
	const matrix = svg_multiplyMatrices2(parentMatrix, elemMatrix);
	const transform = `matrix(${matrix.join(", ")})`;
	return { ...parentAttrs, ...attrs, transform };
};
const flattenDomTreeWithStyle = (element, attributes = {}) => (
	element.childNodes == null || !element.childNodes.length
		? [{ element, attributes }]
		: Array.from(element.childNodes)
			.flatMap(child => flattenDomTreeWithStyle(child, attrAssign(attributes, child)))
);

export { addClass, findElementTypeInParents, flattenDomTree, flattenDomTreeWithStyle, getRootParent, xmlStringToElement };
