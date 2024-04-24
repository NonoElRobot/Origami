export function normalAxiom1(point1: [number, number], point2: [number, number]): [UniqueLine];
export function axiom1(point1: [number, number], point2: [number, number]): [VecLine2];
export function normalAxiom2(point1: [number, number], point2: [number, number]): [UniqueLine];
export function axiom2(point1: [number, number], point2: [number, number]): [VecLine2];
export function normalAxiom3(line1: UniqueLine, line2: UniqueLine): [UniqueLine?, UniqueLine?];
export function axiom3(line1: VecLine2, line2: VecLine2): [VecLine2?, VecLine2?];
export function normalAxiom4(line: UniqueLine, point: [number, number]): [UniqueLine];
export function axiom4({ vector }: VecLine2, point: [number, number]): [VecLine2];
export function normalAxiom5(line: UniqueLine, point1: [number, number], point2: [number, number]): [UniqueLine?, UniqueLine?];
export function axiom5(line: VecLine2, point1: [number, number], point2: [number, number]): VecLine2[];
export function normalAxiom6(line1: UniqueLine, line2: UniqueLine, point1: [number, number], point2: [number, number]): UniqueLine[];
export function axiom6(line1: VecLine2, line2: VecLine2, point1: [number, number], point2: [number, number]): VecLine2[];
export function normalAxiom7(line1: UniqueLine, line2: UniqueLine, point: [number, number]): [UniqueLine?];
export function axiom7(line1: VecLine2, line2: VecLine2, point: [number, number]): [VecLine2?];
//# sourceMappingURL=axioms.d.ts.map