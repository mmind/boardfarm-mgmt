/*
 * Boardfarm Management application
 * Copyright (c) 2017 Heiko Stuebner <heiko@sntech.de>
 *
 * License:
 *   MIT: https://opensource.org/licenses/MIT
 *   See the LICENSE file in the project's top-level directory for details.
 */

var power = require("./Power");
var ipower = require("./IPowerPort");
var crelay = require("./AbstractCRelay");

qx.Class.define("sn.boardfarm.backend.power.SainSmart8",
{
	extend : sn.boardfarm.backend.power.AbstractCRelay,
	implement : [ sn.boardfarm.backend.power.IPowerAdapter ],

	construct : function(serial)
	{
		this.setRelayType("sainsmart8");
		this.base(arguments, serial);
	},

	members :
	{
		adapterGetPortNum : function()
		{
			 return 8;
		}
	}
});

qx.Class.define("sn.boardfarm.backend.power.SainSmart8Port",
{
	extend : sn.boardfarm.backend.power.AbstractCRelayPort,
	implement : [ sn.boardfarm.backend.power.IPowerPort ],

	construct : function(serial, port)
	{
		var pwr = sn.boardfarm.backend.power.Power.getInstance();

		try {
			this.__adapter = pwr.getAdapter("sainsmart8:"+serial);
		} catch(ex) {
			this.__adapter = new sn.boardfarm.backend.power.SainSmart8(serial);
		}

		this.base(arguments, serial, port);
	}
});
