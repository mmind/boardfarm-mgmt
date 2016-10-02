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
		 * Turn this port off
		 */
		portPowerOff : function() {},

		/*
		 * Turn this port on
		 */
		portPowerOn : function() {}
	}
});
