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
var execSync = require('child_process').execSync;

qx.Class.define("sn.boardfarm.backend.power.AbstractCRelay",
{
	extend : qx.core.Object,

	construct : function(serial)
	{
		var pwr = sn.boardfarm.backend.power.Power.getInstance();

		console.log("Power: added " + this.getRelayType() +" CRelay " + serial);
		this.setAdapterIdent(this.getRelayType() + ":" + serial);
		this.setSerial(serial);

		var states = [];
		for (var i = 0; i < this.adapterGetPortNum(); i++)
			states.push(-1);
		this.__states = states;
		this.__ports = {};

		pwr.addAdapter(this.getAdapterIdent(), this);
	},

	events :
	{
		"adapterPowerChanged" : "qx.event.type.Data",
		"adapterPortStateChanged" : "qx.event.type.Data"
	},

	properties :
	{
		relayType : { init : "unknown" },

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

		__states : null,

		adapterReadState : function()
		{
			var child;
			var serial = this.getSerial();
			var base = this;

			/* FIXME: crelay most likely cannot read the relay state */
		},

		__ports : null,

		adapterShutdown : function()
		{
			for (var i = 0; i < this.adapterGetPortNum(); i++)
				this.adapterSetPortState(i, 0);
		},

		adapterAddPort : function(port, obj)
		{
			if (this.__ports[port])
				throw "Port "+port+" already set on "+this.getAdapterIdent();

			this.__ports[port] = obj;
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
			var cmd = newState ? "ON" : "OFF";

			error = execSync("sudo /usr/local/bin/crelay -s " + serial + " " + (parseInt(port) + 1) + " " + cmd);
			base.__states[port] = newState;
			base.fireDataEvent("adapterPortStateChanged", { port : port, state : newState });
			console.log("Power: set port " + parseInt(port) + " of " + base.getAdapterIdent() + " to "+ newState);
		}
	}
});

qx.Class.define("sn.boardfarm.backend.power.AbstractCRelayPort",
{
	extend : qx.core.Object,

	construct : function(serial, port)
	{
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
