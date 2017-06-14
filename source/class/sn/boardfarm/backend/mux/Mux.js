/*
 * Boardfarm Management application
 * Copyright (c) 2017 Heiko Stuebner <heiko@sntech.de>
 *
 * License:
 *   MIT: https://opensource.org/licenses/MIT
 *   See the LICENSE file in the project's top-level directory for details.
 */

var mux = require("./AtenVS0801H");

/*
 * Mux management singleton
 */
qx.Class.define("sn.boardfarm.backend.mux.Mux",
{
	extend : qx.core.Object,
	type : "singleton",

	construct : function()
	{
	},

	members :
	{
		muxFactory : function(type, ident, ctrl)
		{
			var pwr;

			switch(type) {
				case "atenvs0801h":
					pwr = new sn.boardfarm.backend.mux.AtenVS0801H(ident, ctrl);
					break;
				default:
					throw "Undefined mux type " + type + " for " + ident + ": " + ctrl;
			}

			return pwr;
		},

		__muxes : {},

		addMux : function(mux, obj)
		{
			if (this.__muxes[mux])
				throw "Mux " + mux + " already present";
			this.__muxes[mux] = obj;

			/* get initial state reading */
			obj.muxReadState();
		},

		getMux : function(mux)
		{
			if (!this.__muxes[mux])
				throw "Mux " + mux + " not found";

			return this.__muxes[mux];
		},

		listMuxes : function()
		{
			return Object.keys(this.__muxes);
		},

		refreshAll : function()
		{
			for (var key in this.__muxes) {
				this.__muxes[key].muxReadState();
			}
		}
	}
});
