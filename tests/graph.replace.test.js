import { expect, test } from "vitest";
import ear from "../src/index.js";

const graph = {
	vertices_coords: [
		[-0.001909307190396963, 0.21764344783120085],
		[0.24517501802668604, 0.9517802390855862],
		[0.006039349947071344, 0.20829299033896528],
		[0.2440059511590459, 0.9524697151219929],
		[0.6404285180020232, 0.6435864234941955],
		[0.7087180310059188, 0.4552124487148278],
		[0.005510613107705598, 0.21655320394605676],
		[0.7139660994755092, 0.4582948218446743],
		[0.005994386393809087, 0.21693481270269366],
		[0.6400373309040567, 0.644372981988839],
		[0.7163456906111709, 0.45874165960911734],
		[0.6414904984293182, 0.6533241744381391],
		[0.23975422698301938, 0.9429776466811459],
		[0.64310572075461, 0.6536288833909647],
		[0.7110837306511976, 0.45563597629605307],
		[0.6361936508708128, 0.6510278534131151],
		[-0.0001625821399819996, 0.21607779650853517],
		[0.6415339486224014, 0.6423248287700194],
		[0.23939653286603954, 0.939979137755126],
		[0.005631780506698969, 0.20823677978344754],
		[0.709342623465554, 0.45452006521439414],
		[0.6448711429320774, 0.6517715251287783],
		[0.7052727618919836, 0.4602003868880367],
		[0.23677251582363706, 0.9508151096912241],
		[0.23691633726315126, 0.9516669576591591],
		[0.7136296763895639, 0.4591714060738851],
		[0.7068958585231394, 0.45300794316449405],
		[0.24013080994722208, 0.9460298467540476],
		[0.644542165978088, 0.6559301559145365],
		[0.24841608291067824, 0.9402426211906101],
	],
	edges_vertices: [
		[0, 1],
		[2, 3],
		[4, 5],
		[6, 7],
		[8, 9],
		[10, 11],
		[12, 13],
		[14, 15],
		[16, 17],
		[18, 19],
		[20, 21],
		[22, 23],
		[24, 25],
		[26, 27],
		[28, 29],
	],
};

test("", () => {
	// {3:1, 8:6, 9:4, 10:7, 13:11, 14:7, 15:11, 16:0, 17:4,
	// 18:12, 19:2, 20:5, 21:11, 22:5, 24:23, 25:5, 26:5, 27:12, 28:11}
	const arr = [
		null, null, null, 1, null, null, null, null, 6, 4, 7, null,
		null, 11, 7, 11, 0, 4, 12, 2, 5, 11, 5, null, 23, 5, 5, 12, 11,
	];
	arr.forEach((el, i) => { if (el === null) { delete arr[i]; } });

	ear.graph.replace(graph, "vertices", arr);
	// console.log(graph);

	expect(true).toBe(true);
});
