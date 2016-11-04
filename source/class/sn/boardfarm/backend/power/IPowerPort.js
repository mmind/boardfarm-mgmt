/*
 * Boardfarm Management application
 * Copyright (c) 2016 Heiko Stuebner <heiko@sntech.de>
 *
 * License:
 *   MIT: https://opensource.org/licenses/MIT
 *   See the LICENSE file in the project's top-level directory for details.
 */

qx.Interface.define("sn.boardfarm.backend.power.IPowerPort",
{
	properties :
	{
		board : {}
	},

	members :
	{
		portGetAdapter : function() {},

		/*
		 * Get the state of this port, 1 on, 0 off
		 */
		portGetState : function() {},

		/*
		 * Set the state of this port, 1 on, 0 off
		 */
		portSetState : function(newState) {},
	}
});
