/*
 * Boardfarm Management application
 * Copyright (c) 2016 Heiko Stuebner <heiko@sntech.de>
 *
 * License:
 *   MIT: https://opensource.org/licenses/MIT
 *   See the LICENSE file in the project's top-level directory for details.
 */

require("./Config");
require('./Fritz');
require('./Boards');
require('./mux/Mux');
require("./power/Power");

var os = require('os');
var pty = require('pty.js');
var express = require('express');
var readline = require('readline');
var fs = require('fs');
var exec = require('child_process').exec;

qx.Class.define("sn.boardfarm.backend.Backend",
{
	extend : qx.core.Object,

	construct : function()
	{
		sn.boardfarm.backend.Backend.constructor.__backend = this;
		sn.boardfarm.backend.Fritz.getInstance();
	},

	properties :
	{
		loadAvg : { init : 0, event : "loadAvgChanged" },
		power : { init : 0, event : "powerChanged" },
		temperature : { init : 0, event : "temperatureChanged" }
	},

	members :
	{
		readTemperature : function()
		{
			var base = this;
			var rs = fs.createReadStream('/sys/class/thermal/thermal_zone0/temp');
			rs.on('error', function(err)
			{
				base.setTemperature(0);
			});

			if (!rs.readable)
				return;

			var rl = readline.createInterface({
				input: rs
			});

			rl.on('line', function (line)
			{
				base.setTemperature(parseInt(line));
			}).on('error', function (err)
			{
				base.setTemperature(0);
			});
		},

		readPower : function()
		{
			var pwr = sn.boardfarm.backend.power.Power.getInstance();

			pwr.refreshAll();

			if (this.__mainSupply)
				this.__mainSupply.adapterReadPower();
		},

		_updateMainPower : function(e)
		{
			this.setPower(e.getData());
		},

		readLoadAvg : function()
		{
			var rl = readline.createInterface({
				input: fs.createReadStream('/proc/loadavg')
			});

			var base = this;
			rl.on('line', function (line)
			{
				base.setLoadAvg(line);
			});
		},

		__mainSupply : null,
		__app : null,

		main : function()
		{
			var cfg = sn.boardfarm.backend.Config.getInstance();
			var pwr = sn.boardfarm.backend.power.Power.getInstance();

			/* init mainsupply, so that we can read its data */
			var mainSupply = cfg.getMainSupply();
			if (mainSupply) {
				var supply = mainSupply.ident.split(":");
				supply[2] = mainSupply.port;
				this.__mainSupply = pwr.portFactory(supply[0], supply[1], supply[2]);
				this.__mainSupply.addListener("adapterPowerChanged", this._updateMainPower, this);
			}

			this.__app = express();
			var expressWs = require('express-ws')(this.__app);

			this.__app.get('/status', this.backendStatus);
			this.__app.get('/boards', this.listBoards);
			this.__app.get('/boards/:board/power/:command', this.boardPower);
			this.__app.get('/boards/:board/checkin/:ip', this.boardCheckin);
			this.__app.get('/boards/:board/select', this.boardSelect);
			this.__app.get('/terminals', this.createTerminal);
			this.__app.get('/terminals/:pid/size', this.resizeTerminal);
			this.__app.ws('/terminals/:pid', this.connectTerminalWebsocket);
			this.__app.get('/build', this.buildKernel);
			this.__app.get('/shutdown', this.shutdownHost);

			var boards = sn.boardfarm.backend.Boards.getInstance();
			boards.addListener("loadComplete", this._startApp, this);
		},

		_startApp : function()
		{
			var cfg = sn.boardfarm.backend.Config.getInstance();

			/* read Temperature every 10 seconds */
			this.readTemperature();
			setInterval(qx.lang.Function.bind(this.readTemperature, this), 10000);

			/* read Load every 10 seconds */
			this.readLoadAvg();
			setInterval(qx.lang.Function.bind(this.readLoadAvg, this), 10000);

			/* it's enough to read power every 30 seconds or so */
			this.readPower();
			setInterval(qx.lang.Function.bind(this.readPower, this), 30000);

			/* let the app listen for connections */
			console.log('App: listening to http://' + cfg.getListenHost() + ':' + cfg.getListenPort());
			this.__app.listen(cfg.getListenPort(), cfg.getListenHost());
		},

		backendStatus : function(req, res)
		{
			var cfg = sn.boardfarm.backend.Config.getInstance();
			var backend = sn.boardfarm.backend.Backend.constructor.__backend;
			var boards = sn.boardfarm.backend.Boards.getInstance();
			var bList = boards.listBoards();

			var bStates = {};
			for (var i = 0; i < bList.length; i++) {
				var board = boards.getBoard(bList[i]);
				bStates[bList[i]] = board.powerState();
			}

			var stats =
			{
				loadAvg : backend.getLoadAvg(),
				power : backend.getPower(),
				temperature : backend.getTemperature(),
				boardStates : bStates,
			};

			res.jsonp(stats);
			res.send();
		},

		listBoards : function(req, res)
		{
			var cfg = sn.boardfarm.backend.Config.getInstance();
			var pwr = sn.boardfarm.backend.power.Power.getInstance();
			var adap = pwr.listAdapters().sort();
			var mainsupply = cfg.getMainSupply();
			var data = [];

			for (var i = 0; i < adap.length; i++) {
				if (mainsupply && adap[i] == mainsupply.ident)
					continue;

				var t = pwr.getAdapter(adap[i]);

				var ad = {
					name : adap[i],
					numPorts : t.adapterGetPortNum(),
					ports : []
				};

				for (var j = 0; j < t.adapterGetPortNum(); j++) {
					try {
						var port = t.adapterGetPort(j);
						var p = port.getBoard();
						if (p)
							ad.ports.push({ name : p.getName(), soc : p.getSoc(), state : port.portGetState() });
					} catch (ex) {}
				}

				data.push(ad);
			}

			res.jsonp(data);
			res.send();
		},

		createTerminal : function(req, res)
		{
			var cols = parseInt(req.query.cols),
			    rows = parseInt(req.query.rows),
			    board = req.query.board;

			if (board == "buildlog") {
				var term = pty.spawn("./buildlog.sh", [ ], {
				        name: 'xterm-color',
				        cols: cols || 80,
				        rows: rows || 24,
				        cwd: process.env.PWD,
				        env: process.env
				});
			} else {
				var b = sn.boardfarm.backend.Boards.getInstance().getBoard(board);
				var term = pty.spawn("./telnet.sh", [ b.getPort() ], {
				        name: 'xterm-color',
				        cols: cols || 80,
				        rows: rows || 24,
				        cwd: process.env.PWD,
				        env: process.env
				});
			}

			console.log('Terminal: Started console for board ' + board + ' with PID: ' + term.pid);
			sn.boardfarm.backend.Backend.constructor.__terminals[term.pid] = term;
			sn.boardfarm.backend.Backend.constructor.__logs[term.pid] = '';

			var base = this;
			term.on('data', function(data)
			{
				sn.boardfarm.backend.Backend.constructor.__logs[term.pid] += data;
			});

			res.jsonp(term.pid.toString());
			res.end();
		},

		resizeTerminal : function(req, res)
		{
			var pid = parseInt(req.params.pid),
			    cols = parseInt(req.query.cols),
			    rows = parseInt(req.query.rows),
			    term = sn.boardfarm.backend.Backend.constructor.__terminals[pid];

			term.resize(cols, rows);
			console.log('Terminal: Resized ' + pid + ' to ' + cols + ' cols and ' + rows + ' rows.');
			res.end();
		},

		connectTerminalWebsocket : function(ws, req)
		{
			var pid = parseInt(req.params.pid),
			    term = sn.boardfarm.backend.Backend.constructor.__terminals[pid];
			console.log('Terminal: Connected to ' + pid);
			ws.send(sn.boardfarm.backend.Backend.constructor.__logs[term.pid]);

			term.on('data', function(data)
			{
				try {
					ws.send(data);
				} catch (ex) {
					// The WebSocket is not open, ignore
				}
			});

			ws.on('message', function(msg)
			{
				term.write(msg);
			});

			ws.on('close', function()
			{
				process.kill(term.pid);
				console.log('Terminal: Closed ' + term.pid);
				// Clean things up
				delete sn.boardfarm.backend.Backend.constructor.__terminals[term.pid];
				delete sn.boardfarm.backend.Backend.constructor.__logs[term.pid];
			});
		},

		boardPower : function(req, res)
		{
			var board = req.params.board,
			    pwrcmd = req.params.command;

			var b = sn.boardfarm.backend.Boards.getInstance().getBoard(board);

			switch(pwrcmd) {
				case "on":
					b.powerOn();
					break;
				case "off":
					b.powerOff();
					break;
				case "reset":
					b.reset();
					break;
				default:
					console.log("Unknown power command "+pwrcmd+" for board "+board);
					break;
			}

			res.end();
		},

		boardSelect : function(req, res)
		{
			var board = req.params.board;
			var b = sn.boardfarm.backend.Boards.getInstance().getBoard(board);

			b.selectBoard();
			res.end();
		},

		boardCheckin : function(req, res)
		{
			var board = req.params.board,
			    ip = req.params.ip;

			console.log("Board "+board+" checked in from ip "+ip);

			res.end();
		},

		buildKernel : function(req, res)
		{
			var term = pty.spawn("./buildkernel.sh", [ ], {
			        name: 'xterm-color',
			        cwd: process.env.PWD,
			        env: process.env
			});

			console.log('Build: started ' + term.pid.toString());

			term.on('data', function(data)
			{
				console.log('Build-'+term.pid.toString()+': '+data);
			});

			term.on('exit', function(data)
			{
				console.log('Build-'+term.pid.toString()+': finished');
			});

			res.jsonp(term.pid.toString());
			res.end();
		},

		shutdownHost : function(req, res)
		{
			var pwr = sn.boardfarm.backend.power.Power.getInstance();
			var cfg = sn.boardfarm.backend.Config.getInstance();
			var mainsupply = cfg.getMainSupply();
			var adaps = pwr.listAdapters();

			console.log("App: shutdown requested");

			for (var i = 0; i < adaps.length; i++)
			{
				/* don't turn off main supply :-) */
				if (mainsupply && adaps[i] == mainsupply.ident)
					continue;

				var adap = pwr.getAdapter(adaps[i]);
				adap.adapterShutdown();
			}

			res.end();
			setTimeout(sn.boardfarm.backend.Backend.shutdownSystem, 10000);
		},
	},

	statics :
	{
		__backend : null,
		__terminals : {},
		__logs : {},

		shutdownSystem : function()
		{
			console.log("App: doing system shutdown");
			exec("sudo /sbin/shutdown -H now");
		}
	}
});
