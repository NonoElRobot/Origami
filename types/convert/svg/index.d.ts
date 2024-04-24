declare const _default: {
    parseCSSStyleSheet: (sheet: CSSStyleSheet) => any;
    parseStyleElement: (style: SVGStyleElement) => any[];
    getStylesheetStyle: (key: any, nodeName: any, attributes: any, sheets?: any[]) => any;
    lineToSegments: (line: Element) => [number, number, number, number][];
    pathToSegments: (path: Element) => [number, number, number, number][];
    polygonToSegments: (polygon: Element) => [number, number, number, number][];
    polylineToSegments: (polyline: Element) => [number, number, number, number][];
    rectToSegments: (rect: Element) => [number, number, number, number][];
    facesVerticesPolygon: (graph: any, options: any) => SVGElement[];
    facesEdgesPolygon: (graph: any, options: any) => SVGElement[];
    drawFaces: (graph: any, options: any) => SVGElement | SVGElement[];
    edgesPaths: (graph: FOLD, options?: any) => SVGElement;
    edgesLines: (graph: FOLD, options?: any) => SVGElement;
    drawEdges: (graph: any, options: any) => SVGElement;
    drawVertices: (graph: any, options?: {}) => SVGElement;
    drawBoundaries: (graph: any, options?: {}) => SVGElement;
    colorToAssignment: (color: any, customAssignments: any) => any;
    opacityToFoldAngle: (opacity: any, assignment: any) => number;
    getEdgeStroke: (element: any, attributes: any) => string;
    getEdgeOpacity: (element: any, attributes: any) => number;
};
export default _default;
//# sourceMappingURL=index.d.ts.map