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

	properties :
	{
		adapterIdent : {},
		serial : {}
	},

	members :
	{
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
				throw "Port "+port+" already set on "+this.getIdent();

			this.__ports[port] = obj;
		},

		adapterGetPortNum : function()
		{
			 return 3;
		},

		adapterGetPort : function(port)
		{
			if (!this.__ports[port])
				throw "Port "+port+" not set on "+this.getIdent();

			return this.__ports[port];
		},

		adapterGetPortState : function(port)
		{
			return this.__states[port];
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
			return this.__adapter.adapterGetPortState(this.getPort());
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
