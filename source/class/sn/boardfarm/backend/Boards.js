/*
 * Boardfarm Management application
 * Copyright (c) 2016 Heiko Stuebner <heiko@sntech.de>
 *
 * License:
 *   MIT: https://opensource.org/licenses/MIT
 *   See the LICENSE file in the project's top-level directory for details.
 */

qx.Class.define("sn.boardfarm.backend.Boards",
{
	extend : qx.core.Object,
	type : "singleton",

	construct : function()
	{
		var board = require("./Board");

		/* read and store instances data */
		const readline = require('readline');
		const fs = require('fs');

		const rl = readline.createInterface({
			input: fs.createReadStream('/home/devel/nfs/instances')
		});

		var boards = this;
		rl.on('line', function (line)
		{
			if (line.charAt(0) == "#")
				return;
			if (line.length == 0)
				return;

			var tmp = line.split(":");
			boards.addBoardEntry(tmp[0], line);
		});

		rl.on('close', function()
		{
			/* do something once finished reading */
			boards.fireEvent("loadComplete");
		});
	},

	events :
	{
		"loadComplete" : "qx.event.type.Event"
	},

	members :
	{
		__lines : {},
		__boards : {},

		listBoards : function()
		{
			return Object.keys(this.__boards);
		},

		addBoardEntry : function(name, line)
		{
			if (this.__lines[name])
				throw "Board " + name + " already exists";

			this.__lines[name] = line;
			this.__boards[name] = new sn.boardfarm.backend.Board(name);
		},

		getBoardEntry : function(name)
		{
			if (!this.__lines[name])
				throw "Board " + name + " does not exists";

			return this.__lines[name];
		},

		getBoard : function(name)
		{
			if (!this.__boards[name])
				throw "Board " + name + " does not exists";

			return this.__boards[name];
		}
	}

});
