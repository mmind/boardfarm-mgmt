/*
 * Boardfarm Management application
 * Copyright (c) 2021 Heiko Stuebner <heiko@sntech.de>
 *
 * License:
 *   MIT: https://opensource.org/licenses/MIT
 *   See the LICENSE file in the project's top-level directory for details.
 */

var power = require("./Power");
var ipower = require("./IPowerPort");
var exec = require('child_process').exec;

qx.Class.define("sn.boardfarm.backend.power.Qemu",
{
	extend : qx.core.Object,
	implement : [ sn.boardfarm.backend.power.IPowerAdapter ],

	construct : function(serial)
	{
		var pwr = sn.boardfarm.backend.power.Power.getInstance();

		console.log("Power: added Qemu controller " + serial);
		this.setAdapterIdent("qemu:"+serial);
		this.setSerial(serial);
		this.__states = { 0 : -1, 1 : -1, 2 : -1, 3 : -1, 4 : -1, 5 : -1, 6 : -1, 7 : -1, 8 : -1, 9 : -1 };
		this.__ports = {};

		pwr.addAdapter(this.getAdapterIdent(), this);
	},

	events :
	{
		"adapterPowerChanged" : "qx.event.type.Data",
		"adapterPortStateChanged" : "qx.event.type.Data"
	},

	properties :
	{
		adapterIdent : {},
		serial : {}
	},

	members :
	{
		adapterReadPower : function()
		{
			/* can't read power measurements */
			this.fireDataEvent("adapterPowerChanged", 0);
		},

		__states : null,

		adapterReadState : function()
		{
			var serial = this.getSerial();
			var base = this;
			var child;

			child = exec("ps -eo comm | grep ^" + serial + "-vm-", function (error, stdout, stderr)
			{
				base.__states = { 0 : 0, 1 : 0, 2 : 0, 3 : 0, 4 : 0, 5 : 0, 6 : 0, 7 : 0, 8 : 0, 9 : 0 };

				/* all listed entries are running VMs */
				var data = stdout.split("\n");
				for (var i = 0; i < data.length; i++) {
					var vm = data[i].split(serial + "-vm-");

					if (vm.length != 2)
						continue;

					base.__states[parseInt(vm[1])] = 1;
				}
			});
		},

		__ports : null,

		adapterAddPort : function(port, obj)
		{
			if (this.__ports[port])
				throw "Port "+port+" already set on "+this.getAdapterIdent();

			this.__ports[port] = obj;
		},

		adapterGetPortNum : function()
		{
			 return 10;
		},

		adapterShutdown : function()
		{
			for (var i = 0; i < this.adapterGetPortNum(); i++)
				this.adapterSetPortState(i, 0);
		},

		adapterGetPort : function(port)
		{
			if (!this.__ports[port])
				throw "Port "+port+" not set on "+this.getAdapterIdent();

			return this.__ports[port];
		},

		adapterGetPortState : function(port)
		{
			return this.__states[port];
		},

		adapterSetPortState : function(port, newState)
		{
			if (newState) {
				console.log("Power: Qemu: Should not end up here to power on a Qemu " + error);
				return;
			} else {
				var cmd = "pkill " + this.getSerial() + "-vm-" + parseInt(port) + "$"
				var base = this;
				var child;

				child = exec(cmd, function (error, stdout, stderr)
				{
					if (error !== null) {
						console.log("pkill command returned " + error);
						return;
					}

					base.__states[port] = newState;
					base.fireDataEvent("adapterPortStateChanged", { port : port, state : newState });
					console.log("Power: set port " + parseInt(port) + " of " + base.getAdapterIdent() + " to "+ newState);
				});
			}
		}
	}
});

qx.Class.define("sn.boardfarm.backend.power.QemuPort",
{
	extend : qx.core.Object,
	implement : [ sn.boardfarm.backend.power.IPowerPort ],

	construct : function(serial, port)
	{
		var pwr = sn.boardfarm.backend.power.Power.getInstance();

		try {
			this.__adapter = pwr.getAdapter("qemu:"+serial);
		} catch(ex) {
			this.__adapter = new sn.boardfarm.backend.power.Qemu(serial);
		}

		this.setPort(port);
		this.__adapter.adapterAddPort(port, this);
	},

	properties :
	{
		port : {},
		board : {}
	},

	members :
	{
		__adapter : null,

		__getCPU : function(arch)
		{
			switch(arch) {
			case "riscv32":
				return "rv32,Zicbom=true,Zawrs=true,sscofpmf=true";
			case "riscv64":
				return "rv64,zbb=true,zbc=true,svpbmt=true,Zicbom=true,Zawrs=true,sscofpmf=true,v=true";
			}
		},

		portGetAdapter : function()
		{
			return this.__adapter;
		},

		portGetState : function()
		{
			return this.portGetAdapter().adapterGetPortState(this.getPort());
		},

		portSetState : function(newState)
		{
			var board = this.getBoard();

			/* power-on handled here, as we need board-specific information */
			if (newState) {
				var base = this;
				var cmd = "";


				cmd+= "/usr/local/bin/qemu-system-" + board.getArch() + " -M virt -smp 2 -m 1G -display none";
//				cmd+= "/usr/bin/qemu-system-" + board.getArch() + " -M virt -smp 2 -m 1G -display none";
				cmd+= " -cpu " + this.__getCPU(board.getArch());
				cmd+= " -serial telnet:localhost:" + board.getPort() + ",server,nowait";
				cmd+= " -kernel /home/devel/nfs/kernel/" + board.getArch() + "/Image";
				cmd+= " -append \"earlycon=sbi root=/dev/nfs nfsroot=10.0.2.2:/home/devel/nfs/rootfs-" + board.getName() + " ip=dhcp rw\"";
				cmd+= " -netdev user,id=n1 -device virtio-net-pci,netdev=n1";
				cmd+= " -name " + this.__adapter.getSerial() + "-"+ this.getPort() +",process=" + this.__adapter.getSerial() + "-vm-" + this.getPort() + " -daemonize";

/*
				cmd = "";
				cmd+= "/usr/local/bin/qemu-system-" + board.getArch() + " -M virt -smp 2 -m 1G -display none";
				cmd+= " -cpu " + this.__getCPU(board.getArch());
				cmd+= " -serial telnet:localhost:" + board.getPort() + ",server,nowait";
				cmd+= " -kernel /home/devel/nfs/kernel/" + board.getArch() + "/Image";
				cmd+= " -append 'root=/dev/vda console=ttyS0'";
				cmd+= " -drive file=/home/devel/nfs/rootfs-" + board.getName() + ".ext4,format=raw,id=hd0";
				cmd+= " -device virtio-blk-pci,drive=hd0";
				cmd+= " -name " + this.__adapter.getSerial() + "-"+ this.getPort() +",process=" + this.__adapter.getSerial() + "-vm-" + this.getPort() + " -daemonize";
*/
console.log(cmd);

				child = exec(cmd, function (error, stdout, stderr)
				{
					if (error !== null) {
						console.log("qemu command returned " + error);
						return;
					}

					base.__adapter.__states[parseInt(base.getPort())] = newState;
					base.fireDataEvent("adapterPortStateChanged", { port : parseInt(base.getPort()), state : newState });
					console.log("Power: set port " + parseInt(base.getPort()) + " of " + base.__adapter.getAdapterIdent() + " to " + newState);
				});
			} else {
				this.portGetAdapter().adapterSetPortState(this.getPort(), newState);
			}
		}
	}
});
