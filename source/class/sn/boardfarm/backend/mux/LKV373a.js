/*
 * Boardfarm Management application
 * Copyright (c) 2017 Heiko Stuebner <heiko@sntech.de>
 *
 * License:
 *   MIT: https://opensource.org/licenses/MIT
 *   See the LICENSE file in the project's top-level directory for details.
 */

var mux = require("./AbstractMux");

/*
 * LKV373a is a cheap hdmi->network uni-/multicast encoder.
 * It doesn't really have any port control, but to be
 * able to control its power-state we also model it as mux.
 */
qx.Class.define("sn.boardfarm.backend.mux.LKV373a",
{
	extend : sn.boardfarm.backend.mux.AbstractMux,

	construct : function(ident, ctrl, pwr)
	{
		console.log("Mux: added LKV373a HDMI encoder " + ident);
		this.base(arguments, ident, ctrl, pwr);
	},

	members :
	{
		getDestinationPort : function()
		{
			return 0;
		},

		setDestinationPort : function(n)
		{
			if (n == 0)
				return;

			throw "LKV373a only has one output port";
		},

		getSourcePort : function()
		{
			return 0;
		},

		setSourcePort : function(n)
		{
			if (n == 0)
				return;

			throw "LKV373a only has one input port";
		}
	}
});
