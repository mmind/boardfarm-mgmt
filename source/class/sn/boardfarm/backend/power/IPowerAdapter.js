qx.Interface.define("sn.boardfarm.backend.power.IPowerAdapter",
{
	properties :
	{
		adapterIdent : {}
	},

	members :
	{
		adapterReadState : function() {},

		adapterGetPortNum : function() {},

		/*
		 * Get the power port object attached to this port
		 */
		adapterGetPort : function(port) {},

		adapterGetPortState : function(port) {}
	}
});
