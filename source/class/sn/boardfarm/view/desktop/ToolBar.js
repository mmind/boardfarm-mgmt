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

  /**
   * @param controller {feedreader.Application} The main application class
   */
  construct : function(controller)
  {
    this.base(arguments);

    this.__menuItemStore = {};

    // Reload button
    var reloadBtn = new qx.ui.toolbar.Button(this.tr("Reload"), "icon/22/actions/view-refresh.png");
    var reloadCmd = controller.getCommand("reload");
    reloadBtn.setCommand(reloadCmd);
    reloadBtn.setToolTipText(this.tr("Reload boards. (%1)", reloadCmd.toString()));
    this.add(reloadBtn);

    // Add a spacer to move board handling to the right
    this.addSpacer();

    var pwronBtn = new qx.ui.toolbar.Button(this.tr("Power On"), "icon/22/actions/media-playback-start.png");
    var pwronCmd = controller.getCommand("pwron");
    pwronBtn.setCommand(pwronCmd);
    pwronBtn.setToolTipText(this.tr("Start board power supply. (%1)", pwronCmd.toString()));
    this.add(pwronBtn);

    var pwroffBtn = new qx.ui.toolbar.Button(this.tr("Power Off"), "icon/22/actions/media-playback-stop.png");
    var pwroffCmd = controller.getCommand("pwroff");
    pwroffBtn.setCommand(pwroffCmd);
    pwroffBtn.setToolTipText(this.tr("Stop board power supply. (%1)", pwroffCmd.toString()));
    this.add(pwroffBtn);

    // Add a separator
    this.addSeparator();

    var resetBtn = new qx.ui.toolbar.Button(this.tr("Reset"), "icon/22/actions/view-refresh.png");
    var resetCmd = controller.getCommand("reset");
    resetBtn.setCommand(resetCmd);
    resetBtn.setToolTipText(this.tr("Reset board. (%1)", resetCmd.toString()));
    this.add(resetBtn);
  },


  members :
  {
    // private members
    __removeBtn : null,
    __menuItemStore : null,
    __addBtn : null,
    __prefBtn : null
  },


  destruct : function() {
    this._disposeObjects("__removeBtn", "__overflowMenu");
  }
});
