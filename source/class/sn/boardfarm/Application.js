/*
 * Boardfarm Management application
 * Copyright (c) 2016 Heiko Stuebner <heiko@sntech.de>
 *
 * License:
 *   MIT: https://opensource.org/licenses/MIT
 *   See the LICENSE file in the project's top-level directory for details.
 */

/**
 * Main application class.
 *
 * @asset(qx/icon/${qx.icontheme}/22/apps/internet-feed-reader.png)
 * @asset(qx/icon/${qx.icontheme}/22/actions/process-stop.png)
 * @asset(qx/icon/${qx.icontheme}/22/apps/preferences-clock.png)
 * @asset(qx/icon/${qx.icontheme}/22/places/folder.png)
 * @asset(xterm/xterm.js)
 * @asset(xterm/xterm.css)
 * @asset(xterm/addons/attach/attach.js)
 * @asset(xterm/addons/fit/fit.js)
 */
qx.Class.define("sn.boardfarm.Application",
{
  extend : qx.application.Standalone,


  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {
    __commands : null,

    __treeView : null,
    __header : null,
    __toolBarView : null,
    __listView : null,
    __horizontalSplitPane : null,
    __boardPane : null,

    __articleView : null,
    __addFeedWindow : null,


	__treeElements : {},

    /**
     * Application initialization which happens when
     * all library files are loaded and ready
     */
    main : function()
    {
      this.base(arguments);

      // Add log appenders
      if (qx.core.Environment.get("qx.debug"))
      {
        qx.log.appender.Native;
        qx.log.appender.Console;
      }

      qx.io.PartLoader.getInstance().addListener("partLoaded", function(e) {
        this.debug("part loaded: " + e.getData().getName());
      }, this);

      // Load current locale part
      var currentLanguage = qx.locale.Manager.getInstance().getLanguage();
      var knownParts = qx.Part.getInstance().getParts();
      // if the locale is available as part
      if (knownParts[currentLanguage]) {
        // load this part
        qx.io.PartLoader.require([currentLanguage], function() {
          // forcing identical locale
          qx.locale.Manager.getInstance().setLocale(currentLanguage);
          // build the GUI after the initial locals has been loaded
          this.buildUpGui();
        }, this);
      } else {
        // if we cant find the default locale, print a warning and load the gui
        this.warn(
          "Cannot load locale part for current language " +
          currentLanguage + ", falling back to English."
        );
        this.buildUpGui();
      }
    },

	__selectTreeElement : function(e)
	{
		var el = this.__treeElements[e.getTarget().getSelection()[0].toHashCode()];
//qx.log.Logger.warn(e.getTarget().getSelection());
		switch(el.type) {
			case "adapter":
				this.__toolBarView.setViewmode("adapter");
				this.__boardPane.hide();
//				this.__adapterPane.setAdapter(this.__treeElements[e.getTarget().toHashCode()].name);
//				this.__adapterPane.show();
				break;
			case "board":
				this.__toolBarView.setViewmode("board");
//				this.__adapterPane.hide();
				this.__boardPane.setBoard(el.name);
				this.__boardPane.show();
				break;
			default:
				qx.log.Logger.warn("type " + el.type + " unknown");
		}
	},

	__fillTree : function(data)
	{
		var root = this.__treeView.getRoot();
		root.removeAll();
		this.__treeElements = {};

		for (var i = 0; i < data.length; i++) {
			var tfName = data[i].name + "("+data[i].ports.length+"/"+data[i].numPorts+")";
			var tf = new qx.ui.tree.TreeFolder(tfName);
			tf.setOpen(true);
			root.add(tf);
			this.__treeElements[tf.toHashCode()] = { type : "adapter", name : data[i].name };

			for (var j = 0; j < data[i].ports.length; j++) {
				var port = data[i].ports[j]
				var tb = new qx.ui.tree.TreeFile(port.name);
				tf.add(tb);
				this.__treeElements[tb.toHashCode()] = { type : "board", name : port.name };
			}
		}
	},

    /**
     * Main routine which builds the whole GUI.
     */
    buildUpGui : function()
    {

      // Initialize commands
      this._initializeCommands();

      // Create application layout
      this._createLayout();

	/* request adapter + board list */
	var req = new qx.io.request.Jsonp();
	req.setUrl(location.protocol + "//" + location.hostname + ':3000/boards');
//	req.setUrl("http://192.168.140.1:3000/boards");

	req.addListener("success", function(e) {
		var req = e.getTarget();
		this.__fillTree(req.getResponse());
	}, this);

	req.send();

    },

    _createLayout : function()
    {
      // Create main layout
      var dockLayout = new qx.ui.layout.Dock();
      // dockLayout.setSeparatorY("separator-vertical");
      var dockLayoutComposite = new qx.ui.container.Composite(dockLayout);
      this.getRoot().add(dockLayoutComposite, {edge:0});

      // Create header
      this.__header = new sn.boardfarm.view.desktop.Header();
      dockLayoutComposite.add(this.__header, {edge: "north"});

      // Create toolbar
      this.__toolBarView = new sn.boardfarm.view.desktop.ToolBar(this);
      dockLayoutComposite.add(this.__toolBarView, {edge: "north"});

      // Create horizontal splitpane for tree and list+article view
      this.__horizontalSplitPane = new qx.ui.splitpane.Pane();
      dockLayoutComposite.add(this.__horizontalSplitPane);

      // Create tree view
      this.__treeView = new qx.ui.tree.Tree();
      this.__treeView.setWidth(250);
      this.__treeView.setDecorator("main");
      this.__treeView.setPadding(0);
	this.__treeView.addListener("changeSelection", this.__selectTreeElement, this);
      this.__horizontalSplitPane.add(this.__treeView, 0);

	var root = new qx.ui.tree.TreeFolder("root");
	root.setOpen(true);
	this.__treeView.setRoot(root);
	this.__treeView.setHideRoot(true);



      /* Create vertical splitpane for board view */
	this.__boardPane = new sn.boardfarm.view.desktop.BoardView();
      this.__horizontalSplitPane.add(this.__boardPane, 1);
      this.__horizontalSplitPane.setAppearance("app-splitpane");
    },




    /*
    ---------------------------------------------------------------------------
      COMMANDS
    ---------------------------------------------------------------------------
    */

    /**
     * Initialize commands (shortcuts, ...)
     */
    _initializeCommands : function()
    {
      var commands = {};

      commands.reload = new qx.ui.command.Command("Control+R");
      commands.reload.addListener("execute", this.reload, this);

      commands.pwron = new qx.ui.command.Command("Control+1");
      commands.pwron.addListener("execute", this.pwronBoard, this);

      commands.pwroff = new qx.ui.command.Command("Control+2");
      commands.pwroff.addListener("execute", this.pwroffBoard, this);

      commands.reset = new qx.ui.command.Command("Control+3");
      commands.reset.addListener("execute", this.resetBoard, this);

      this.__commands = commands;
    },

	_boardPower : function(board, command)
	{
		/* request adapter + board list */
		var req = new qx.io.request.Jsonp();
		req.setUrl(location.protocol + "//" + location.hostname + ':3000/boards/'+board+"/power/"+command);

		req.addListener("success", function(e) {
			var req = e.getTarget();

			/* something to do? */
		}, this);

		req.send();
	},

	pwronBoard : function(e)
	{
		if (this.__toolBarView.getViewmode() != "board")
			return;

		this._boardPower(this.__boardPane.getBoard(), "on");
	},

	pwroffBoard : function(e)
	{
		if (this.__toolBarView.getViewmode() != "board")
			return;

		this._boardPower(this.__boardPane.getBoard(), "off");
	},

	resetBoard : function(e)
	{
		if (this.__toolBarView.getViewmode() != "board")
			return;

		this._boardPower(this.__boardPane.getBoard(), "reset");
	},

    /**
     * Get the command with the given command id
     *
     * @param commandId {String} the command's command id
     * @return {qx.ui.command.Command} The command
     */
    getCommand : function(commandId) {
      return this.__commands[commandId];
    },





    /*
    ---------------------------------------------------------------------------
      PUBLIC API
    ---------------------------------------------------------------------------
    */

    reload : function()
    {
        


    }
  },




  /*
  *****************************************************************************
     DESTRUCTOR
  *****************************************************************************
  */

  destruct : function()
  {
    this.__commands = null;
    this._disposeObjects("__toolBarView", "__listView", "__articleView", "__treeView",
        "__feedFolder", "__horizontalSplitPane", "__verticalSplitPane", "__header",
        "__staticFeedFolder", "__userFeedFolder", "__treeController", "__listController",
        "__prefWindow", "__addFeedWindow");
  }
});
