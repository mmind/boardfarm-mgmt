/*
 * Boardfarm Management application
 * Copyright (c) 2016 Heiko Stuebner <heiko@sntech.de>
 *
 * License:
 *   MIT: https://opensource.org/licenses/MIT
 *   See the LICENSE file in the project's top-level directory for details.
 */

qx.Class.define("sn.boardfarm.view.desktop.List",
{
  extend : qx.ui.core.Widget,

  construct : function()
  {
    this.base(arguments);

    // set the layout
    var layout = new qx.ui.layout.VBox();
    layout.setSeparator("separator-vertical");
    this._setLayout(layout);

    // Create the header of the list
    var listHeader = new qx.ui.basic.Label(this.tr("Posts"));
    listHeader.setPadding(5);
    listHeader.setBackgroundColor("white");
    listHeader.setAllowGrowX(true);
    listHeader.setFont("bold");
    this._add(listHeader);

    // Create the stack for the list
    this.__stack = new qx.ui.container.Stack();
    this._add(this.__stack, {flex: 1});

    // create list view
    this.__list = new qx.ui.form.List();
    this.__list.setDecorator(null);
    this.__list.setSelectionMode("single");
    this.__list.setPadding(0);
    this.__list.setMargin(0);
    this.__stack.add(this.__list);

    // Create the loading image for the list
    this.__listLoadImage = new qx.ui.container.Composite(new qx.ui.layout.HBox(0, "center"));
    this.__listLoadImage.setBackgroundColor("white");
    var loadImage = new qx.ui.basic.Image("feedreader/images/loading66.gif");
    loadImage.setAlignY("middle");
    this.__listLoadImage.add(loadImage);
    this.__stack.add(this.__listLoadImage);
  },


  properties :
  {
    /** Determinates if the loading image should be shown */
    loading :
    {
      check : "Boolean",
      init: false,
      apply: "_applyLoading"
    }
  },


  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {
    // private members
    __stack : null,
    __list : null,
    __listLoadImage : null,


    // property apply
    _applyLoading: function(value, old) {
      if (value) {
        this.__stack.setSelection([this.__listLoadImage]);
      } else {
        this.__stack.setSelection([this.__list]);
      }
    },


    /**
     * Returns the list widget used in the list view of the feedreader.
     *
     * @return {qx.ui.form.List} The used List.
     */
    getList: function() {
      return this.__list;
    }
  },



  /*
   *****************************************************************************
      DESTRUCTOR
   *****************************************************************************
   */

  destruct : function()
  {
    this._disposeObjects("__list", "__stack", "__listLoadImage");
  }
});
