/*
 * Boardfarm Management application
 * Copyright (c) 2016 Heiko Stuebner <heiko@sntech.de>
 *
 * License:
 *   MIT: https://opensource.org/licenses/MIT
 *   See the LICENSE file in the project's top-level directory for details.
 */

var fritz = require("../Fritz");
var smartfritz = require('fritzapi');
var power = require("./Power");
var ipower = require("./IPowerAdapter");
var ipower = require("./IPowerPort");

qx.Class.define("sn.boardfarm.backend.power.FritzDect",
{
	extend : qx.core.Object,
	implement :
	[
			sn.boardfarm.backend.power.IPowerAdapter,
			sn.boardfarm.backend.power.IPowerPort
	],

	construct : function(ain, port)
	{
		var pwr = sn.boardfarm.backend.power.Power.getInstance();

		console.log("Power: added Fritz!DECT 200 adapter " + ain);
		this.setAdapterIdent("fritzdect:"+ain);
		this.setAin(ain);
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
		board : { init : null, nullable : true },
		ain : { init : "", check : "String"}
	},

	members :
	{
		__powerConnectListener : null,
		adapterReadPower : function()
		{
			var fr = sn.boardfarm.backend.Fritz.getInstance();
			var sid = fr.getSid();

			/* cleanup if we came from a deferred read */
			if (this.__powerConnectListener)
				fr.removeListenerById(this.__powerConnectListener);

			/* no sid, schedule a state read on connect */
			if (!sid) {
				this.__states = { 0 : -1 };

				this.__powerConnectListener = fr.addListener("connect", function(e) {
					this.adapterReadState();
				}, this);

				return;
			}

			var base = this;
			var moreParam = { url : "http://192.168.178.1" };
			smartfritz.getSwitchPower(fr.getSid(), this.getAin(), moreParam).then(function(value){
				if (value == "inval")
					value = 0;

				/*
				 * old smartfritz returned mV, fritzapi returns W
				 * We'll stay with mV for now.
				 */
				base.fireDataEvent("adapterPowerChanged", value * 1000);
			});
		},

		__states : null,
		__stateConnectListener : null,

		adapterReadState : function()
		{
			var fr = sn.boardfarm.backend.Fritz.getInstance();
			var sid = fr.getSid();

			/* cleanup if we came from a deferred read */
			if (this.__stateConnectListener)
				fr.removeListenerById(this.__stateConnectListener);

			/* no sid, schedule a state read on connect */
			if (!sid) {
				this.__states = { 0 : -1 };

				this.__stateConnectListener = fr.addListener("connect", function(e) {
					this.adapterReadState();
				}, this);

				return;
			}

			var base = this;
			var moreParam = { url : "http://192.168.178.1" };
			smartfritz.getSwitchState(fr.getSid(), this.getAin(), moreParam).then(function(state) {
				if (state == "inval")
					state = 0;
				base.__states = { 0 : parseInt(state) };
			});
		},

		adapterGetPortNum : function()
		{
			 return 1;
		},

		adapterShutdown : function()
		{
			this.adapterSetPortState(0, 0);
		},

		adapterGetPort : function(port)
		{
			return this;
		},

		adapterGetPortState : function(port)
		{
			return this.__states[0];
		},

		__stateChangeConnectListener : null,
		adapterSetPortState : function(port, newState)
		{
			var fr = sn.boardfarm.backend.Fritz.getInstance();
			var sid = fr.getSid();

			/* cleanup if we came from a deferred read */
			if (this.__stateChangeConnectListener)
				fr.removeListenerById(this.__stateChangeConnectListener);

			/* no sid, schedule a state setting on connect */
			if (!sid) {
				this.__states = { 0 : -1 };

				this.__stateChangeConnectListener = fr.addListener("connect", function(e) {
					this.adapterSetPortState(port, newState);
				}, this);

				return;
			}

			var base = this;
			var moreParam = { url : "http://192.168.178.1" };
			if (newState == 0) {
				smartfritz.setSwitchOff(fr.getSid(), this.getAin(), moreParam).then(function(sid) {
					base.__states[0] = 0;
					base.fireDataEvent("adapterPortStateChanged", { port : port, state : newState });
					console.log("Power: set port " + parseInt(port) + " of " + base.getAdapterIdent() + " to "+ newState);
				});
			} else {
				smartfritz.setSwitchOn(fr.getSid(), this.getAin(), moreParam).then(function(sid) {
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
