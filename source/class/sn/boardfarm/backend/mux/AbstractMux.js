/*
 * Boardfarm Management application
 * Copyright (c) 2017 Heiko Stuebner <heiko@sntech.de>
 *
 * License:
 *   MIT: https://opensource.org/licenses/MIT
 *   See the LICENSE file in the project's top-level directory for details.
 */

qx.Class.define("sn.boardfarm.backend.mux.AbstractMux",
{
	extend : qx.core.Object,

	construct : function(ident, ctrl, pwr)
	{
		this.base(arguments);

		this.setIdent(ident);
		this.setCtrl(ctrl);

		this.__downstream = [];

		if (pwr)
			this._getPowerSupply(pwr.ident, pwr.port);
	},

	properties :
	{
		ident : {},
		ctrl : {},
		power : { init : 0, apply : "_applyPower" },
		upstream : { init : null, apply : "_applyUpstream" }
	},

	members :
	{
		__power : null,

		_getPowerSupply : function(ident, port)
		{
			var pwr = sn.boardfarm.backend.power.Power.getInstance();
			var supply = ident.split(":");
			supply[2] = port;
			this.__power = pwr.portFactory(supply[0], supply[1], supply[2]);
		},

		_applyPower : function(n, o)
		{
			if (this.__power)
				this.__power.portSetState(n);
		},

		__downstream : null,
		setDownstream : function(port, obj)
		{
			this.__downstream[port] = obj;
		},

		getDownstream : function(port)
		{
			if (!this.__downstream)
				throw "Downstreams not initialized";

			return this.__downstream[port];
		},

		__upstream : null,
		_applyUpstream : function(n, o)
		{
			var muxes = sn.boardfarm.backend.mux.Mux.getInstance();

			if (!n)
				return;

			this.__upstream = [];
			for (var i = 0; i < n.length; i++) {
				var port = n[i].split(":");
				this.__upstream[i] = muxes.getMux(port[0]);

				if (this.__upstream[i])
					this.__upstream[i].setDownstream(port[1], this);
			}
		}

	}
});
