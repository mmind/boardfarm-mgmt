/*
 * Boardfarm Management application
 * Copyright (c) 2017 Heiko Stuebner <heiko@sntech.de>
 *
 * License:
 *   MIT: https://opensource.org/licenses/MIT
 *   See the LICENSE file in the project's top-level directory for details.
 */

var mux = require("./AbstractMux");
var spawn = require("child_process").spawn;

/*
 * LKV373a is a cheap hdmi->network uni-/multicast encoder.
 * It doesn't really have any port control, but to be
 * able to control its power-state we also model it as mux.
 */
qx.Class.define("sn.boardfarm.backend.mux.LKV373a",
{
	extend : sn.boardfarm.backend.mux.AbstractMux,

	construct : function(ident, ctrl, pwr)
	{
		console.log("Mux: added LKV373a HDMI encoder " + ident);
		this.base(arguments, ident, ctrl, pwr);

		var mux = sn.boardfarm.backend.mux.Mux.getInstance();

		mux.addMux(this.getIdent(), this);
		mux.addSink(this.getIdent(), this);
	},

	events :
	{
		"stateChanged" : "qx.event.type.Data"
	},

	properties : {
		/*
		 * IP of the LKV373a
		 */
		deviceIp : { init : -1 },

		/*
		 * We use the mux-state to control ffmpeg streaming.
		 * So it is of course off on creation.
		 */
		state : { init : 0, apply : "_applyState", event : "stateChanged" },

		/*
		 * Where to cast to.
		 * Either the server 192.168.140.1 for the video stream to be
		 * processed via ffserver and ffmpeg, or any other IP in the
		 * local network (including the vpn) for the stream to be
		 * displayed directly via vlc or so.
		 */
		castDestination : { init : -1, apply : "_applyCastDestination" },
	},

	members :
	{
		getDestinationPort : function()
		{
			return 0;
		},

		setDestinationPort : function(n)
		{
			if (n == 0)
				return;

			throw "LKV373a only has one output port";
		},

		getSourcePort : function()
		{
			return 0;
		},

		setSourcePort : function(n)
		{
			if (n == 0)
				return;

			throw "LKV373a only has one input port";
		},

		__ffmpeg : null,

		/* Start or stop streaming to ffserver using ffmpeg */
		_applyState : function(n, o)
		{
// ffmpeg -i "udp://@192.168.140.1:5004?fifo_size=524288" -r 10 -g 20 -c:v copy -an -f ffm http://127.0.0.1:8090/hdmi1.ffm
			if (n) {
				var dest = this.getCastDestination();

				/* only start ffmpeg when we unicast to the server */
				if (dest != "192.168.140.1")
					return;

				this.__ffmpeg = spawn('ffmpeg', [
					'-i', '"udp://@192.168.140.1:5004?fifo_size=524288"',
					'-r', '10',
					'-g', '20',
					'-c:v', 'copy',
					'-an',
					'-f', 'ffm',
					'http://127.0.0.1:8090/hdmi1.ffm' ]);

				this.__ffmpeg.stdout.on('data', (data) => {
					console.log(`stdout: ${data}`);
				});

				this.__ffmpeg.stderr.on('data', (data) => {
					console.log(`stderr: ${data}`);
				});

				this.__ffmpeg.on('close', (code) => {
					console.log("child process exited with code ${code}");
				});


			} else {
				if (!this.__ffmpeg)
					return;

				this.__ffmpeg.kill();
			}
		},

		muxReadState : function()
		{
			/* empty */
		},

		_applyCastDestination : function(n, o)
		{
			var oldState = this.getState();

			if (oldState)
				this.setState(0);

//curl "http://192.168.140.10/dev/info.cgi?action=streaminfo&udp=y&rtp=n&multicast=n&unicast=y&mcastaddr=192.168.178.56&port=5004"

			if (oldState)
				this.setState(1);
		}

	}
});
