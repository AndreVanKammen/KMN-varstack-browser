// Copyright by André van Kammen
// Licensed under CC BY-NC-SA
// https://creativecommons.org/licenses/by-nc-sa/4.0/

import PanelBase from '../../KMN-utils-browser/components/panel-base.js';
import { getOpenTasksTable } from '../../KMN-varstack.js/utils/parallel-tasks.js';
import { TableBuilder } from '../components/table-builder.js';
import { addCSS, kmnClassName } from '../utils/html-utils.js';

const cssStr = /*css*/`
.${kmnClassName}.taskViewTableDiv {
  top: 0;
  height: 100%;
}
`

const defaultOptions = {
};
class ParralelTaskView extends PanelBase {
  constructor(options) {
    super(defaultOptions, options);
  }

  /**
   * @param {HTMLElement} parentElement
   */
  initializeDOM(parentElement) {
    super.initializeDOM(parentElement);
    addCSS('task-view',cssStr);

    this.synthSearchTableDiv = this.parentElement.$el({ cls: "taskViewTableDiv" });


    this.searchTableEl = new TableBuilder(
      this.synthSearchTableDiv,
      getOpenTasksTable(),
      {
        fieldNames: this.options.fieldNames,
        alternativeBindings: this.options.alternativeBindings,
        inlineEdit: this.options.inlineEdit,
        onRowSelect: this.options.onRowSelect,
        onRowClick: this.options.onRowClick
      });
  }
}
ParralelTaskView.getTabName = () => 'TASK-VIEW';

export default ParralelTaskView;
