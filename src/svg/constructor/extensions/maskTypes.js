/* svg (c) Kraft, MIT License */
import { str_string } from '../../environment/strings.js';
import makeUUID from '../../general/makeUUID.js';
import { setViewBox } from '../../general/viewBox.js';
import TransformMethods from './shared/transforms.js';
import methods from './shared/urls.js';
import * as dom from './shared/dom.js';

const makeIDString = function () {
	return Array.from(arguments)
		.filter(a => typeof a === str_string || a instanceof String)
		.shift() || makeUUID();
};
const maskArgs = (...args) => [makeIDString(...args)];
const maskTypes = {
	mask: {
		args: maskArgs,
		methods: {
			...TransformMethods,
			...methods,
			...dom,
		},
	},
	clipPath: {
		args: maskArgs,
		methods: {
			...TransformMethods,
			...methods,
			...dom,
		},
	},
	symbol: {
		args: maskArgs,
		methods: {
			...TransformMethods,
			...methods,
			...dom,
		},
	},
	marker: {
		args: maskArgs,
		methods: {
			size: setViewBox,
			setViewBox: setViewBox,
			...TransformMethods,
			...methods,
			...dom,
		},
	},
};

export { maskTypes as default };
