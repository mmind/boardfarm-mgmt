/*
 * Boardfarm Management application
 * Copyright (c) 2016 Heiko Stuebner <heiko@sntech.de>
 *
 * License:
 *   MIT: https://opensource.org/licenses/MIT
 *   See the LICENSE file in the project's top-level directory for details.
 */

var power = require("./Power");
var ipower = require("./IPowerPort");
var exec = require('child_process').exec;

qx.Class.define("sn.boardfarm.backend.power.Servo",
{
	extend : qx.core.Object,
	implement :
	[
			sn.boardfarm.backend.power.IPowerAdapter,
			sn.boardfarm.backend.power.IPowerPort
	],

	construct : function(dutPort, port)
	{
		var pwr = sn.boardfarm.backend.power.Power.getInstance();

		console.log("Power: added Google Servo board at port " + dutPort);
		this.setAdapterIdent("servo:"+dutPort);
		this.setDutPort(dutPort);
		this.__states = { 0 : -1 };

		pwr.addAdapter(this.getAdapterIdent(), this);

		this.setPort(0);
	},

	events :
	{
		"adapterPowerChanged" : "qx.event.type.Data",
		"adapterPortStateChanged" : "qx.event.type.Data"
	},

	properties :
	{
		adapterIdent : {},
		port : {},
		board : {},
		dutPort: {}
	},

	members :
	{
		adapterReadPower : function()
		{
			/* can't read power measurements */
			this.fireDataEvent("adapterPowerChanged", 0);
		},

		__states : {},

		adapterReadState : function()
		{
			var base = this;

			child = exec("/usr/bin/dut-control -p " + this.getDutPort(), function (error, stdout, stderr)
			{
				if (error !== null) {
					console.log("dut-control command returned " + error);
					this.__states = { 0 : -1 };
					return;
				}

				var data = stdout.split("\n");
				for (var i = 0; i < data.length; i++) {

					if (data[i].indexOf("power_state") == -1)
						continue;

					var state = data[i].split(":");
					switch(state[1]) {
						default:
							console.log("unknown state " + state[1]);
						case "ERR": /* fallthrough */
							base.__states = { 0 : -1 };
							break;
						}
				}
			});
		},

		adapterGetPortNum : function()
		{
			 return 1;
		},

		adapterGetPort : function(port)
		{
			return this;
		},

		adapterGetPortState : function(port)
		{
			return this.__states[0];
		},

		adapterSetPortState : function(port, newState)
		{
			var base = this;

			if (newState == 0) {
				child = exec("/usr/bin/dut-control -p " + this.getDutPort() + " power_state:off", function (error, stdout, stderr)
				{
					base.__states[0] = 0;
					base.fireDataEvent("adapterPortStateChanged", { port : port, state : newState });
					console.log("Power: set port " + parseInt(port) + " of " + base.getAdapterIdent() + " to "+ newState);
				});
				return;
			} else {
				/*
				 * setting power_state:on from a cold device
				 * doesn't work most of the time, so we're
				 * trying to go through cold_reset for broader
				 * compatibility.
				 */
				var cmd = "/usr/bin/dut-control -p " + this.getDutPort() + " cold_reset:on"
				cmd += " && sleep 1"
				cmd += " && /usr/bin/dut-control -p " + this.getDutPort() + " cold_reset:off"
				child = exec(cmd, function (error, stdout, stderr)
				{
					base.__states[0] = 1;
					base.fireDataEvent("adapterPortStateChanged", { port : port, state : newState });
					console.log("Power: set port " + parseInt(port) + " of " + base.getAdapterIdent() + " to "+ newState);
				});
			}
		},

		portGetAdapter : function()
		{
			return this;
		},

		portGetState : function()
		{
			return this.portGetAdapter().adapterGetPortState(this.getPort());
		},

		portSetState : function(newState)
		{
			this.portGetAdapter().adapterSetPortState(this.getPort(), newState);
		}
	}
});
