/*
 * Boardfarm Management application
 * Copyright (c) 2016 Heiko Stuebner <heiko@sntech.de>
 *
 * License:
 *   MIT: https://opensource.org/licenses/MIT
 *   See the LICENSE file in the project's top-level directory for details.
 */

var boards = require('./Boards');
var boards = require('./power/Power');
var boards = require('./mux/Mux');

qx.Class.define("sn.boardfarm.backend.Board",
{
	extend : qx.core.Object,

	construct : function(name)
	{
		var inst = sn.boardfarm.backend.Boards.getInstance();
		var cfg = sn.boardfarm.backend.Config.getInstance();
		var data = inst.getBoardEntry(name).split(":");

		this.setName(name);
		this.setArch(data[1]);
		this.setPort(data[2]);
		this.setSoc(data[6]);

		this.__power = sn.boardfarm.backend.power.Power.getInstance().portFactory(data[3], data[4], data[5]);
		this.__power.setBoard(this);

		this.__muxes = [];

		var muxes = cfg.getBoardMuxes(name);
		for (var i = 0; i < muxes.length; i++) {
			var mux = muxes[i].split(":");
			this.addMux(mux[0], mux[1]);
		}

		console.log("Board: added " + this.getSoc() + "-" + name + " on port " + this.__power.getPort()+" of "+ this.__power.portGetAdapter().getAdapterIdent());
	},

	properties :
	{
		name : {},
		arch : {},
		port : { init : 0 },
		soc : {}
	},

	members :
	{
		__power : null,
		__muxes : null,

		powerState : function()
		{
			return this.__power.portGetState();
		},

		powerOn : function()
		{
			this.__power.portSetState(1);
		},

		powerOff : function()
		{
			this.__power.portSetState(0);
		},

		reset : function()
		{
			/* Possibly add board-specific reset actions */

			/* Fallback powercycle */
		},

		addMux : function(ident, sourcePort)
		{
			this.__muxes.push({
				ident : ident,
				sourcePort : sourcePort
			});
		},

		/*
		 * Select a board
		 * Walk through the mux-list and turn on all entries
		 * to focus on this board.
		 * This is obviously not multi-user capable
		 */
		selectBoard : function()
		{
			var muxes = sn.boardfarm.backend.mux.Mux.getInstance();

			for (var i = 0; i < this.__muxes.length; i++) {
				var entry = this.__muxes[i];
				var mux = muxes.getMux(entry.ident);

				mux.setSourcePort(entry.sourcePort);
			}
		}
	}
});
