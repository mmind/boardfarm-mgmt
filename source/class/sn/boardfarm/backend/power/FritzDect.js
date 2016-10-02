var fritz = require("../Fritz");
var smartfritz = require("smartfritz");
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
	},

	events :
	{
		"adapterPowerChanged" : "qx.event.type.Data"
	},

	properties :
	{
		adapterIdent : {},
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
			var moreParam = { url : "192.168.178.1" };
			smartfritz.getSwitchPower(fr.getSid(), this.getAin(), function(value){
				if (value == "inval")
					value = 0;

				base.fireDataEvent("adapterPowerChanged", value);
			}, moreParam);
		},

		__states : {},
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
			var moreParam = { url : "192.168.178.1" };
			smartfritz.getSwitchState(fr.getSid(), this.getAin(), function(state){
				if (state == "inval")
					state = 0;
				base.__states = { 0 : state };
			}, moreParam);
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

		portGetAdapter : function()
		{
			return this;
		},

		portGetState : function()
		{
			return this.__states[0];
		},

		portPowerOff : function()
		{
			
//			this.constructor.__states[this.getDeviceId()][this.getPort()] = 0;
		},

		portPowerOn : function()
		{

		}
	}
});
