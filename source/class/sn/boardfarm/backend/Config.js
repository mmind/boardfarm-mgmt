/*
 * Boardfarm Management application
 * Copyright (c) 2016 Heiko Stuebner <heiko@sntech.de>
 *
 * License:
 *   MIT: https://opensource.org/licenses/MIT
 *   See the LICENSE file in the project's top-level directory for details.
 */

qx.Class.define("sn.boardfarm.backend.Config",
{
	extend : qx.core.Object,
	type : "singleton",

	construct : function()
	{
	},

	properties :
	{
		listenHost : { init : "0.0.0.0" },
		listenPort : { init : 3000 },
		mainSupply : { init : { ident : "fritzdect:087610266671", port : 0 } },

		muxes :
		{
			init : null
		},

		boards :
		{
			init : null
		}
	},

	members :
	{
		getMux : function(mux)
		{
			var m = this.getMuxes();
			if (!m || !m[mux])
				throw "Mux " + mux + " does not exist";

			return m[mux];
		},

		getBoardMuxes : function(board)
		{
			var boards = this.getBoards();

			if (!boards || !boards[board])
				return [];

			return boards[board].muxes;
		}
	}

});
