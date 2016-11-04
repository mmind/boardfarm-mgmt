/*
 * Boardfarm Management application
 * Copyright (c) 2016 Heiko Stuebner <heiko@sntech.de>
 *
 * License:
 *   MIT: https://opensource.org/licenses/MIT
 *   See the LICENSE file in the project's top-level directory for details.
 */

qx.Interface.define("sn.boardfarm.backend.power.IPowerAdapter",
{
	events :
	{
		"adapterPowerChanged" : "qx.event.type.Data",
		"adapterPortStateChanged" : "qx.event.type.Data"
	},

	properties :
	{
		adapterIdent : {}
	},

	members :
	{
		adapterReadPower : function() {},
		adapterReadState : function() {},

		adapterGetPortNum : function() {},

		/*
		 * Get the power port object attached to this port
		 */
		adapterGetPort : function(port) {},

		adapterGetPortState : function(port) {},
		adapterSetPortState : function(port, state) {}
	}
});
