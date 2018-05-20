/*
 * Boardfarm Management application
 * Copyright (c) 2016 Heiko Stuebner <heiko@sntech.de>
 *
 * License:
 *   MIT: https://opensource.org/licenses/MIT
 *   See the LICENSE file in the project's top-level directory for details.
 */

var fritz = require('fritzapi');

qx.Class.define("sn.boardfarm.backend.Fritz",
{
	extend : qx.core.Object,
	type : "singleton",

	construct : function()
	{
		this.login();

		/* refresh login every 10 minutes */
		var base = this;
		setInterval(function()
		{
			base.login();
		}, 600000);
	},

	properties :
	{
		sid : { init : null, event : "connect" }
	},

	members :
	{
		login : function() {
			var base = this;

			fritz.getSessionID("smarthome", "smarthome", {
				url: "http://192.168.178.1",
				strictSSL: false
			}).then(function(sid) {
				base.setSid(sid);
			});
		}
	}

});