/*
 * Boardfarm Management application
 * Copyright (c) 2016 Heiko Stuebner <heiko@sntech.de>
 *
 * License:
 *   MIT: https://opensource.org/licenses/MIT
 *   See the LICENSE file in the project's top-level directory for details.
 */

var qx = require("qooxdoo");
require('./source/class/sn/boardfarm/backend/Backend');

/* Create and run backend instance.
 * Run with
 *      nodejs boardfarm-backend.js
 */
var backend = new sn.boardfarm.backend.Backend();
backend.main();
