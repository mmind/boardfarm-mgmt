/*
 * Boardfarm Management application
 * Copyright (c) 2016 Heiko Stuebner <heiko@sntech.de>
 *
 * License:
 *   MIT: https://opensource.org/licenses/MIT
 *   See the LICENSE file in the project's top-level directory for details.
 */

qx.Theme.define("sn.boardfarm.theme.Appearance",
{
	extend : qx.theme.indigo.Appearance,

	appearances :
	{
		"tree-file/label" : {
			include : "label",
			alias : "label",

			style : function(states, styles)
			{
				return {
					textColor : states.updated ? "invalid" :
						    states.selected ? "text-selected" : "text"
				};
			}
		}
	}
});