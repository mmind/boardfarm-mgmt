var power = require("./Power");
var ipower = require("./IPowerPort");

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
	},

	events :
	{
		"adapterPowerChanged" : "qx.event.type.Data"
	},

	properties :
	{
		adapterIdent : {},
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
