/*
 * Boardfarm Management application
 * Copyright (c) 2016 Heiko Stuebner <heiko@sntech.de>
 *
 * License:
 *   MIT: https://opensource.org/licenses/MIT
 *   See the LICENSE file in the project's top-level directory for details.
 */

var pwr = require("./FritzDect");
var pwr = require("./Servo");
var pwr = require("./Ykush");

qx.Class.define("sn.boardfarm.backend.power.Power",
{
	extend : qx.core.Object,
	type : "singleton",

	members :
	{
		portFactory : function(type, ident, port)
		{
			var pwr;

			switch(type) {
				case "fritzdect":
					pwr = new sn.boardfarm.backend.power.FritzDect(ident, port);
					break;
				case "servo":
					pwr = new sn.boardfarm.backend.power.Servo(ident, port);
					break;
				case "ykush":
					pwr = new sn.boardfarm.backend.power.YkushPort(ident, port);
					break;
				default:
					throw "Undefined power method " + data[3] + " for " + ident + ":" + port;
			}

			return pwr;
		},

		__adapters : {},

		addAdapter : function(adapter, obj)
		{
			if (this.__adapters[adapter])
				throw "Adapter " + adapter + " already present";
			this.__adapters[adapter] = obj;

			/* get initial state reading */
			obj.adapterReadState();
		},

		getAdapter : function(adapter)
		{
			if (!this.__adapters[adapter])
				throw "Adapter " + adapter + " not found";

			return this.__adapters[adapter];
		},

		listAdapters : function()
		{
			return Object.keys(this.__adapters);
		},

		refreshAll : function()
		{
			for (var key in this.__adapters) {
				this.__adapters[key].adapterReadState();
			}
		}
	}
});
