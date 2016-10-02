var smartfritz = require("smartfritz");

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
			var moreParam = { url : "192.168.178.1" };
			smartfritz.getSessionID("smarthome", "smarthome", function(sid)
			{
				base.setSid(sid);
			}, moreParam);
		}
	}

});