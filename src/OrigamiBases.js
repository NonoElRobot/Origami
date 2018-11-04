
export const unitSquare = {
	"file_spec": 1.1,
	"file_creator": "",
	"file_author": "",
	"file_classes": ["singleModel"],
	"frame_attributes": ["2D"],
	"frame_title": "",
	"frame_classes": ["creasePattern"],
	"vertices_coords": [[0,0], [1,0], [1,1], [0,1]],
	"edges_vertices": [[0,1], [1,2], [2,3], [3,0]],
	"edges_assignment": ["B","B","B","B"],
	"faces_vertices": [[0,1,2,3]],
	"file_frames": [{
		"frame_classes": ["creasePattern"],
		"frame_parent":0,
		"inherit":true
	}]
};

export const blintz = {
	"file_spec": 1.1,
	"frame_title": "blintz base",
	"file_classes": ["singleModel"],
	"frame_classes": ["foldedState"],
	"frame_attributes": ["2D"],
	"vertices_coords": [[0.5,0.5], [0.5,0], [0.5,0.5], [1,0.5], [0.5,0.5], [0.5,1], [0.5,0.5], [0,0.5]],
	"edges_vertices": [[0,1], [1,2], [2,3], [3,4], [4,5], [5,6], [6,7], [7,0], [1,3], [3,5], [5,7], [7,1]],
	"edges_assignment": ["B","B","B","B","B","B","B","B","V","V","V","V"],
	"faces_vertices": [[0,1,7], [2,3,1], [4,5,3], [6,7,5], [1,3,5,7]],
	"file_frames": [{
		"frame_classes": ["creasePattern"],
		"frame_parent": 0,
		"inherit": true,
		"vertices_coords": [[0,0], [0.5,0], [1,0], [1,0.5], [1,1], [0.5,1], [0,1], [0,0.5]]
	}]
};

export const kite = {
	"file_spec": 1.1,
	"frame_title": "kite base",
	"file_classes": ["singleModel"],
	"frame_classes": ["creasePattern"],
	"frame_attributes": ["2D"],
	"vertices_coords": [[0,0],[1,0],[1,1],[0,1],[0.414213562373095,0],[1,0.585786437626905]],
	"edges_vertices": [[2,3],[3,0],[3,1],[3,4],[0,4],[4,1],[3,5],[1,5],[5,2]],
	"edges_assignment": ["B","B","V","M","B","B","M","B","B"],
	"faces_vertices": [[2,3,5],[3,0,4],[3,1,5],[1,3,4]],
	"file_frames": [{
		"frame_classes": ["foldedState"],
		"frame_parent": 0,
		"frame_inherit": true,
		"vertices_coords": [[0.707106781186548,0.292893218813452],[1,0],[0.707106781186548,0.292893218813452],[0,1],[0.414213562373095,0],[1,0.585786437626905]]
	}]
};

export const fish = {
	"file_spec": 1.1,
	"frame_title": "fish base",
	"file_author": "Robby Kraft",
	"file_classes": ["singleModel"],
	"frame_classes": ["creasePattern"],
	"frame_attributes": ["2D"],
	"vertices_coords": [[0,0],[1,0],[1,1],[0,1],[0.292893218813452,0.292893218813452],[0.707106781186548,0.707106781186548],[0.292893218813452,0],[1,0.707106781186548]],
	"edges_vertices": [[2,3],[3,0],[3,1],[0,4],[1,4],[3,4],[1,5],[2,5],[3,5],[4,6],[0,6],[6,1],[5,7],[1,7],[7,2]],
	"edges_assignment": ["B","B","F","M","M","M","M","M","M","V","B","B","V","B","B"],
	"faces_vertices": [[2,3,5],[3,0,4],[3,1,5],[1,3,4],[4,0,6],[1,4,6],[5,1,7],[2,5,7]],
	"faces_edges": [[0,8,7],[1,3,5],[2,6,8],[2,5,4],[3,10,9],[4,9,11],[6,13,12],[7,12,14]],
	"file_frames": [{
		"frame_classes": ["foldedState"],
		"frame_parent": 0,
		"frame_inherit": true,
		"vertices_coords": [[0.707106781186548,0.292893218813452],[1,0],[0.707106781186548,0.292893218813452],[0,1],[0.292893218813452,0.292893218813452],[0.707106781186548,0.707106781186548],[0.5,0.5],[0.5,0.5]]
	}]
};

