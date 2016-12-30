/*
 * Boardfarm Management application
 * Copyright (c) 2016 Heiko Stuebner <heiko@sntech.de>
 *
 * License:
 *   MIT: https://opensource.org/licenses/MIT
 *   See the LICENSE file in the project's top-level directory for details.
 */

qx.Class.define("sn.boardfarm.view.desktop.Xterm",
{
	extend : qx.ui.embed.Html,

	construct : function()
	{
		this.base(arguments);

		if (!sn.boardfarm.view.desktop.Xterm.__styleSheetIncluded) {
			var uri = qx.util.ResourceManager.getInstance().toUri("resource/xterm/xterm.css");
			qx.bom.Stylesheet.includeFile(uri);
			sn.boardfarm.view.desktop.Xterm.__styleSheetIncluded = true;
		}

//		this.setCssClass("terminal");
		this.setBackgroundColor("white");
		this.setHtml('<div id="terminal-container-'+this.toHashCode()+'" style="line-height:1; width:100%; height:100%"></div>');
		qx.html.Element.flush();

		this.addListener("appear", this._onAppear, this);
		this.addListener("resize", this._onResize, this);
	},

	events : {
		"terminalUpdated" : "qx.event.type.Event"
	},

	properties :
	{
		board : { init : null, apply : "_applyBoard", nullable : false, check : "String" },
		cols : {},
		rows : {},
		charWidth : {},
		charHeight : {}
	},

	members :
	{
		_applyBoard : function(value, old)
		{
		},

		_onAppear : function(e)
		{
			if (!this.getBoard())
				return;

			/* Flush all qx layout parts, so we can attach the terminal */
			qx.ui.core.queue.Layout.flush();
			qx.html.Element.flush();

			if (!this.__term) {
				var element = document.getElementById("terminal-container-"+this.toHashCode());
				this._createTerminal(element, this.getBoard());
			} else {
				this._onResize(e);
			}

			this.__term.focus();
		},

		_onResize : function(e)
		{
			if(!this.__term)
				return;

			qx.ui.core.queue.Layout.flush();
			qx.html.Element.flush();

			var cols = Math.floor(this.getBounds().width / this.getCharWidth());
			var rows = Math.floor(this.getBounds().height / this.getCharHeight());
			this.__term.resize(cols, rows);
		},

		__pid : null,
		__socket : null,
		__term : null,

		_clearContainer : function(terminalContainer)
		{
			while (terminalContainer.children.length)
				terminalContainer.removeChild(terminalContainer.children[0]);
		},

		_createTerminal : function(terminalContainer, board)
		{
			this._clearContainer(terminalContainer);

			this.__term = new Terminal({
				cursorBlink: false
			});

			this.__term.open(terminalContainer);
			this.__term.fit();

			var initialGeometry = this.__term.proposeGeometry();
			this.setCols(initialGeometry.cols);
			this.setRows(initialGeometry.rows);

			this.setCharWidth(this.__term.element.offsetWidth / this.getCols());
			this.setCharHeight(this.__term.element.offsetHeight / this.getRows());
			this.__term.on('resize', qx.lang.Function.bind(this._resizeTerminal, this));

			var req = new qx.io.request.Jsonp();
			req.setUrl(location.protocol + "//" + location.hostname + ':3000/terminals?board='+this.getBoard()+'&cols=' + this.getCols() + '&rows=' + this.getRows());

			req.addListener("success", function(e)
			{
				var req = e.getTarget(),
				    pid = req.getResponse();

				this.__pid = pid;

				var protocol = (location.protocol === 'https:') ? 'wss://' : 'ws://',
				    socketURL = protocol + location.hostname + ':3000/terminals/' + pid;
				this.__socket = new WebSocket(socketURL);
				this.__socket.onopen = qx.lang.Function.bind(this._attachTerminal, this);

				var __detach = qx.lang.Function.bind(this._detachTerminal, this);
				this.__socket.addEventListener('close', __detach);
				this.__socket.addEventListener('error', __detach);

				this.__socket.addEventListener('message', qx.lang.Function.bind(this._terminalUpdated, this));

			}, this);
			req.send();
		},

		_attachTerminal : function()
		{
			this.__term.attach(this.__socket);
			this.__term._initialized = true;
		},

		_detachTerminal : function()
		{
			this.__term.detach(this.__socket);
			this.__term = null;
		},

		_terminalUpdated : function()
		{
			this.fireEvent("terminalUpdated");
		},

		_resizeTerminal : function(size)
		{
			if (!this.__pid)
				return;

			this.setCols(size.cols);
			this.setRows(size.rows);

			var req = new qx.io.request.Jsonp();
			req.setUrl(location.protocol + "//" + location.hostname + ':3000/terminals/'+this.__pid+'/size?cols=' + this.getCols() + '&rows=' + this.getRows());
			req.send();
		}
	}
});
