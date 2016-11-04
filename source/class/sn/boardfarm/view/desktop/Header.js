/*
 * Boardfarm Management application
 * Copyright (c) 2016 Heiko Stuebner <heiko@sntech.de>
 *
 * License:
 *   MIT: https://opensource.org/licenses/MIT
 *   See the LICENSE file in the project's top-level directory for details.
 */

qx.Class.define("sn.boardfarm.view.desktop.Header",
{
  extend : qx.ui.container.Composite,

  construct : function()
  {
    this.base(arguments);

    this.setLayout(new qx.ui.layout.HBox);
    this.setAppearance("app-header");

    var title = new qx.ui.basic.Label("Board Farm");
    var host = new qx.ui.basic.Label("@mort");

    this.add(title);
    this.add(new qx.ui.core.Spacer, {flex : 1});
    this.add(host);

  }
});
