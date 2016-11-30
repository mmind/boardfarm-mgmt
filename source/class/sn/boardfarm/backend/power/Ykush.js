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

qx.Class.define("sn.boardfarm.backend.power.Ykush",
{
	extend : qx.core.Object,
	implement : [ sn.boardfarm.backend.power.IPowerAdapter ],

	construct : function(serial)
	{
		var pwr = sn.boardfarm.backend.power.Power.getInstance();

		console.log("Power: added Ykush hub " + serial);
		this.setAdapterIdent("ykush:"+serial);
		this.setSerial(serial);
		this.__states = { 0 : -1, 1 : -1, 2 : -1 };

		pwr.addAdapter(this.getAdapterIdent(), this);
	},

	events :
	{
		"adapterPowerChanged" : "qx.event.type.Data",
		"adapterPortStateChanged" : "qx.event.type.Data"
	},

	properties :
	{
		adapterIdent : {},
		serial : {}
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
			var child;
			var serial = this.getSerial();
			var base = this;
			child = exec("ykush -s " + serial + " -g a", function (error, stdout, stderr)
			{
				if (error !== null) {
					console.log("ykush command returned " + error);
					this.__states = { 0 : -1, 1 : -1, 2 : -1 };
					return;
				}

				var data = stdout.split("\n");
				for (var i = 0; i < 3; i++) {
					var state = (data[i].indexOf(": DOWN") != -1) ? 0 : 1;
					base.__states[i] = state;
				}
			});
		},

		__ports : {},

		adapterAddPort : function(port, obj)
		{
			if (this.__ports[port])
				throw "Port "+port+" already set on "+this.getAdapterIdent();

			this.__ports[port] = obj;
		},

		adapterGetPortNum : function()
		{
			 return 3;
		},

		adapterGetPort : function(port)
		{
			if (!this.__ports[port])
				throw "Port "+port+" not set on "+this.getAdapterIdent();

			return this.__ports[port];
		},

		adapterGetPortState : function(port)
		{
			return this.__states[port];
		},

		adapterSetPortState : function(port, newState)
		{
			var child;
			var serial = this.getSerial();
			var base = this;
			var cmd = newState ? "-u" : "-d";

			child = exec("ykush -s " + serial + " " + cmd + " " + (parseInt(port) + 1), function (error, stdout, stderr)
			{
				if (error !== null) {
					console.log("ykush command returned " + error);
					return;
				}

				base.__states[port] = newState;
				base.fireDataEvent("adapterPortStateChanged", { port : port, state : newState });
				console.log("Power: set port " + parseInt(port) + " of " + base.getAdapterIdent() + " to "+ newState);
			});
		}
	}
});

qx.Class.define("sn.boardfarm.backend.power.YkushPort",
{
	extend : qx.core.Object,
	implement : [ sn.boardfarm.backend.power.IPowerPort ],

	construct : function(serial, port)
	{
		var pwr = sn.boardfarm.backend.power.Power.getInstance();

		try {
			this.__adapter = pwr.getAdapter("ykush:"+serial);
		} catch(ex) {
			this.__adapter = new sn.boardfarm.backend.power.Ykush(serial);
		}

		this.setPort(port);
		this.__adapter.adapterAddPort(port, this);
	},

	properties :
	{
		port : {},
		board : {}
	},

	members :
	{
		__adapter : null,

		portGetAdapter : function()
		{
			return this.__adapter;
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
