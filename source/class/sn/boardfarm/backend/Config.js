qx.Class.define("sn.boardfarm.backend.Config",
{
	extend : qx.core.Object,
	type : "singleton",

	construct : function()
	{
	},

	properties :
	{
		listenHost : { init : "0.0.0.0" },
		listenPort : { init : 3000 },
		mainSupply : { init : { ident : "fritzdect:087610266671", port : 0 } }
	},

	members :
	{
	}

});
