/*
 * Boardfarm Management application
 * Copyright (c) 2016 Heiko Stuebner <heiko@sntech.de>
 *
 * License:
 *   MIT: https://opensource.org/licenses/MIT
 *   See the LICENSE file in the project's top-level directory for details.
 */

/**
 * The main tool bar widget
 *
 * @asset(qx/icon/${qx.icontheme}/22/actions/media-playback-start.png)
 * @asset(qx/icon/${qx.icontheme}/22/actions/media-playback-stop.png)
 * @asset(qx/icon/${qx.icontheme}/22/actions/view-refresh.png)
 */
qx.Class.define("sn.boardfarm.view.desktop.ToolBar",
{
	extend : qx.ui.toolbar.ToolBar,

	construct : function(controller)
	{
		this.base(arguments);

    // Reload button
/*    var reloadBtn = new qx.ui.toolbar.Button(this.tr("Reload"), "icon/22/actions/view-refresh.png");
    var reloadCmd = controller.getCommand("reload");
    reloadBtn.setCommand(reloadCmd);
    reloadBtn.setToolTipText(this.tr("Reload boards. (%1)", reloadCmd.toString()));
    this.add(reloadBtn);*/

		var tempPart = new qx.ui.toolbar.Part;
		var tempC = new qx.ui.container.Composite(new qx.ui.layout.HBox());
		var t = new qx.ui.basic.Label("Temperature:");
		t.set({ alignY : "middle", marginRight : 10 });
		t.setFont("bold");
		tempC.add(t);
		this.__temp = new qx.ui.basic.Label("---");
		this.__temp.set({ alignY : "middle", textAlign : "right", width : 40 });
		tempC.add(this.__temp);
		var t = new qx.ui.basic.Label("°C");
		t.set({ alignY : "middle", marginLeft : 5 });
		tempC.add(t);
		tempPart.add(tempC);
		this.add(tempPart);

		var powerPart = new qx.ui.toolbar.Part;
		var powerC = new qx.ui.container.Composite(new qx.ui.layout.HBox());
		var t = new qx.ui.basic.Label("Power:");
		t.set({ alignY : "middle", marginRight : 5 });
		t.setFont("bold");
		powerC.add(t);
		this.__power = new qx.ui.basic.Label("---");
		this.__power.set({ alignY : "middle", textAlign : "right", width : 40 });
		powerC.add(this.__power);
		var t = new qx.ui.basic.Label("W");
		t.set({ alignY : "middle", marginLeft : 10 });
		powerC.add(t);
		powerPart.add(powerC);
		this.add(powerPart);

		var loadPart = new qx.ui.toolbar.Part;
		var loadC = new qx.ui.container.Composite(new qx.ui.layout.HBox());
		var t = new qx.ui.basic.Label("Load:");
		t.set({ alignY : "middle", marginRight : 10 });
		t.setFont("bold");
		loadC.add(t);
		this.__load = new qx.ui.basic.Label("---");
		this.__load.setAlignY("middle");
		loadC.add(this.__load);
		loadPart.add(loadC);
		this.add(loadPart);

		/* Add a spacer to move board handling to the right */
		this.addSpacer();

		this.__boardCtrl = new qx.ui.container.Composite(new qx.ui.layout.HBox(5));

		this.__pwronBtn = new qx.ui.toolbar.Button(this.tr("Power On"), "icon/22/actions/media-playback-start.png");
		var pwronCmd = controller.getCommand("pwron");
		this.__pwronBtn.setCommand(pwronCmd);
		this.__pwronBtn.setToolTipText(this.tr("Start board power supply. (%1)", pwronCmd.toString()));
		this.__boardCtrl.add(this.__pwronBtn);

		this.__pwroffBtn = new qx.ui.toolbar.Button(this.tr("Power Off"), "icon/22/actions/media-playback-stop.png");
		var pwroffCmd = controller.getCommand("pwroff");
		this.__pwroffBtn.setCommand(pwroffCmd);
		this.__pwroffBtn.setToolTipText(this.tr("Stop board power supply. (%1)", pwroffCmd.toString()));
		this.__boardCtrl.add(this.__pwroffBtn);

		this.__resetBtn = new qx.ui.toolbar.Button(this.tr("Reset"), "icon/22/actions/view-refresh.png");
		var resetCmd = controller.getCommand("reset");
		this.__resetBtn.setCommand(resetCmd);
		this.__resetBtn.setToolTipText(this.tr("Reset board. (%1)", resetCmd.toString()));
		this.__boardCtrl.add(this.__resetBtn);

		this.add(this.__boardCtrl);

		this.__buildCtrl = new qx.ui.container.Composite(new qx.ui.layout.HBox(5));
		this.__buildBtn = new qx.ui.toolbar.Button(this.tr("Build"), "icon/22/actions/media-playback-start.png");
		var buildCmd = controller.getCommand("build");
		this.__buildBtn.setCommand(buildCmd);
		this.__buildBtn.setToolTipText(this.tr("Start kernel build process. (%1)", buildCmd.toString()));
		this.__buildCtrl.add(this.__buildBtn);
		this.add(this.__buildCtrl);
	},

	properties :
	{
		status : { apply : "_applyStatus" },
		viewmode : { apply : "_applyViewmode" }
	},

	members :
	{
		__pwronBtn : null,
		__pwroffBtn : null,
		__resetBtn : null,

		_applyStatus : function(status, oldStatus)
		{
			this.__temp.setValue((status.temperature / 1000).toFixed(2));
			this.__power.setValue((status.power / 1000).toFixed(2));
			this.__load.setValue(status.loadAvg);
		},

		_applyViewmode : function(newMode, oldMode)
		{
			switch (newMode) {
			case "board":
				this.__boardCtrl.show();
				this.__buildCtrl.exclude();
				break;
			case "build":
				this.__boardCtrl.exclude();
				this.__buildCtrl.show();
				break;
			default:
				this.__boardCtrl.exclude();
				this.__buildCtrl.exclude();
				break;
			}
		}
	},

	destruct : function() {
		this._disposeObjects("__pwronBtn", "__pwroffBtn", "__resetBtn");
	}
});