export const bird = {
	"file_spec": 1.1,
	"frame_title": "bird base",
	"file_classes": ["singleModel"],
	"frame_classes": ["creasePattern"],
	"frame_attributes": ["2D"],
	"vertices_coords": [[0,0],[1,0],[1,1],[0,1],[0.5,0.5],[0.207106781186548,0.5],[0.5,0.207106781186548],[0.792893218813452,0.5],[0.5,0.792893218813452],[0.353553390593274,0.646446609406726],[0.646446609406726,0.646446609406726],[0.646446609406726,0.353553390593274],[0.353553390593274,0.353553390593274],[0,0.5],[0.5,0],[1,0.5],[0.5,1]],
	"faces_vertices": [[3,5,9],[5,3,13],[0,5,13],[5,0,12],[4,5,12],[5,4,9],[0,6,12],[6,0,14],[1,6,14],[6,1,11],[4,6,11],[6,4,12],[1,7,11],[7,1,15],[2,7,15],[7,2,10],[4,7,10],[7,4,11],[2,8,10],[8,2,16],[3,8,16],[8,3,9],[4,8,9],[8,4,10]],
	"edges_vertices": [[3,5],[0,5],[4,5],[0,6],[1,6],[4,6],[1,7],[2,7],[4,7],[2,8],[3,8],[4,8],[5,9],[9,8],[9,4],[3,9],[8,10],[10,7],[4,10],[10,2],[7,11],[11,6],[4,11],[11,1],[6,12],[12,5],[0,12],[12,4],[5,13],[0,13],[13,3],[6,14],[0,14],[14,1],[7,15],[1,15],[15,2],[8,16],[3,16],[16,2]],
	"edges_assignment": ["M","M","M","M","M","M","M","M","M","M","M","M","F","F","F","F","F","F","V","V","F","F","F","F","F","F","V","V","V","B","B","V","B","B","V","B","B","V","B","B"]
};

export const frog = {
	"file_spec": 1.1,
	"frame_title": "frog base",
	"file_classes": ["singleModel"],
	"frame_classes": ["creasePattern"],
	"frame_attributes": ["2D"],
	"vertices_coords": [[0,0],[1,0],[1,1],[0,1],[0.5,0.5],[0,0.5],[0.5,0],[1,0.5],[0.5,1],[0.146446609406726,0.353553390593274],[0.353553390593274,0.146446609406726],[0.646446609406726,0.146446609406726],[0.853553390593274,0.353553390593274],[0.853553390593274,0.646446609406726],[0.646446609406726,0.853553390593274],[0.353553390593274,0.853553390593274],[0.146446609406726,0.646446609406726],[0,0.353553390593274],[0,0.646446609406726],[0.353553390593274,0],[0.646446609406726,0],[1,0.353553390593274],[1,0.646446609406726],[0.646446609406726,1],[0.353553390593274,1]],
	"faces_vertices": [[0,4,9],[4,0,10],[4,2,14],[2,4,13],[3,4,15],[4,3,16],[4,1,12],[1,4,11],[4,5,9],[5,4,16],[4,6,11],[6,4,10],[4,7,13],[7,4,12],[4,8,15],[8,4,14],[0,9,17],[9,5,17],[10,0,19],[6,10,19],[1,11,20],[11,6,20],[12,1,21],[7,12,21],[2,13,22],[13,7,22],[14,2,23],[8,14,23],[3,15,24],[15,8,24],[16,3,18],[5,16,18]],
	"edges_vertices": [[0,4],[4,2],[3,4],[4,1],[4,5],[4,6],[4,7],[4,8],[0,9],[4,9],[5,9],[4,10],[0,10],[6,10],[1,11],[4,11],[6,11],[4,12],[1,12],[7,12],[2,13],[4,13],[7,13],[4,14],[2,14],[8,14],[3,15],[4,15],[8,15],[4,16],[3,16],[5,16],[9,17],[0,17],[17,5],[16,18],[5,18],[18,3],[10,19],[0,19],[19,6],[11,20],[6,20],[20,1],[12,21],[1,21],[21,7],[13,22],[7,22],[22,2],[14,23],[8,23],[23,2],[15,24],[3,24],[24,8]],
	"edges_assignment": ["V","V","V","M","V","V","V","V","M","M","M","M","M","M","M","M","M","M","M","M","M","M","M","M","M","M","M","M","M","M","M","M","V","B","B","V","B","B","V","B","B","V","B","B","V","B","B","V","B","B","V","B","B","V","B","B"]
};