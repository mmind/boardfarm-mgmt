var boards = require('./Boards');
var boards = require('./power/Power');

qx.Class.define("sn.boardfarm.backend.Board",
{
	extend : qx.core.Object,

	construct : function(name)
	{
		this.setName(name);

		inst = sn.boardfarm.backend.Boards.getInstance();
		var data = inst.getBoardEntry(name).split(":");

		this.setArch(data[1]);
		this.setPort(data[2]);

		this.__power = sn.boardfarm.backend.power.Power.getInstance().portFactory(data[3], data[4], data[5]);
		this.__power.setBoard(this);

		console.log("Board: added "+name + " on port " + this.__power.getPort()+" of "+ this.__power.portGetAdapter().getAdapterIdent());
	},

	properties :
	{
		name : {},
		arch : {},
		port : { init : 0 }
	},

	members :
	{
		__power : null,

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
		}
	}
});
