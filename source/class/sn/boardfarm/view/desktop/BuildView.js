/*
 * Boardfarm Management application
 * Copyright (c) 2016 Heiko Stuebner <heiko@sntech.de>
 *
 * License:
 *   MIT: https://opensource.org/licenses/MIT
 *   See the LICENSE file in the project's top-level directory for details.
 */

qx.Class.define("sn.boardfarm.view.desktop.BuildView", {
	extend : qx.ui.splitpane.Pane,

	construct : function()
	{
		this.base(arguments, "vertical");
		this.setDecorator(null);

	// Create the list view
	this.__listView = new qx.ui.basic.Label("Simple text label");;
	this.__listView.setHeight(50);
	this.__listView.setDecorator("main");

		var scroll = new qx.ui.container.Scroll();
		scroll.setHeight(50);
		scroll.add(this.__listview);
		this.add(scroll, 0);

		this.__vbox = new qx.ui.container.Composite(new qx.ui.layout.VBox());
		this.add(this.__vbox, 1);

		this.__xterms["_dummy"] = new sn.boardfarm.view.desktop.Xterm();
		this.__xterms["_dummy"].setDecorator("main");
		this.__vbox.add(this.__xterms["_dummy"], { flex : 1 });

		this.addListener("appear", this._onAppear, this);
	},

	events :
	{
		"buildUpdated" : "qx.event.type.Data"
	},

	properties :
	{
		board : { apply : "_applyBoard" }
	},

	members :
	{
		__xterms : {},

		_onAppear : function(e)
		{
			if (!this.__xterms["buildlog"]) {
				this.__xterms["buildlog"] = new sn.boardfarm.view.desktop.Xterm();
				this.__xterms["buildlog"].setDecorator("main");
				this.__xterms["buildlog"].setBoard("buildlog");
				this.__xterms["buildlog"].addListener("terminalUpdated", this._buildUpdated, this);
				this.__vbox.add(this.__xterms["buildlog"], { flex : 1 });
			}

			/* first hide any old terminal */
			for (var key in this.__xterms) {
				if (key != "buildlog")
					this.__xterms[key].exclude();
			}
			qx.html.Element.flush();

			/* no show the selected one */
			this.__xterms["buildlog"].show();
			qx.html.Element.flush();
		},

		_buildUpdated : function(e)
		{
			this.fireDataEvent("buildUpdated", null);
		}
	}
});
