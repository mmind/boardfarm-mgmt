/*
 * Boardfarm Management application
 * Copyright (c) 2016-2018 Heiko Stuebner <heiko@sntech.de>
 *
 * License:
 *   MIT: https://opensource.org/licenses/MIT
 *   See the LICENSE file in the project's top-level directory for details.
 */

var power = require("./Power");
var request = require('request');
var ipower = require("./IPowerPort");
var exec = require('child_process').exec;

qx.Class.define("sn.boardfarm.backend.power.RemoteBackend",
{
	extend : qx.core.Object,
	implement : [ sn.boardfarm.backend.power.IPowerAdapter ],

	construct : function(serial)
	{
		var pwr = sn.boardfarm.backend.power.Power.getInstance();

		console.log("Power: added RemoteBackend " + serial);
		this.setAdapterIdent("remotebackend:"+serial);
		this.setSerial(serial);

		this.__states = [];
		this.__ports = [];
		this.__boards = {};
		this.__boardNames = [];

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

		__states : null,

		adapterReadState : function()
		{
			var child;
			var serial = this.getSerial();
			var base = this;

			var options = {
				url: 'http://' + this.getSerial() + ':3000/status',
				method: 'GET',
				headers: {
					'Accept': 'application/json',
					'Accept-Charset': 'utf-8',
					'User-Agent': 'my-reddit-client'
				}
			};

			var obj = this;
			request(options, function(err, res, body) {
				//FIXME: handle err?

				try {
					var status = JSON.parse(body);
					var keys = obj.__boardNames;
					var boards = Object.keys(status.boardStates);

					for (var j = 0; j < boards.length; j++) {
						for (var i = 0; i < keys.length; i++) {
							if (keys[i] == boards[j])
								obj.__states[i] = status.boardStates[boards[j]];
						}
					}
				} catch(ex) {
				}
			});
		},

		__ports : null,
		__boards : null,
		__boardNames : null,

		adapterAddPort : function(port, obj)
		{
			throw "RemoteBackend requires usage of adapterAddBoard function";
		},

		adapterAddBoard : function(board, obj)
		{
			if (this.__boards[board])
				throw "Board "+board+" already set on "+this.getAdapterIdent();

			this.__boards[board] = obj;

			/* Add translation between board and port number */
			var cur = this.__ports.length;
			this.__boardNames[cur] = board;
			this.__ports[cur] = obj;
			this.__states[cur] = -1;
			obj.setPort(cur);
		},

		adapterGetPortNum : function()
		{
			 return this.__ports.length;
		},

		adapterShutdown : function()
		{
			var child;
			var serial = this.getSerial();
			var base = this;

			console.log("Power: send shutdown to remote backend "+this.getSerial());

			var options = {
				url: 'http://' + this.getSerial() + ':3000/shutdown',
				method: 'GET',
				headers: {
					'Accept': 'application/json',
					'Accept-Charset': 'utf-8',
					'User-Agent': 'boardfarm-backend'
				}
			};

			var obj = this;
			request(options, function(err, res, body) {
			});
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
			var cmd = newState ? "on" : "off";

			var options = {
				url: 'http://' + this.getSerial() + ':3000/boards/' + this.__boardNames[port] + '/power/'+cmd,
				method: 'GET',
				headers: {
					'Accept': 'application/json',
					'Accept-Charset': 'utf-8',
					'User-Agent': 'my-reddit-client'
				}
			};

			request(options, function(err, res, body) {
				//FIXME: more error handling?
				if (err) {
					console.log(err);
					return;
				}

				base.__states[port] = newState;
				base.fireDataEvent("adapterPortStateChanged", { port : port, state : newState });
				console.log("Power: set port " + parseInt(port) + " of " + base.getAdapterIdent() + " to "+ newState);
			});
		}
	}
});

qx.Class.define("sn.boardfarm.backend.power.RemoteBackendPort",
{
	extend : qx.core.Object,
	implement : [ sn.boardfarm.backend.power.IPowerPort ],

	construct : function(serial, board)
	{
		var pwr = sn.boardfarm.backend.power.Power.getInstance();

		try {
			this.__adapter = pwr.getAdapter("remotebackend:" + serial);
		} catch(ex) {
			this.__adapter = new sn.boardfarm.backend.power.RemoteBackend(serial);
		}

		this.setPortOrig(board);
		this.__adapter.adapterAddBoard(board, this);
		console.log("Power: mapped board "+board+" from RemoteBackend " + serial + " to port "+this.getPort());
	},

	properties :
	{
		/* The original string-based remote identifier */
		portOrig : {},

		/* The translated dynamic port number */
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
