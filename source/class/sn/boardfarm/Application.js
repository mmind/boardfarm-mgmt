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
 * @asset(qx/icon/${qx.icontheme}/16/actions/media-playback-start.png)
 * @asset(qx/icon/${qx.icontheme}/16/actions/media-playback-stop.png)
 * @asset(xterm/xterm.js)
 * @asset(xterm/xterm.css)
 * @asset(xterm/addons/attach/attach.js)
 * @asset(xterm/addons/fit/fit.js)
 */
qx.Class.define("sn.boardfarm.Application",
{
	extend : qx.application.Standalone,

	members :
	{
		__commands : null,

		__treeView : null,
		__header : null,
		__toolBarView : null,
		__listView : null,
		__horizontalSplitPane : null,
		__boardPane : null,

		__treeElements : {},

		/**
		 * Application initialization which happens when
		 * all library files are loaded and ready
		 */
		main : function()
		{
			this.base(arguments);

			if (qx.core.Environment.get("qx.debug")) {
				qx.log.appender.Native;
				qx.log.appender.Console;
			}

			qx.io.PartLoader.getInstance().addListener("partLoaded", function(e) {
				this.debug("part loaded: " + e.getData().getName());
			}, this);

			var currentLanguage = qx.locale.Manager.getInstance().getLanguage();
			var knownParts = qx.Part.getInstance().getParts();
			if (knownParts[currentLanguage]) {
				qx.io.PartLoader.require([currentLanguage], function() {
					qx.locale.Manager.getInstance().setLocale(currentLanguage);
					this.buildUpGui();
				}, this);
			} else {
				this.warn("Cannot load locale part for current language " +
					  currentLanguage + ", falling back to English.");
				this.buildUpGui();
			}

			qx.util.TimerManager.getInstance().start(this._requestStatus, 10000, this, null, 0); 
		},

		_requestStatus : function()
		{
			var req = new qx.io.request.Jsonp();
			req.setUrl(location.protocol + "//" + location.hostname + ':3000/status');

			req.addListener("success", function(e)
			{
				var req = e.getTarget(),
				    status = req.getResponse();

				this.__toolBarView.setStatus(status);
				this._updateTree(status);
			}, this);
			req.send();
		},

		_updateTree: function(status)
		{
			var keys = Object.keys(this.__treeElements);
			var boards = Object.keys(status.boardStates);

			for (var j = 0; j < boards.length; j++) {
				for (var i = 0; i < keys.length; i++) {
					var elem = this.__treeElements[keys[i]];
					if (elem.type != "board" && elem.type != "build")
						continue;
					if (elem.name != boards[j])
						continue;

					switch (status.boardStates[boards[j]]) {
					case 1:
						elem.widget.setIcon("icon/16/actions/media-playback-start.png");
						break;
					case 0:
						elem.widget.setIcon("icon/16/actions/media-playback-stop.png");
						break;
					case -1:
					default:
						elem.widget.setIcon("icon/16/mimetypes/text-plain.png");
						break;
					}
				}
			}
		},

		__selectTreeElement : function(e)
		{
			var el = this.__treeElements[e.getTarget().getSelection()[0].toHashCode()];
			el.widget.removeState("updated");
			el.widget.updateAppearance();

			switch(el.type) {
			case "build":
				this.__toolBarView.setViewmode("build");
//				this.__adapterPane.exclude();
				this.__boardPane.exclude();
				this.__buildPane.show();
				break;
			case "adapter":
				this.__toolBarView.setViewmode("adapter");
				this.__boardPane.exclude();
				this.__buildPane.exclude();
//				this.__adapterPane.setAdapter(this.__treeElements[e.getTarget().toHashCode()].name);
//				this.__adapterPane.show();
				break;
			case "board":
				this.__toolBarView.setViewmode("board");
//				this.__adapterPane.exclude();
				this.__boardPane.setBoard(el.name);
				this.__boardPane.show();
				this.__buildPane.exclude();
				break;
			default:
				qx.log.Logger.warn("type " + el.type + " unknown");
			}
		},

		__fillTree : function(data)
		{
			var root = this.__treeView.getRoot();
			root.removeAll();
			this._disposeMap("__treeElements");
			this.__treeElements = {};

			var tb = new qx.ui.tree.TreeFile("Build");
			root.add(tb);
			this.__treeElements[tb.toHashCode()] = { type : "build", name : "buildlog", widget : tb };
			this.__treeView.setSelection([tb]);

			for (var i = 0; i < data.length; i++) {
				var tfName = data[i].name + "("+data[i].ports.length+"/"+data[i].numPorts+")";
				var tf = new qx.ui.tree.TreeFolder(tfName);
				tf.setOpen(true);
				root.add(tf);
				this.__treeElements[tf.toHashCode()] = { type : "adapter", name : data[i].name, widget : tf };

				for (var j = 0; j < data[i].ports.length; j++) {
					var port = data[i].ports[j]
					var tb = new qx.ui.tree.TreeFile(port.name);
					tf.add(tb);
					this.__treeElements[tb.toHashCode()] = { type : "board", name : port.name, widget : tb };
				}
			}
		},

		__showBoardUpdate : function(board)
		{
			var keys = Object.keys(this.__treeElements);
			var sel = this.__treeView.getSelection();

			for (var i = 0; i < keys.length; i++) {
				var elem = this.__treeElements[keys[i]];
				if (elem.type != "board")
					continue;
				if (elem.name != board)
					continue;

				/* currently selected element got updated */
				if (sel.length > 0 && sel[0].toHashCode() == elem.widget.toHashCode())
					return;

				elem.widget.addState("updated");
				elem.widget.updateAppearance();
			}

		},

		__buildUpdated : function(e)
		{
			this.__showBoardUpdate("buildlog");
		},

		__boardUpdated : function(e)
		{
			this.__showBoardUpdate(e.getData());
		},

		buildUpGui : function()
		{
			this._initializeCommands();
			this._createLayout();

			/* request adapter + board list */
			var req = new qx.io.request.Jsonp();
			req.setUrl(location.protocol + "//" + location.hostname + ':3000/boards');
			req.addListener("success", function(e) {
				var req = e.getTarget();
				this.__fillTree(req.getResponse());
			}, this);

			req.send();
		},

		_createLayout : function()
		{
			var dockLayout = new qx.ui.layout.Dock();
			var dockLayoutComposite = new qx.ui.container.Composite(dockLayout);
			this.getRoot().add(dockLayoutComposite, {edge:0});

			this.__header = new sn.boardfarm.view.desktop.Header();
			dockLayoutComposite.add(this.__header, {edge: "north"});

			this.__toolBarView = new sn.boardfarm.view.desktop.ToolBar(this);
			dockLayoutComposite.add(this.__toolBarView, {edge: "north"});

			this.__horizontalSplitPane = new qx.ui.splitpane.Pane();
			dockLayoutComposite.add(this.__horizontalSplitPane);

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

			this.__buildPane = new sn.boardfarm.view.desktop.BuildView();
			this.__buildPane.addListener("buildUpdated", this.__buildUpdated, this);
			this.__horizontalSplitPane.add(this.__buildPane, 1);

			this.__boardPane = new sn.boardfarm.view.desktop.BoardView();
			this.__boardPane.addListener("boardUpdated", this.__boardUpdated, this);
			this.__horizontalSplitPane.add(this.__boardPane, 1);

			this.__horizontalSplitPane.setAppearance("app-splitpane");
			this.__buildPane.exclude();
			this.__boardPane.exclude();
		},

		_initializeCommands : function()
		{
			var commands = {};

			commands.build = new qx.ui.command.Command("Control+B");
			commands.build.addListener("execute", this.build, this);

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

		build : function(e)
		{
			var req = new qx.io.request.Jsonp();
			req.setUrl(location.protocol + "//" + location.hostname + ':3000/build');

			req.addListener("success", function(e)
			{
			}, this);
			req.send();
		},

		_boardPower : function(board, command)
		{
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

		getCommand : function(commandId) {
			return this.__commands[commandId];
		},

		reload : function()
		{
		}
	},

	destruct : function()
	{
		this.__commands = null;
		this._disposeObjects("__treeView", "__header", "__toolBarView",
				     "__listView", "__horizontalSplitPane", "__boardPane");

		this._disposeMap("__treeElements");
	}
});
