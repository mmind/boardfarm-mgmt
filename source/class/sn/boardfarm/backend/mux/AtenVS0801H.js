/*
 * Boardfarm Management application
 * Copyright (c) 2017 Heiko Stuebner <heiko@sntech.de>
 *
 * License:
 *   MIT: https://opensource.org/licenses/MIT
 *   See the LICENSE file in the project's top-level directory for details.
 */

var mux = require("./AbstractMux");

/*
 * Aten VS0801H is a rackmountable 8-to-1 hdmi mux
 * with a serial interface capable of also switch ports.
 * Serial connection as specified by the manual:
 * - baud rate: 19200
 * - data bits: 8
 * - parity:    none
 * - stop bits: 1
 * - flow ctrl: none
 *
 * The control interface numbers ports from 1-8, we do 0-7
 */
qx.Class.define("sn.boardfarm.backend.mux.AtenVS0801H",
{
	extend : sn.boardfarm.backend.mux.AbstractMux,

	construct : function(ident, ctrl, pwr)
	{
		console.log("Mux: added Aten VS0801H HDMI Mux at " + ctrl);
		this.base(arguments, ident, ctrl, pwr);

		var mux = sn.boardfarm.backend.mux.Mux.getInstance();

		this.__sPortExpect = [];

		/* setup serialport instance */
		const { SerialPort } = require("serialport");
		const { ReadlineParser } = require("@serialport/parser-readline");
		this.__sPort = new SerialPort({
				path: ctrl,
				baudRate: 19200
		});

		this.__sParser = this.__sPort.pipe(new ReadlineParser({ delimiter: '\n' }));

		this.__sPort.on('open',
			qx.lang.Function.bind(this._serialPortOpen, this));
		this.__sPort.on('close',
			qx.lang.Function.bind(this._serialPortClose, this));
		this.__sPort.on('error',
			qx.lang.Function.bind(this._serialPortError, this));

		this.__sParser.on('data',
			qx.lang.Function.bind(this._serialPortData, this));

		mux.addMux(this.getIdent(), this);
	},

	events :
	{
		"sourcePortChanged" : "qx.event.type.Data",
		"stateChanged" : "qx.event.type.Data"
	},

	properties :
	{
		sourcePort : { init : -1, apply : "_applySourcePort", event : "sourcePortChanged" },
		state : { init : -1, apply : "_applyState", event : "stateChanged" },
	},

	members :
	{
		__sPort : null,
		__sPortReady : false,
		__sPortExpect : null,
		__sParser : null,

		_serialPortOpen : function()
		{
			this.__sPortReady = true;

			/* we want an initial state reading once open */
			this._serialPortWrite("read");
		},

		_serialPortClose : function()
		{
			this.__sPortReady = false;
		},

		_serialPortData : function(data)
		{
			/* remove the last \r */
			data = data.substring(0, data.length - 1);

			if (this.__sPortExpect.length == 0) {
				console.log("Mux: " + this.getIdent() + " received unexpected line " + data);
				return;
			}

			var expect = this.__sPortExpect.shift();

			/* only "read" produces additional output */
			if (expect == "") {
				this._handleReadData(data);
				return;
			}

			if (data != expect)
				console.log("Mux: on " + this.getIdent() + " line /" + data + "/ did not match expectation /" + expect + "/");
		},

		_serialPortError : function(err)
		{
			console.log(this.getIdent() + " error: ", err.message);
		},

		_serialPortWrite : function(data)
		{
			if (!this.__sPortReady)
				throw "port not ready yet";

			this.__sPortExpect.push(data + " Command OK");

			/* read commands will return 5 additional lines */
			if (data == "read") {
				for (var i = 0; i < 5; i++)
					this.__sPortExpect.push("");
			}

			this.__sPort.write(data + "\r\n");
		},

		_handleReadData : function(data)
		{
			var d = data.split(":");
			var par = d[0];
			var val = d[1].substring(1);

			switch (par) {
			case "Input":
				var port = val.substring(4) - 1;
				this.setSourcePort(port);
				break;

			case "Output":
				var state = (val == "ON") ? 1 : 0;
				this.setState(state);
				break;
			case "Mode":
			case "Goto":
			case "F/W":
				break;
			default:
				console.log("Mux: unknown read parameter " + par + " on " + this.getIdent());
			}
		},

		getDestinationPort : function()
		{
			return 0;
		},

		setDestinationPort : function(n)
		{
			if (n == 0)
				return;

			throw "AtenVS0801H only has one output port";
		},

		/*
		 * Port change involves:
		 * Send: sw i01
		 * Recv: sw i01 Command OK
		 */
		_applySourcePort : function(n, o)
		{
			/* initial port setting, nothing to do */
			if (o == -1)
				return;

			console.log("Mux: setting source port to " + n + " on " + this.getIdent());
			this._serialPortWrite("sw i0"+(parseInt(n)+1));
		},

		/* State change involves:
		 * Send: sw off
		 * Recv: sw off Command OK
		 */
		_applyState : function(n, o)
		{
			/* initial state setting, nothing to do */
			if (o == -1)
				return;

			console.log("Mux: " + (n ? "enabling" : "disabling" ) + " " + this.getIdent());
			this._serialPortWrite("sw "+(n ? "on" : "off"));
		},

		muxReadState : function()
		{
			try {
				this._serialPortWrite("read");
			} catch(e) {
			}
		}
	}
});
