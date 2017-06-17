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

		if (pwr)
			this._getPowerSupply(pwr.ident, pwr.port);
	},

	properties :
	{
		ident : {},
		ctrl : {},
		power : { init : 0, apply : "_applyPower" }
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
		}

	}
});
