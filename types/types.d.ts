type FOLDFrame = {
    frame_author?: string;
    frame_title?: string;
    frame_description?: string;
    frame_classes?: string[];
    frame_attributes?: string[];
    frame_unit?: string;
    vertices_coords?: [number, number][] | [number, number, number][];
    vertices_vertices?: number[][];
    vertices_edges?: number[][];
    vertices_faces?: (number | null | undefined)[][];
    edges_vertices?: number[][];
    edges_faces?: (number | null | undefined)[][];
    edges_assignment?: string[];
    edges_foldAngle?: number[];
    edges_length?: number[];
    faces_vertices?: number[][];
    faces_edges?: number[][];
    faces_faces?: (number | null | undefined)[][];
    faceOrders?: [number, number, number][];
    edgeOrders?: [number, number, number][];
};
type FOLDInternalFrame = FOLDFrame & {
    frame_parent?: number;
    frame_inherit?: boolean;
};
type FOLDFileMetadata = {
    file_frames?: FOLDInternalFrame[];
    file_spec?: number;
    file_creator?: string;
    file_author?: string;
    file_title?: string;
    file_description?: string;
    file_classes?: string[];
};
type FOLDOutOfSpec = {
    faces_center?: ([number, number] | [number, number, number])[];
    faces_normal?: ([number, number] | [number, number, number])[];
    edges_vector?: ([number, number] | [number, number, number])[];
    faces_polygon?: ([number, number] | [number, number, number])[][];
    faces_matrix?: number[][];
    vertices_sectors?: number[][];
};
type FOLD = FOLDFileMetadata & FOLDFrame & FOLDOutOfSpec;
type VecLine2 = {
    vector: [number, number];
    origin: [number, number];
};
type VecLine3 = {
    vector: [number, number, number];
    origin: [number, number, number];
};
type VecLine = {
    vector: [number, number] | [number, number, number];
    origin: [number, number] | [number, number, number];
};
type UniqueLine = {
    normal: [number, number];
    distance: number;
};
type Box = {
    min: number[];
    max: number[];
    span?: number[];
};
type Circle = {
    radius: number;
    origin: [number, number];
};
type SweepEvent = {
    vertices: number[];
    t: number;
    start: number[];
    end: number[];
};
type TacoTacoConstraint = [number, number, number, number];
type TacoTortillaConstraint = [number, number, number];
type TortillaTortillaConstraint = [number, number, number, number];
type TransitivityConstraint = [number, number, number];
type LayerBranch = LayerFork[];
type LayerOrders = {
    [key: string]: number;
};
type LayerFork = {
    orders: LayerOrders;
    branches?: LayerFork[][];
};
type LayerSolverSolution = LayerFork;
type FaceOrdersBranch = FaceOrdersFork[];
type FaceOrders = [number, number, number][];
type FaceOrdersFork = {
    orders: [number, number, number][];
    branches?: FaceOrdersFork[][];
};
type FaceOrdersSolverSolution = FaceOrdersFork;
