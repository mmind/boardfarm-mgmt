qx.Interface.define("sn.boardfarm.backend.power.IPowerPort",
{
	properties :
	{
		board : {}
	},

	members :
	{
		portGetAdapter : function() {},

		/*
		 * Get the state of this port, 1 on, 0 off
		 */
		portGetState : function() {},

		/*
		 * Set the state of this port, 1 on, 0 off
		 */
		portSetState : function(newState) {},
	}
});
