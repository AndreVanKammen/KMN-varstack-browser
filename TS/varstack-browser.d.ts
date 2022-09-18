
import { RecordVar } from "../../KMN-varstack.js/structures/record.js";
import { BaseVar } from "../../KMN-varstack.js/vars/base.js";
import { ArrayTableVarG } from "../../../TS/data-model.js";

export interface TableBuilderOptions<R> {
  alternativeBindings?: any;
  fieldNames?: string[];
  headerNames?: string[];
  skipHeader?: boolean;
  inlineEdit?: boolean;
  emptyRowForAdd?: boolean;
  onRowSelect?: (rec:R,ix:number)=>void;
  onRowClick?: (rec: R, ix: number) => void;
  onRowDblClick?: (rec: R, ix: number) => void;
  onFocusChange?: (isFocussed) => void;
  onRemoveConfirmation?: (rec: any) => Promise<boolean>;
  editList?: boolean;
  addButton?: boolean;
  deleteButton?: boolean;
  showFilterEdits?: boolean;
  showNumberFilters?: boolean;
  sortOnHeaderClick?: boolean;
  addClick?: any;
  initSelectedDiv?: (table: any, el:HTMLElement) => number;
}

export interface IRect {
  height: number;
  width: number;
  x: number;
  y: number;
}

export interface IClickEvent {
}

export interface IRectangle {
  dataWebGLComponentHash: number;
  getBoundingClientRect(): IRect;
  $getClippingParent() : IRectangle;

  $el<K extends keyof HTMLElementTagNameMap>(opt: {
    tag?: K;
    cls?: string;
  }): HTMLElementTagNameMap[K];

  // onclick: (ev:IClickEvent) => any;
}

type ArrayTableType<T> = T extends ArrayTableVarG<infer U> ? U: never;

// import { TableVar } from './table.js';
export class TableBuilderG<T extends ArrayTableVarG<R>, R extends RecordVar> {
  constructor(element: HTMLElement, table: T, options: TableBuilderOptions<R>);
  updateTable();
  // htmlRows: HTMLTableRowElement[]
  // constructor(element, table, options)

  // @ts-ignore
  // preEffects: ArrayTableVar;
  // postEffects: ArrayTableVar;
}


