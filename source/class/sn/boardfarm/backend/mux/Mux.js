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
		muxFactory : function(type, ident, ctrl, pwr)
		{
			var pwr;

			switch(type) {
				case "atenvs0801h":
					pwr = new sn.boardfarm.backend.mux.AtenVS0801H(ident, ctrl, pwr);
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

		createMuxFromConfig : function(mux)
		{
			var cfg = sn.boardfarm.backend.Config.getInstance();
			var m = cfg.getMux(mux);
			var instance = this.muxFactory(m.type, mux, m.ctrl, m.pwr);
		},

		createMuxes : function()
		{
			var cfg = sn.boardfarm.backend.Config.getInstance();
			var muxes = cfg.getMuxes();

			/* no muxes, nothing to do */
			if (!muxes)
				return;

			muxes = Object.keys(muxes);
			for (var i = 0; i < muxes.length; i++)
				this.createMuxFromConfig(muxes[i]);
		},

		getMux : function(mux)
		{
			if (!this.__muxes[mux])
				this.createMuxFromConfig(mux);

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
