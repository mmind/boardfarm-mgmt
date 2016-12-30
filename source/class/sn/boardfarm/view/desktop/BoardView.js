/*
 * Boardfarm Management application
 * Copyright (c) 2016 Heiko Stuebner <heiko@sntech.de>
 *
 * License:
 *   MIT: https://opensource.org/licenses/MIT
 *   See the LICENSE file in the project's top-level directory for details.
 */

qx.Class.define("sn.boardfarm.view.desktop.BoardView", {
	extend : qx.ui.splitpane.Pane,

	construct : function()
	{
		this.base(arguments, "vertical");
		this.setDecorator(null);

	// Create the list view
	this.__listView = new qx.ui.basic.Label("Simple text label");;
	this.__listView.setHeight(150);
	this.__listView.setDecorator("main");

		var scroll = new qx.ui.container.Scroll();
		scroll.add(this.__listview);
		this.add(scroll, 0);


		this.__vbox = new qx.ui.container.Composite(new qx.ui.layout.VBox());
		this.add(this.__vbox, 1);

		this.__xterms["_dummy"] = new sn.boardfarm.view.desktop.Xterm();
		this.__xterms["_dummy"].setDecorator("main");
		this.__vbox.add(this.__xterms["_dummy"], { flex : 1 });

	},

	events :
	{
		"boardUpdated" : "qx.event.type.Data"
	},

	properties :
	{
		board : { apply : "_applyBoard" }
	},

	members :
	{
		__xterms : {},


		_applyBoard : function(value, old)
		{
			if (!this.__xterms[value]) {
				this.__xterms[value] = new sn.boardfarm.view.desktop.Xterm();
				this.__xterms[value].setDecorator("main");
				this.__xterms[value].setBoard(value);
				this.__xterms[value].addListener("terminalUpdated", this._boardUpdated, this);
				this.__vbox.add(this.__xterms[value], { flex : 1 });
			}

			/* first hide any old terminal */
			for (var key in this.__xterms) {
				if (key != value)
					this.__xterms[key].exclude();
			}
			qx.html.Element.flush();

			/* no show the selected one */
			this.__xterms[value].show();
			qx.html.Element.flush();
		},

		_boardUpdated : function(e)
		{
			var bObj = e.getTarget();
			this.fireDataEvent("boardUpdated", bObj.getBoard());
		}
	}
});
